-- ============================================================
-- ReturnIQ (AI Returns Intelligence) Database Schema
-- Target Database: returniq
-- ============================================================

-- Step 1: Create the database
CREATE DATABASE IF NOT EXISTS returniq;
USE returniq;

-- ============================================================
-- TABLE 1: USERS
-- Stores login credentials, roles, and profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    role ENUM('customer', 'seller') NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 2: PRODUCTS
-- Stores product listings under various categories
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    return_health_score INT DEFAULT 100, -- Dynamic rating calculated from returns & reviews (0-100)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 3: ORDERS
-- Stores customer order history (required before a return can be made)
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    order_date DATE NOT NULL,
    price DECIMAL(10, 2) NOT NULL, -- The purchase price
    quantity INT NOT NULL DEFAULT 1,
    status ENUM('delivered', 'returned') DEFAULT 'delivered',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 4: RETURNS
-- Stores return requests and evaluation results from the AI Agent
-- ============================================================
CREATE TABLE IF NOT EXISTS returns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE, -- Ensures only 1 return request per order
    product_id INT NOT NULL,
    customer_id INT NOT NULL,
    return_date DATE NOT NULL,
    return_reason VARCHAR(255) NOT NULL,
    detailed_notes TEXT,
    image_url VARCHAR(500), -- Path to uploaded product photo (Cloudinary or fallback)
    status ENUM('pending', 'approved', 'rejected', 'manual_review') DEFAULT 'pending',
    
    -- AI Evaluation fields populated by the Return Intelligence Agent
    ai_risk_score INT DEFAULT NULL, -- 0 to 100 risk score
    ai_recommendation ENUM('approve', 'reject', 'manual_review') DEFAULT NULL,
    ai_insight TEXT DEFAULT NULL, -- Product Return Insight (isolated or recurring)
    ai_explanation TEXT DEFAULT NULL, -- Root cause explanation
    ai_confidence DECIMAL(3, 2) DEFAULT NULL, -- Confidence level (0.00 to 1.00)
    
    -- Seller Override fields
    final_decision ENUM('approve', 'reject', 'manual_review') DEFAULT NULL,
    overridden_by_seller BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 5: REVIEWS
-- Stores product reviews left by customers
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    customer_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 6: CHAT_HISTORY
-- Stores conversational log with the AI Assistant
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    sender ENUM('user', 'ai') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance optimization on common foreign keys and filters
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_product ON orders(product_id);
CREATE INDEX idx_returns_product ON returns(product_id);
CREATE INDEX idx_returns_customer ON returns(customer_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_chat_user ON chat_history(user_id);
