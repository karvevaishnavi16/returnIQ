// ============================================================
// FILE: backend/health-utils.js
// PURPOSE: Deterministic logic to recalculate a product's Return Health Score
// ============================================================

const { query } = require('./db');

/**
 * Calculates and updates the return_health_score for a single product.
 * Formula:
 * - Base Score: 100
 * - Penalty 1 (Return Rate): (Total Returns / Total Orders) * 100
 * - Penalty 2 (Bad Reviews): If average rating < 4.0, subtract (4.0 - avg_rating) * 10
 * - Final Score = MAX(0, Base - Penalty 1 - Penalty 2)
 * 
 * @param {number} productId 
 */
async function updateProductHealthScore(productId) {
  try {
    // 1. Get total orders for this product
    const [orderResult] = await query(
      'SELECT COUNT(*) as total_orders FROM orders WHERE product_id = ?',
      [productId]
    );
    const totalOrders = orderResult.total_orders || 0;

    // 2. Get total returns for this product
    // (We count all returns regardless of status, as a return request itself indicates an issue)
    const [returnResult] = await query(
      'SELECT COUNT(*) as total_returns FROM returns WHERE product_id = ?',
      [productId]
    );
    const totalReturns = returnResult.total_returns || 0;

    // 3. Get average rating for this product
    const [ratingResult] = await query(
      'SELECT AVG(rating) as avg_rating FROM reviews WHERE product_id = ?',
      [productId]
    );
    // If no reviews, default to 4.0 so there is no penalty
    const avgRating = ratingResult.avg_rating ? parseFloat(ratingResult.avg_rating) : 4.0;

    // --- MATH LOGIC ---
    let score = 100;

    // Calculate Return Rate Penalty
    if (totalOrders > 0) {
      const returnRate = totalReturns / totalOrders;
      const returnPenalty = Math.round(returnRate * 100);
      score -= returnPenalty;
    }

    // Calculate Bad Reviews Penalty
    if (avgRating < 4.0) {
      const ratingPenalty = Math.round((4.0 - avgRating) * 10);
      score -= ratingPenalty;
    }

    // Ensure score doesn't drop below 0
    score = Math.max(0, score);

    // 4. Update the product table
    await query(
      'UPDATE products SET return_health_score = ? WHERE id = ?',
      [score, productId]
    );

    console.log(`[Health Score] Product ${productId} updated to ${score} (Orders: ${totalOrders}, Returns: ${totalReturns}, Avg Rating: ${avgRating.toFixed(1)})`);

    return score;
  } catch (error) {
    console.error(`[Health Score] Error updating product ${productId}:`, error.message);
    // We don't want this utility to crash the main request loop
    return null;
  }
}

module.exports = {
  updateProductHealthScore
};
