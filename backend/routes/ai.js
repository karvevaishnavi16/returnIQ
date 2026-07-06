// ============================================================
// FILE: backend/routes/ai.js
// PURPOSE: AI Chatbot and Agent triggering routes
// ============================================================

const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { evaluateAndSaveReturn } = require('../ai-agent');
const { GoogleGenAI } = require('@google/genai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemini-2.0-flash';

// ============================================================
// POST /api/ai/trigger-evaluation
// Used for testing/manual triggering of the agent
// In production, this is called automatically when a return is submitted
// ============================================================
router.post('/trigger-evaluation', requireAuth, async (req, res) => {
  const { return_id } = req.body;

  if (!return_id) {
    return res.status(400).json({ error: 'return_id is required.' });
  }

  try {
    const result = await evaluateAndSaveReturn(return_id);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Trigger Evaluation Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/ai/chat
// Customer-facing chatbot. 
// Uses Gemini to answer questions about the store's products, 
// return policies, and the user's specific orders.
// ============================================================
router.post('/chat', requireAuth, async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    // 1. Save user's message to database
    await query(
      'INSERT INTO chat_history (user_id, message, sender) VALUES (?, ?, ?)',
      [userId, message, 'user']
    );

    // 2. Fetch recent chat history to provide conversation context to Gemini
    const history = await query(
      'SELECT message, sender FROM chat_history WHERE user_id = ? ORDER BY created_at ASC LIMIT 10',
      [userId]
    );

    // 3. Fetch user's active orders for context (so the bot knows what they bought)
    const orders = await query(
      `SELECT o.id, o.order_date, p.name as product_name, o.status
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE o.user_id = ?`,
      [userId]
    );
    const orderContext = orders.length > 0
      ? `User's Orders:\n${orders.map(o => `- Order #${o.id}: ${o.product_name} (${o.status})`).join('\n')}`
      : 'User has no orders.';

    // 4. System prompt combining context and personality
    const systemPrompt = `You are a helpful customer support chatbot for EliteMart.
Your job is to assist customers with their orders, returns, and general product questions.

Here is some context about the user you are talking to:
User Name: ${req.user.display_name}
${orderContext}

General Store Policies:
- Returns are accepted within 30 days of purchase.
- To initiate a return, the user should go to the 'My Orders' page and click 'Return Item'.
- Refunds take 3-5 business days to process after approval.

Keep your responses concise, friendly, and helpful. Do not use markdown styling like **bold** unless necessary. Use plain text formatting.`;

    // 5. Construct conversation history for Gemini
    const messages = history.map(msg => ({
      role: msg.sender === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.message }]
    }));

    // (If the history doesn't already include the current message, we add it. 
    // But since we just inserted it and fetched, it should be the last one.)

    // 6. Call Gemini
    const response = await ai.models.generateContent({
      model: MODEL,
      systemInstruction: systemPrompt,
      contents: messages
    });

    const aiMessage = response.text || "I'm sorry, I didn't understand that.";

    // 7. Save AI's response to database
    await query(
      'INSERT INTO chat_history (user_id, message, sender) VALUES (?, ?, ?)',
      [userId, aiMessage, 'ai']
    );

    return res.status(200).json({ reply: aiMessage });
  } catch (err) {
    console.error('Chat Error:', err.message);
    return res.status(500).json({ error: 'Failed to process chat message.' });
  }
});

// ============================================================
// GET /api/ai/chat
// Fetches the conversation history for the current user
// ============================================================
router.get('/chat', requireAuth, async (req, res) => {
  try {
    const history = await query(
      'SELECT id, message, sender, created_at FROM chat_history WHERE user_id = ? ORDER BY created_at ASC',
      [req.user.id]
    );
    return res.status(200).json({ history });
  } catch (err) {
    console.error('Get Chat History Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch chat history.' });
  }
});

module.exports = router;
