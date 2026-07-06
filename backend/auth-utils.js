// ============================================================
// FILE: backend/auth-utils.js
// PURPOSE: Security utilities for password hashing and JWT
// ============================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SALT_ROUNDS = 10;

// Hash a plain-text password
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Compare a plain-text password with a stored hash
async function comparePassword(plainPassword, hash) {
  return await bcrypt.compare(plainPassword, hash);
}

// Generate a short-lived Access Token (expires in 15 minutes)
function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
}

// Generate a long-lived Refresh Token (expires in 7 days)
function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

// Verify and decode a JWT. Returns the decoded payload or throws an error.
function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken
};
