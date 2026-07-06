// ============================================================
// FILE: backend/routes/customer.js
// PURPOSE: Customer-facing API endpoints
// ============================================================
// ENDPOINTS:
//   GET  /api/customer/products          — List all products with Return Health Score
//   GET  /api/customer/products/:id      — Single product details + reviews
//   GET  /api/customer/orders            — Customer's own order history
//   POST /api/customer/returns           — Submit a new return request
//   GET  /api/customer/returns           — Customer's own return history + status
//   POST /api/customer/reviews           — Submit a product review
// ============================================================

const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { requireCustomer, requireAuth } = require('../middleware/auth');
const { updateProductHealthScore } = require('../health-utils');
const { evaluateAndSaveReturn } = require('../ai-agent');

// Multer setup for optional image upload (Cloudinary or local fallback)
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist (local fallback storage)
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `return-${unique}${path.extname(file.originalname)}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const valid = allowed.test(path.extname(file.originalname).toLowerCase());
    valid ? cb(null, true) : cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed.'));
  }
});

// ============================================================
// GET /api/customer/products
// Returns all products with name, category, price, Return Health Score
// and the top return reasons for each product
// ============================================================
router.get('/products', async (req, res) => {
  try {
    const products = await query(
      `SELECT id, name, category, price, description, image_url, return_health_score
       FROM products
       ORDER BY category, name`
    );

    // For each product, fetch the top 3 most common return reasons
    for (const product of products) {
      const reasons = await query(
        `SELECT return_reason, COUNT(*) as count
         FROM returns
         WHERE product_id = ?
         GROUP BY return_reason
         ORDER BY count DESC
         LIMIT 3`,
        [product.id]
      );
      product.top_return_reasons = reasons.map(r => r.return_reason);

      // Also fetch average rating
      const ratingResult = await query(
        `SELECT ROUND(AVG(rating), 1) as avg_rating, COUNT(*) as total_reviews
         FROM reviews WHERE product_id = ?`,
        [product.id]
      );
      product.avg_rating = ratingResult[0].avg_rating || 0;
      product.total_reviews = ratingResult[0].total_reviews || 0;
    }

    return res.status(200).json({ products });
  } catch (err) {
    console.error('Get Products Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// ============================================================
// GET /api/customer/products/:id
// Returns a single product's details, all its reviews, and
// product-level return insights (aggregated stats)
// ============================================================
router.get('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const products = await query(
      `SELECT id, name, category, price, description, image_url, return_health_score
       FROM products WHERE id = ?`,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = products[0];

    // Fetch all reviews for this product
    const reviews = await query(
      `SELECT r.id, r.rating, r.review_text, r.review_date,
              u.display_name as reviewer_name
       FROM reviews r
       JOIN users u ON r.customer_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.review_date DESC`,
      [id]
    );

    // Fetch return stats for this product
    const returnStats = await query(
      `SELECT
         COUNT(*) as total_returns,
         ROUND(AVG(ai_risk_score), 0) as avg_risk_score,
         return_reason,
         COUNT(*) as reason_count
       FROM returns
       WHERE product_id = ?
       GROUP BY return_reason
       ORDER BY reason_count DESC`,
      [id]
    );

    const avgRating = await query(
      `SELECT ROUND(AVG(rating), 1) as avg_rating, COUNT(*) as total_reviews
       FROM reviews WHERE product_id = ?`,
      [id]
    );

    product.avg_rating = avgRating[0].avg_rating || 0;
    product.total_reviews = avgRating[0].total_reviews || 0;
    product.reviews = reviews;
    product.return_stats = returnStats;

    return res.status(200).json({ product });
  } catch (err) {
    console.error('Get Product Detail Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch product details.' });
  }
});

// ============================================================
// GET /api/customer/orders
// Returns the logged-in customer's order history
// ============================================================
router.get('/orders', requireCustomer, async (req, res) => {
  try {
    const orders = await query(
      `SELECT o.id, o.order_date, o.price, o.quantity, o.status,
              p.id as product_id, p.name as product_name,
              p.category, p.image_url
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE o.user_id = 2
       ORDER BY o.order_date DESC`
    );

    return res.status(200).json({ orders });
  } catch (err) {
    console.error('Get Orders Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// ============================================================
// POST /api/customer/returns
// Submit a new return request for an existing delivered order
// Triggers the AI agent to evaluate the return asynchronously
// ============================================================
router.post('/returns', requireCustomer, upload.single('image'), async (req, res) => {
  const { order_id, return_reason, detailed_notes } = req.body;

  if (!order_id || !return_reason) {
    return res.status(400).json({ error: 'Order ID and return reason are required.' });
  }

  try {
    // Verify the order belongs to this customer (hardcoded to 2) and is in 'delivered' status
    const orders = await query(
      `SELECT o.id, o.product_id, o.status
       FROM orders o
       WHERE o.id = ? AND o.user_id = 2`,
      [order_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orders[0];

    if (order.status === 'returned') {
      return res.status(409).json({ error: 'A return request has already been submitted for this order.' });
    }

    // Check if a return already exists for this order
    const existingReturn = await query(
      'SELECT id FROM returns WHERE order_id = ?',
      [order_id]
    );
    if (existingReturn.length > 0) {
      return res.status(409).json({ error: 'A return request already exists for this order.' });
    }

    // Handle image: use Cloudinary URL if file uploaded, otherwise null
    let image_url = null;
    if (req.file) {
      // Check if Cloudinary is configured
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
        const cloudinary = require('cloudinary').v2;
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET
        });
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'returniq/returns'
        });
        image_url = result.secure_url;
        // Delete local temp file after Cloudinary upload
        fs.unlinkSync(req.file.path);
      } else {
        // Local fallback: store path relative to uploads folder
        image_url = `/uploads/${req.file.filename}`;
      }
    }

    // Insert the return request with 'pending' status
    const result = await query(
      `INSERT INTO returns (order_id, product_id, customer_id, return_date, return_reason, detailed_notes, image_url, status)
       VALUES (?, ?, 2, CURDATE(), ?, ?, ?, 'pending')`,
      [order_id, order.product_id, return_reason, detailed_notes || null, image_url]
    );

    // Update the order status to 'returned'
    await query(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['returned', order_id]
    );

    // Recalculate health score for this product (new return added)
    await updateProductHealthScore(order.product_id);

    // Trigger AI evaluation asynchronously
    evaluateAndSaveReturn(result.insertId).catch(err => {
      console.error('Async AI Evaluation Error:', err.message);
    });

    return res.status(201).json({
      message: 'Return request submitted successfully. Our team will review it shortly.',
      returnId: result.insertId
    });
  } catch (err) {
    console.error('Submit Return Error:', err.message);
    return res.status(500).json({ error: 'Failed to submit return request.' });
  }
});

// ============================================================
// GET /api/customer/returns
// Returns the logged-in customer's return history with AI results
// ============================================================
router.get('/returns', requireCustomer, async (req, res) => {
  try {
    const returns = await query(
      `SELECT r.id, r.return_date, r.return_reason, r.detailed_notes,
              r.image_url, r.status,
              r.ai_risk_score, r.ai_recommendation, r.ai_insight, r.ai_explanation,
              p.id as product_id, p.name as product_name, p.image_url as product_image,
              o.order_date
       FROM returns r
       JOIN products p ON r.product_id = p.id
       JOIN orders o ON r.order_id = o.id
       WHERE r.customer_id = 2
       ORDER BY r.created_at DESC`
    );

    return res.status(200).json({ returns });
  } catch (err) {
    console.error('Get Returns Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch return history.' });
  }
});

// ============================================================
// POST /api/customer/reviews
// Submit a product review (only if the customer has ordered it)
// ============================================================
router.post('/reviews', requireCustomer, async (req, res) => {
  const { product_id, rating, review_text } = req.body;

  if (!product_id || !rating) {
    return res.status(400).json({ error: 'Product ID and rating are required.' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }

  try {
    // Verify the customer has actually ordered this product
    const orders = await query(
      'SELECT id FROM orders WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (orders.length === 0) {
      return res.status(403).json({ error: 'You can only review products you have ordered.' });
    }

    // Insert the review
    await query(
      `INSERT INTO reviews (product_id, customer_id, rating, review_text, review_date)
       VALUES (?, ?, ?, ?, CURDATE())`,
      [product_id, req.user.id, rating, review_text || null]
    );

    // Recalculate health score for this product (new review added)
    await updateProductHealthScore(product_id);

    return res.status(201).json({ message: 'Review submitted successfully. Thank you!' });
  } catch (err) {
    console.error('Submit Review Error:', err.message);
    return res.status(500).json({ error: 'Failed to submit review.' });
  }
});

module.exports = router;
