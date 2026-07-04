// ============================================================
// FILE: backend/middleware/auth.js
// PURPOSE: Middleware to protect routes using JWT verification
// ============================================================
// HOW IT WORKS:
// Every protected route passes through this middleware FIRST.
// 1. It reads the "Authorization: Bearer <token>" header
// 2. Verifies the token using our JWT_SECRET
// 3. Attaches decoded user info (id, role) to req.user
// 4. Calls next() to allow the request to continue
// If the token is missing or invalid, it returns 401 Unauthorized
// ============================================================

const { verifyToken } = require('../auth-utils');

// Middleware 1: requireAuth
// Verifies the JWT access token for any logged-in user (customer or seller)
function requireAuth(req, res, next) {
  // Read the Authorization header — expected format: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract just the token part

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Verify and decode the token using the access token secret
    const decoded = verifyToken(token, process.env.JWT_SECRET);

    // Attach user info to the request object for downstream route handlers
    // decoded contains: { id, email, role, iat, exp }
    req.user = decoded;

    next(); // Token is valid — continue to the route handler
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

// Middleware 2: requireSeller
// Stacks on top of requireAuth to ensure ONLY sellers can access a route
function requireSeller(req, res, next) {
  // requireAuth must run first to populate req.user
  requireAuth(req, res, () => {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ error: 'Access denied. Seller account required.' });
    }
    next();
  });
}

// Middleware 3: requireCustomer
// Stacks on top of requireAuth to ensure ONLY customers can access a route
function requireCustomer(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied. Customer account required.' });
    }
    next();
  });
}

module.exports = { requireAuth, requireSeller, requireCustomer };
