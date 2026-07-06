// ============================================================
// FILE: backend/ai-agent.js
// PURPOSE: Gemini-powered Return Intelligence Agent (tool-calling loop)
// ============================================================
// HOW IT WORKS:
// This is NOT a single prompt → response call.
// It is an AGENT LOOP where Gemini decides which tools to call
// and in what order based on what it discovers at each step.
//
// TOOLS AVAILABLE TO THE AGENT:
//   1. getCustomerReturnHistory(customerId)
//   2. getOrderDetails(orderId)
//   3. checkReasonConsistency(productCategory, statedReason)
//   4. getProductReturnStats(productId)
//   5. getProductReviews(productId)
//
// AGENT OUTPUT (structured JSON):
//   - risk_score           : 0–100 integer
//   - recommendation       : "approve" | "reject" | "manual_review"
//   - product_insight      : one-sentence product-level insight
//   - root_cause           : plain-language root cause explanation
//   - confidence           : 0.00–1.00 float
// ============================================================

const { GoogleGenAI } = require('@google/genai');
const { query } = require('./db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemini-2.0-flash';

// ============================================================
// SECTION 1: TOOL IMPLEMENTATIONS (Real DB queries)
// These are the actual functions executed when Gemini calls a tool
// ============================================================

async function getCustomerReturnHistory(customerId) {
  const rows = await query(
    `SELECT r.id, r.return_date, r.return_reason, r.status,
            p.name as product_name, p.category
     FROM returns r
     JOIN products p ON r.product_id = p.id
     WHERE r.customer_id = ?
     ORDER BY r.return_date DESC`,
    [customerId]
  );
  return {
    customerId,
    totalReturns: rows.length,
    returns: rows
  };
}

async function getOrderDetails(orderId) {
  const rows = await query(
    `SELECT o.id, o.order_date, o.price, o.quantity, o.status,
            p.id as product_id, p.name as product_name, p.category,
            u.id as customer_id, u.display_name as customer_name, u.email
     FROM orders o
     JOIN products p ON o.product_id = p.id
     JOIN users u ON o.user_id = u.id
     WHERE o.id = ?`,
    [orderId]
  );
  return rows.length > 0 ? rows[0] : { error: 'Order not found' };
}

async function checkReasonConsistency(productCategory, statedReason) {
  // Known common return reasons per category from industry patterns
  const categoryReasonMap = {
    'Footwear':        ['Wrong size', 'Defective', 'Quality poor', 'Not as described'],
    'Fashion/Clothing':['Wrong size', 'Wrong color', 'Quality poor', 'Not as described'],
    'Electronics':     ['Defective', 'Not working', 'Missing parts', 'Not as described'],
    'Home & Kitchen':  ['Defective', 'Quality poor', 'Missing parts', 'Not as described'],
    'Accessories':     ['Defective', 'Quality poor', 'Wrong color', 'Not as described']
  };

  const expectedReasons = categoryReasonMap[productCategory] || [];
  const isConsistent = expectedReasons.some(r =>
    statedReason.toLowerCase().includes(r.toLowerCase()) ||
    r.toLowerCase().includes(statedReason.toLowerCase())
  );

  return {
    productCategory,
    statedReason,
    isConsistent,
    commonReasonsForCategory: expectedReasons,
    assessment: isConsistent
      ? `"${statedReason}" is a common and expected return reason for ${productCategory} products.`
      : `"${statedReason}" is unusual for ${productCategory}. This may warrant closer inspection.`
  };
}

async function getProductReturnStats(productId) {
  const [stats] = await query(
    `SELECT
       COUNT(*) as total_returns,
       ROUND(AVG(ai_risk_score), 1) as avg_risk_score,
       p.return_health_score,
       p.name as product_name,
       p.category
     FROM products p
     LEFT JOIN returns r ON r.product_id = p.id
     WHERE p.id = ?
     GROUP BY p.id`,
    [productId]
  );

  const reasonBreakdown = await query(
    `SELECT return_reason, COUNT(*) as count
     FROM returns
     WHERE product_id = ?
     GROUP BY return_reason
     ORDER BY count DESC`,
    [productId]
  );

  return stats
    ? { ...stats, reasonBreakdown }
    : { error: 'Product not found', productId };
}

async function getProductReviews(productId) {
  const rows = await query(
    `SELECT r.rating, r.review_text, r.review_date, u.display_name as reviewer
     FROM reviews r
     JOIN users u ON r.customer_id = u.id
     WHERE r.product_id = ?
     ORDER BY r.review_date DESC`,
    [productId]
  );

  const [avg] = await query(
    'SELECT ROUND(AVG(rating), 2) as avg_rating FROM reviews WHERE product_id = ?',
    [productId]
  );

  return {
    productId,
    totalReviews: rows.length,
    avgRating: avg?.avg_rating || 0,
    reviews: rows
  };
}

// ============================================================
// SECTION 2: TOOL DEFINITIONS (Sent to Gemini so it knows what tools exist)
// ============================================================

const toolDefinitions = [
  {
    name: 'getCustomerReturnHistory',
    description: 'Fetches the complete return history for a customer. Use this to check if this customer is a frequent returner or if this is their first return.',
    parameters: {
      type: 'object',
      properties: {
        customerId: {
          type: 'number',
          description: 'The numeric ID of the customer.'
        }
      },
      required: ['customerId']
    }
  },
  {
    name: 'getOrderDetails',
    description: 'Fetches details about a specific order including the customer, product, purchase date, and price. Use this to verify the order is legitimate before evaluating the return.',
    parameters: {
      type: 'object',
      properties: {
        orderId: {
          type: 'number',
          description: 'The numeric ID of the order.'
        }
      },
      required: ['orderId']
    }
  },
  {
    name: 'checkReasonConsistency',
    description: 'Checks whether the customer\'s stated return reason makes sense for the product category. For example, "Wrong size" is expected for Footwear but unusual for Electronics.',
    parameters: {
      type: 'object',
      properties: {
        productCategory: {
          type: 'string',
          description: 'The category of the product being returned (e.g., Electronics, Footwear, Fashion/Clothing).'
        },
        statedReason: {
          type: 'string',
          description: 'The return reason stated by the customer.'
        }
      },
      required: ['productCategory', 'statedReason']
    }
  },
  {
    name: 'getProductReturnStats',
    description: 'Fetches aggregated return statistics for a product including total returns, return health score, and breakdown of return reasons. Use this to determine if the customer\'s complaint is a known recurring product issue.',
    parameters: {
      type: 'object',
      properties: {
        productId: {
          type: 'number',
          description: 'The numeric ID of the product.'
        }
      },
      required: ['productId']
    }
  },
  {
    name: 'getProductReviews',
    description: 'Fetches all customer reviews for a product including ratings and review text. Use this to see if other customers have mentioned the same issues as the returning customer.',
    parameters: {
      type: 'object',
      properties: {
        productId: {
          type: 'number',
          description: 'The numeric ID of the product.'
        }
      },
      required: ['productId']
    }
  }
];

// ============================================================
// SECTION 3: TOOL EXECUTOR
// Dispatches tool calls made by Gemini to the right function
// ============================================================

async function executeTool(toolName, toolArgs) {
  console.log(`[AI Agent] Executing tool: ${toolName}`, toolArgs);
  switch (toolName) {
    case 'getCustomerReturnHistory':
      return await getCustomerReturnHistory(toolArgs.customerId);
    case 'getOrderDetails':
      return await getOrderDetails(toolArgs.orderId);
    case 'checkReasonConsistency':
      return await checkReasonConsistency(toolArgs.productCategory, toolArgs.statedReason);
    case 'getProductReturnStats':
      return await getProductReturnStats(toolArgs.productId);
    case 'getProductReviews':
      return await getProductReviews(toolArgs.productId);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ============================================================
// SECTION 4: THE AGENT LOOP
// Main function — runs the full investigation for a return request
// ============================================================

async function runReturnAgent(returnRequest) {
  const {
    id: returnId,
    order_id,
    product_id,
    customer_id,
    return_reason,
    detailed_notes,
    return_date
  } = returnRequest;

  console.log(`\n[AI Agent] Starting investigation for Return #${returnId}`);

  // Build the initial prompt describing the case to the agent
  const systemPrompt = `You are ReturnIQ, an AI return intelligence agent for EliteMart, a multi-category e-commerce store.
Your job is to investigate return requests by calling the available tools, then produce a final structured JSON evaluation.

INVESTIGATION STEPS:
1. Call getOrderDetails to verify the order is legitimate
2. Call getCustomerReturnHistory to check if this customer returns items frequently
3. Call checkReasonConsistency to verify the stated reason matches the product category
4. Call getProductReturnStats to determine if there is a known recurring product defect
5. Call getProductReviews to check if other customers mention the same issue

Once you have gathered enough information, respond with ONLY a JSON object in this exact format:
{
  "risk_score": <integer 0-100>,
  "recommendation": "<approve|reject|manual_review>",
  "product_insight": "<one sentence: is this an isolated case or a recurring product issue?>",
  "root_cause": "<2-3 sentences explaining the most likely cause of this return in plain language>",
  "confidence": <float 0.00-1.00>
}

SCORING GUIDELINES:
- risk_score 0-30: Low risk, likely approve
- risk_score 31-60: Medium risk, consider manual review
- risk_score 61-100: High risk (frequent returner OR known defective product)
- Recommend "reject" only if there is strong evidence of abuse (e.g. >5 prior returns with no defect pattern)
- Recommend "manual_review" when signals are mixed or unclear
- Recommend "approve" when the reason is consistent and/or a product defect is confirmed`;

  const userMessage = `Please investigate this return request:
- Return ID: ${returnId}
- Order ID: ${order_id}
- Product ID: ${product_id}
- Customer ID: ${customer_id}
- Return Reason: ${return_reason}
- Customer Notes: ${detailed_notes || 'None provided'}
- Return Date: ${return_date}`;

  // Build the initial message history
  const messages = [
    { role: 'user', content: userMessage }
  ];

  // ---- THE AGENT LOOP ----
  const MAX_ITERATIONS = 8; // Safety cap to prevent infinite loops
  let iteration = 0;
  let finalResult = null;

  try {
    while (iteration < MAX_ITERATIONS) {
      iteration++;
      console.log(`[AI Agent] Iteration ${iteration}`);

      // Send current conversation to Gemini with tool definitions
      const response = await ai.models.generateContent({
        model: MODEL,
        systemInstruction: systemPrompt,
        contents: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        })),
        tools: [{ functionDeclarations: toolDefinitions }],
        config: {
          temperature: 0.2 // Low temperature for consistent, factual reasoning
        }
      });

      const candidate = response.candidates?.[0];
      if (!candidate) throw new Error('No response from Gemini.');

      const parts = candidate.content?.parts || [];

      // Check if Gemini wants to call any tools
      const functionCalls = parts.filter(p => p.functionCall);

      if (functionCalls.length > 0) {
        // Gemini called one or more tools — execute them all
        const toolResultParts = [];

        for (const part of functionCalls) {
          const { name, args } = part.functionCall;
          const toolResult = await executeTool(name, args);

          toolResultParts.push({
            functionResponse: {
              name,
              response: { result: toolResult }
            }
          });
        }

        // Add Gemini's tool call message and our tool results back to the conversation
        messages.push({
          role: 'model',
          content: JSON.stringify(functionCalls.map(p => p.functionCall))
        });
        messages.push({
          role: 'user',
          content: JSON.stringify(toolResultParts.map(p => p.functionResponse))
        });

      } else {
        // No tool calls — Gemini has produced its final text response
        const textPart = parts.find(p => p.text);
        if (!textPart) throw new Error('No text response from Gemini.');

        const rawText = textPart.text.trim();
        console.log('[AI Agent] Final response received.');

        // Extract JSON from the response (strip any markdown code fences if present)
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Agent did not return valid JSON.');

        finalResult = JSON.parse(jsonMatch[0]);

        // Validate all required fields are present
        const required = ['risk_score', 'recommendation', 'product_insight', 'root_cause', 'confidence'];
        for (const field of required) {
          if (finalResult[field] === undefined) {
            throw new Error(`Missing field in agent response: ${field}`);
          }
        }

        console.log(`[AI Agent] Evaluation complete — Risk: ${finalResult.risk_score}, Recommendation: ${finalResult.recommendation}`);
        break; // Exit the loop
      }
    }

    if (!finalResult) {
      throw new Error('Agent loop exceeded maximum iterations without producing a result.');
    }

    return { success: true, result: finalResult };

  } catch (err) {
    console.error('[AI Agent] Error during investigation:', err.message);
    return {
      success: false,
      error: err.message,
      result: {
        risk_score: 50,
        recommendation: 'manual_review',
        product_insight: 'AI evaluation failed. Manual review required.',
        root_cause: 'The AI agent encountered an error during investigation. A human reviewer should assess this return.',
        confidence: 0.0
      }
    };
  }
}

// ============================================================
// SECTION 5: SAVE AGENT RESULTS TO DATABASE
// After the agent runs, persist the evaluation to the returns table
// ============================================================

async function evaluateAndSaveReturn(returnId) {
  // Fetch the full return record from the DB
  const returns = await query(
    `SELECT r.*, o.id as order_id
     FROM returns r
     JOIN orders o ON r.order_id = o.id
     WHERE r.id = ?`,
    [returnId]
  );

  if (returns.length === 0) {
    throw new Error(`Return #${returnId} not found in database.`);
  }

  const returnRequest = returns[0];

  // Run the agent loop
  const { success, result } = await runReturnAgent(returnRequest);

  // Map recommendation string to status enum
  const statusMap = {
    approve: 'approved',
    reject: 'rejected',
    manual_review: 'manual_review'
  };
  const newStatus = statusMap[result.recommendation] || 'manual_review';

  // Persist the AI evaluation back to the returns table
  await query(
    `UPDATE returns SET
       ai_risk_score    = ?,
       ai_recommendation = ?,
       ai_insight       = ?,
       ai_explanation   = ?,
       ai_confidence    = ?,
       status           = ?
     WHERE id = ?`,
    [
      result.risk_score,
      result.recommendation,
      result.product_insight,
      result.root_cause,
      result.confidence,
      newStatus,
      returnId
    ]
  );

  // If approved, also mark the order as returned
  if (newStatus === 'approved') {
    await query(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['returned', returnRequest.order_id]
    );
  }

  console.log(`[AI Agent] Return #${returnId} evaluated and saved. Status: ${newStatus}`);
  return { success, result, status: newStatus };
}

module.exports = { runReturnAgent, evaluateAndSaveReturn };
