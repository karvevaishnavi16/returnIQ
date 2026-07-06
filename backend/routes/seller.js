// ============================================================
// FILE: backend/routes/seller.js
// PURPOSE: Seller dashboard API — returns management & analytics
// ============================================================
// ENDPOINTS:
//   GET   /api/seller/returns              — All return requests (with AI data)
//   GET   /api/seller/returns/:id          — Single return request detail
//   PATCH /api/seller/returns/:id/status   — Approve, reject, or override
//   GET   /api/seller/analytics/overview   — High-level stats (totals)
//   GET   /api/seller/analytics/reasons    — Top return reasons by count
//   GET   /api/seller/analytics/trends     — Returns over time (last 30 days)
//   GET   /api/seller/analytics/products   — Per-product return health scores
// ============================================================

const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { requireSeller } = require('../middleware/auth');
const { updateProductHealthScore } = require('../health-utils');

// All routes in this file require a valid seller login
router.use(requireSeller);

// ============================================================
// GET /api/seller/returns
// Lists all return requests across all customers
// Supports ?status= filter (pending, approved, rejected, manual_review)
// ============================================================
router.get('/returns', async (req, res) => {
  const { status } = req.query;

  try {
    let sql = `
      SELECT
        r.id, r.return_date, r.return_reason, r.detailed_notes,
        r.image_url, r.status,
        r.ai_risk_score, r.ai_recommendation,
        r.ai_insight, r.ai_explanation, r.ai_confidence,
        p.id as product_id, p.name as product_name,
        p.category, p.image_url as product_image,
        u.id as customer_id, u.display_name as customer_name, u.email as customer_email,
        o.id as order_id, o.order_date, o.price as order_price
      FROM returns r
      JOIN products p ON r.product_id = p.id
      JOIN users u ON r.customer_id = u.id
      JOIN orders o ON r.order_id = o.id
    `;
    const params = [];

    if (status) {
      sql += ' WHERE r.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY r.created_at DESC';

    const returns = await query(sql, params);
    return res.status(200).json({ returns });
  } catch (err) {
    console.error('Seller Get Returns Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch return requests.' });
  }
});

// ============================================================
// GET /api/seller/returns/:id
// Full detail of a single return request including customer history
// ============================================================
router.get('/returns/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const returns = await query(
      `SELECT
        r.id, r.return_date, r.return_reason, r.detailed_notes,
        r.image_url, r.status,
        r.ai_risk_score, r.ai_recommendation,
        r.ai_insight, r.ai_explanation, r.ai_confidence,
        p.id as product_id, p.name as product_name, p.category,
        p.image_url as product_image, p.return_health_score,
        u.id as customer_id, u.display_name as customer_name, u.email as customer_email,
        o.id as order_id, o.order_date, o.price as order_price
       FROM returns r
       JOIN products p ON r.product_id = p.id
       JOIN users u ON r.customer_id = u.id
       JOIN orders o ON r.order_id = o.id
       WHERE r.id = ?`,
      [id]
    );

    if (returns.length === 0) {
      return res.status(404).json({ error: 'Return request not found.' });
    }

    const returnRequest = returns[0];

    // Fetch this customer's full return history for context
    const customerHistory = await query(
      `SELECT r.id, r.return_date, r.return_reason, r.status,
              p.name as product_name, p.category
       FROM returns r
       JOIN products p ON r.product_id = p.id
       WHERE r.customer_id = ? AND r.id != ?
       ORDER BY r.return_date DESC`,
      [returnRequest.customer_id, id]
    );

    // Fetch all returns for this product (to show pattern)
    const productReturns = await query(
      `SELECT return_reason, COUNT(*) as count
       FROM returns
       WHERE product_id = ?
       GROUP BY return_reason
       ORDER BY count DESC`,
      [returnRequest.product_id]
    );

    return res.status(200).json({
      returnRequest,
      customerHistory,
      productReturnPattern: productReturns
    });
  } catch (err) {
    console.error('Seller Get Return Detail Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch return details.' });
  }
});

// ============================================================
// PATCH /api/seller/returns/:id/status
// Seller manually approves, rejects, or flags for manual review
// This overrides the AI recommendation
// ============================================================
router.patch('/returns/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['approved', 'rejected', 'manual_review'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  try {
    const existing = await query('SELECT id, product_id, ai_recommendation FROM returns WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Return request not found.' });
    }

    const returnRequest = existing[0];
    const aiRecommendation = returnRequest.ai_recommendation;
    
    // Map AI's string 'approve'/'reject' to our standard statuses for comparison if needed
    // The seller is providing the final decision here
    const overridden = (aiRecommendation && aiRecommendation !== status) ? true : false;

    // We keep `status` updated for the workflow, and ALSO save the `final_decision` and `overridden_by_seller`
    await query(
      'UPDATE returns SET status = ?, final_decision = ?, overridden_by_seller = ? WHERE id = ?', 
      [status, status, overridden, id]
    );

    // If approved, also update the order status to 'returned'
    if (status === 'approved') {
      await query(
        'UPDATE orders SET status = ? WHERE id = (SELECT order_id FROM returns WHERE id = ?)',
        ['returned', id]
      );
    }
    
    // Recalculate health score for this product (since return status changed)
    await updateProductHealthScore(returnRequest.product_id);

    return res.status(200).json({
      message: `Return request has been marked as "${status}".`
    });
  } catch (err) {
    console.error('Seller Update Return Status Error:', err.message);
    return res.status(500).json({ error: 'Failed to update return status.' });
  }
});

// ============================================================
// GET /api/seller/analytics/overview
// High-level numbers for the dashboard summary cards
// ============================================================
router.get('/analytics/overview', async (req, res) => {
  try {
    const [totals] = await query(
      `SELECT
        COUNT(*) as total_returns,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'manual_review' THEN 1 ELSE 0 END) as manual_review_count,
        SUM(CASE WHEN ai_risk_score >= 70 THEN 1 ELSE 0 END) as high_risk_count,
        ROUND(AVG(ai_risk_score), 1) as avg_risk_score
       FROM returns`
    );

    const [productCount] = await query('SELECT COUNT(*) as total FROM products');
    const [orderCount] = await query('SELECT COUNT(*) as total FROM orders');

    return res.status(200).json({
      overview: {
        ...totals,
        total_products: productCount.total,
        total_orders: orderCount.total
      }
    });
  } catch (err) {
    console.error('Analytics Overview Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch analytics overview.' });
  }
});

// ============================================================
// GET /api/seller/analytics/reasons
// Top return reasons across the entire store (for bar/pie chart)
// ============================================================
router.get('/analytics/reasons', async (req, res) => {
  try {
    const reasons = await query(
      `SELECT
        return_reason,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM returns), 1) as percentage
       FROM returns
       GROUP BY return_reason
       ORDER BY count DESC`
    );

    // Also break it down by category
    const byCategory = await query(
      `SELECT
        p.category,
        r.return_reason,
        COUNT(*) as count
       FROM returns r
       JOIN products p ON r.product_id = p.id
       GROUP BY p.category, r.return_reason
       ORDER BY p.category, count DESC`
    );

    return res.status(200).json({ reasons, byCategory });
  } catch (err) {
    console.error('Analytics Reasons Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch return reasons.' });
  }
});

// ============================================================
// GET /api/seller/analytics/trends
// Return volume per day over the last 30 days (for line chart)
// ============================================================
router.get('/analytics/trends', async (req, res) => {
  try {
    const trends = await query(
      `SELECT
        DATE(return_date) as date,
        COUNT(*) as total_returns,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
       FROM returns
       WHERE return_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(return_date)
       ORDER BY date ASC`
    );

    return res.status(200).json({ trends });
  } catch (err) {
    console.error('Analytics Trends Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch return trends.' });
  }
});

// ============================================================
// GET /api/seller/analytics/products
// Per-product return health scores and return stats
// ============================================================
router.get('/analytics/products', async (req, res) => {
  try {
    const products = await query(
      `SELECT
        p.id, p.name, p.category, p.return_health_score,
        COUNT(r.id) as total_returns,
        ROUND(AVG(r.ai_risk_score), 1) as avg_risk_score,
        ROUND(AVG(rv.rating), 1) as avg_rating
       FROM products p
       LEFT JOIN returns r ON r.product_id = p.id
       LEFT JOIN reviews rv ON rv.product_id = p.id
       GROUP BY p.id
       ORDER BY p.return_health_score ASC`
    );

    return res.status(200).json({ products });
  } catch (err) {
    console.error('Analytics Products Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch product analytics.' });
  }
});

module.exports = router;
