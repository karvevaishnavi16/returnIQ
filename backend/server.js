// ============================================================
// FILE: backend/server.js
// PURPOSE: Main application entry point for ReturnIQ API
// ============================================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const sellerRoutes = require('./routes/seller');
const aiRoutes = require('./routes/ai');

const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors()); // Allow frontend to make requests
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically (local fallback for Cloudinary)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// ROUTES
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'ReturnIQ API is running.' });
});

// Fallback for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(`\n=================================`);
  console.log(`🚀 ReturnIQ API Server started!`);
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`=================================\n`);
});
