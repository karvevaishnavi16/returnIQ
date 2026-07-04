// ============================================================
// FILE: backend/routes/auth.js
// PURPOSE: Authentication routes — register, login, refresh, me
// ============================================================
// ENDPOINTS:
//   POST /api/auth/register  — Create a new customer account
//   POST /api/auth/login     — Login for both customers and sellers
//   POST /api/auth/refresh   — Get a new access token using refresh token
//   GET  /api/auth/me        — Get current logged-in user's profile
// ============================================================

const express = require('express');
const router = express.Router();
const { query } = require('../db');
const {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken
} = require('../auth-utils');
const { requireAuth } = require('../middleware/auth');

// ============================================================
// POST /api/auth/register
// Creates a new customer account
// Only customers can self-register. The seller account is pre-seeded.
// ============================================================
router.post('/register', async (req, res) => {
  const { email, display_name, password } = req.body;

  // Validate all required fields are present
  if (!email || !display_name || !password) {
    return res.status(400).json({ error: 'Email, display name, and password are required.' });
  }

  // Enforce minimum password length
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    // Check if an account with this email already exists
    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash the password before storing it
    const password_hash = await hashPassword(password);

    // Insert the new user into the database as a 'customer'
    const result = await query(
      'INSERT INTO users (email, display_name, role, password_hash) VALUES (?, ?, ?, ?)',
      [email, display_name, 'customer', password_hash]
    );

    // Return success with the new user's ID
    return res.status(201).json({
      message: 'Account created successfully.',
      userId: result.insertId
    });
  } catch (err) {
    console.error('Register Error:', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ============================================================
// POST /api/auth/login
// Login for both customers and sellers
// Returns an access token and a refresh token
// ============================================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Find user by email
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];

    // Compare submitted password against the stored hash
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Build token payload — this data will be available in req.user on protected routes
    const tokenPayload = {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      role: user.role
    };

    // Issue both tokens
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Return tokens and user info to the frontend
    return res.status(200).json({
      message: 'Login successful.',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login Error:', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ============================================================
// POST /api/auth/refresh
// Issues a new access token when the old one expires
// The frontend sends the refresh token in the request body
// ============================================================
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required.' });
  }

  try {
    // Verify the refresh token using the refresh secret
    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Issue a fresh access token with the same user info
    const newAccessToken = generateAccessToken({
      id: decoded.id,
      email: decoded.email,
      display_name: decoded.display_name,
      role: decoded.role
    });

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token. Please log in again.' });
  }
});

// ============================================================
// GET /api/auth/me
// Returns the currently logged-in user's profile
// Requires a valid access token in the Authorization header
// ============================================================
router.get('/me', requireAuth, async (req, res) => {
  try {
    // req.user is populated by the requireAuth middleware
    const users = await query(
      'SELECT id, email, display_name, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({ user: users[0] });
  } catch (err) {
    console.error('Me Error:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
