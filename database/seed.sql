-- ============================================================
-- ReturnIQ (AI Returns Intelligence) Seed Data
-- Target Database: returniq
-- Password for all seeded users: password123
-- Bcrypt Hash: $2b$10$EPYp/D07n7Q2g7u2G9Xy9OHRmWbB1DvZv5m6L8gHqL9xXb6D2fPDe
-- ============================================================

USE returniq;

-- Clear any existing data in correct order of dependency
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE chat_history;
TRUNCATE TABLE reviews;
TRUNCATE TABLE returns;
TRUNCATE TABLE orders;
TRUNCATE TABLE products;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. SEED USERS
-- ============================================================
INSERT INTO users (id, email, display_name, role, password_hash) VALUES
(1, 'owner@elitemart.com', 'EliteMart Seller', 'seller', '$2b$10$EPYp/D07n7Q2g7u2G9Xy9OHRmWbB1DvZv5m6L8gHqL9xXb6D2fPDe'),
(2, 'john.doe@gmail.com', 'John Doe', 'customer', '$2b$10$EPYp/D07n7Q2g7u2G9Xy9OHRmWbB1DvZv5m6L8gHqL9xXb6D2fPDe'),
(3, 'jane.smith@yahoo.com', 'Jane Smith', 'customer', '$2b$10$EPYp/D07n7Q2g7u2G9Xy9OHRmWbB1DvZv5m6L8gHqL9xXb6D2fPDe'),
(4, 'bob.johnson@outlook.com', 'Bob Johnson', 'customer', '$2b$10$EPYp/D07n7Q2g7u2G9Xy9OHRmWbB1DvZv5m6L8gHqL9xXb6D2fPDe'),
(5, 'alice.williams@gmail.com', 'Alice Williams', 'customer', '$2b$10$EPYp/D07n7Q2g7u2G9Xy9OHRmWbB1DvZv5m6L8gHqL9xXb6D2fPDe');

-- ============================================================
-- 2. SEED PRODUCTS
-- ============================================================
INSERT INTO products (id, name, category, price, description, image_url, return_health_score) VALUES
-- Category: Electronics
(1, 'SoundWave Max Wireless Headphones', 'Electronics', 4999.00, 'Premium over-ear noise-cancelling headphones with 40-hour battery life.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 88),
(2, 'AstroWear Smartwatch v2', 'Electronics', 7999.00, 'Fitness smartwatch tracking heart rate, steps, and sleep with OLED touch display.', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', 70),
(11, 'FitGlow Smart Ring', 'Electronics', 12999.00, 'Sleek titanium smart ring tracking sleep, heart rate, and body temperature.', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500', 85),
(14, 'ProCharge 20K Power Bank', 'Electronics', 1899.00, 'High-capacity 20000mAh external battery pack with 22.5W fast charging.', 'https://images.unsplash.com/photo-1609592424109-dd9892f1b17c?w=500', 92),

-- Category: Fashion/Clothing
(3, 'Elite Fit Men\'s Cotton Polo T-Shirt', 'Fashion/Clothing', 1299.00, '100% combed cotton classic polo shirt, breathable and stylish.', 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500', 92),
(4, 'Classic Indigo Denim Jacket', 'Fashion/Clothing', 3499.00, 'Heavyweight washed indigo denim jacket with button closures and chest pockets.', 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500', 74),
(15, 'UltraSoft Cotton Hoodie', 'Fashion/Clothing', 2299.00, 'Cozy fleece-lined pullover hoodie with adjustable drawstring and kangaroo pocket.', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500', 68),

-- Category: Home & Kitchen
(5, 'ChefPro Non-Stick Cookware Set (5-Piece)', 'Home & Kitchen', 5999.00, 'Non-stick aluminum pots and pans set with heat-resistant handles.', 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500', 65),
(6, 'AromaDiffuser Ultrasonic Humidifier', 'Home & Kitchen', 1999.00, 'Quiet ultrasonic cool mist humidifier with 7-color LED lights and auto-shutoff.', 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=500', 95),
(16, 'DailyGrind Electric Coffee Grinder', 'Home & Kitchen', 2799.00, 'Stainless steel blades electric grinder for coffee beans, spices, and nuts.', 'https://images.unsplash.com/photo-1574483767545-420a402324a9?w=500', 76),

-- Category: Accessories
(7, 'UrbanTraveler Waterproof Backpack', 'Accessories', 2499.00, 'Heavy-duty water-resistant laptop backpack with USB charging port.', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 82),
(8, 'Premium Leather Bi-fold Wallet', 'Accessories', 1499.00, 'Genuine top-grain leather wallet with RFID blocking pockets.', 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500', 90),
(12, 'EcoEarth Reusable Cotton Tote Bags (3-Pack)', 'Accessories', 799.00, '100% organic cotton reusable grocery tote bags, heavy duty and machine washable.', 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500', 98),

-- Category: Footwear
(9, 'Apex Run Men\'s Running Shoes', 'Footwear', 3999.00, 'Lightweight mesh running shoes with responsive foam cushioning.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 58),
(10, 'SoleComfort Women\'s Walking Flats', 'Footwear', 2199.00, 'Slip-on memory foam flats for all-day comfortable standing.', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500', 79),
(13, 'TrailBlazer Outdoor Hiking Boots', 'Footwear', 5499.00, 'Waterproof trail hiking boots with high-traction rubber outsole.', 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=500', 72);

-- ============================================================
-- 3. SEED ORDERS
-- ============================================================
-- Seeding orders representing sales. Some are delivered, others have been returned.
INSERT INTO orders (id, user_id, product_id, order_date, price, quantity, status) VALUES
-- John Doe (user 2) Orders
(1, 2, 1, '2026-06-01', 4999.00, 1, 'delivered'),
(2, 2, 3, '2026-06-05', 1299.00, 2, 'delivered'),
(3, 2, 9, '2026-06-15', 3999.00, 1, 'returned'), -- Returned due to narrow fit
(4, 2, 5, '2026-06-20', 5999.00, 1, 'returned'), -- Returned due to peeling coating
(23, 2, 13, '2026-06-22', 5499.00, 1, 'delivered'), -- TrailBlazer Boots
(27, 2, 16, '2026-06-29', 2799.00, 1, 'delivered'), -- Will be returned (Pending return request)

-- Jane Smith (user 3) Orders
(5, 3, 2, '2026-06-02', 7999.00, 1, 'returned'), -- Returned due to battery dying
(6, 3, 6, '2026-06-04', 1999.00, 1, 'delivered'),
(7, 3, 7, '2026-06-10', 2499.00, 1, 'delivered'),
(8, 3, 4, '2026-06-25', 3499.00, 1, 'returned'), -- Returned due to color mismatch
(24, 3, 13, '2026-06-18', 5499.00, 1, 'returned'), -- Returned due to stiff ankle

-- Bob Johnson (user 4) Orders
(9, 4, 9, '2026-06-02', 3999.00, 1, 'returned'), -- Returned due to narrow fit
(10, 4, 10, '2026-06-08', 2199.00, 1, 'delivered'),
(11, 4, 1, '2026-06-12', 4999.00, 1, 'delivered'),
(12, 4, 2, '2026-06-28', 7999.00, 1, 'delivered'), -- Will be returned (Pending return request)
(21, 4, 11, '2026-06-25', 12999.00, 1, 'delivered'), -- FitGlow Smart Ring
(25, 4, 14, '2026-06-26', 1899.00, 1, 'delivered'), -- ProCharge Power Bank

-- Alice Williams (user 5) Orders
(13, 5, 8, '2026-06-01', 1499.00, 1, 'delivered'),
(14, 5, 9, '2026-06-03', 3999.00, 1, 'returned'), -- Returned due to size/narrow
(15, 5, 5, '2026-06-15', 5999.00, 1, 'returned'), -- Returned due to peeling
(16, 5, 3, '2026-06-22', 1299.00, 1, 'delivered'),
(17, 5, 4, '2026-06-29', 3499.00, 1, 'delivered'), -- Will be returned (Pending return request)
(22, 5, 12, '2026-06-27', 799.00, 2, 'delivered'), -- EcoEarth Tote Bags
(26, 5, 15, '2026-06-20', 2299.00, 1, 'returned'), -- Returned due to shrinking hoodie

-- Additional orders to show sales data
(18, 2, 8, '2026-06-28', 1499.00, 1, 'delivered'),
(19, 3, 10, '2026-06-29', 2199.00, 1, 'delivered'),
(20, 4, 3, '2026-06-30', 1299.00, 1, 'delivered');


-- ============================================================
-- 4. SEED RETURNS
-- ============================================================
-- Seeding completed returns, and pending returns.
INSERT INTO returns (id, order_id, product_id, customer_id, return_date, return_reason, detailed_notes, image_url, status, ai_risk_score, ai_recommendation, ai_insight, ai_explanation, ai_confidence) VALUES
-- Historical Approved Returns
(1, 3, 9, 2, '2026-06-18', 'Wrong size', 'The shoes are way too narrow in the front toe box. My toes were completely pinched. Otherwise quality seems fine but I cannot wear them.', NULL, 'approved', 45, 'approve', 'Isolated sizing mismatch. User reported shoes are too narrow.', 'Verified user purchase. Sizing issues are common for footwear and align with historical product data.', 0.90),
(2, 4, 5, 2, '2026-06-23', 'Quality poor', 'The non-stick coating started peeling off the frying pan after the very first hand wash! Very dangerous, I am afraid of metal chemicals mixing in food.', NULL, 'approved', 85, 'approve', 'Recurring quality concern. Coating peeling off.', 'High risk. Multiple reviews confirm the non-stick coating on this ChefPro set degrades rapidly.', 0.95),
(3, 5, 2, 3, '2026-06-05', 'Defective', 'The watch battery does not even last 3 hours from a full charge. The screen goes black randomly and won\'t sync to my phone.', NULL, 'approved', 75, 'approve', 'Defective hardware: battery failure.', 'Confirmed smartwatch battery failure. Multiple users report issues with sleep sync and short battery life.', 0.88),
(4, 8, 4, 3, '2026-06-28', 'Wrong color', 'The denim jacket pictured on the store is a vibrant classic indigo, but the jacket I received looks extremely faded, almost light greyish blue. Unhappy with the color.', NULL, 'approved', 30, 'approve', 'Cosmetic mismatch. Faded color received.', 'Low risk. Minor color shade discrepancies are common in textile washes.', 0.85),
(5, 9, 9, 4, '2026-06-06', 'Wrong size', 'Ordered size UK 9 but it fits much smaller and is very tight near the front. Need to return and buy elsewhere.', NULL, 'approved', 45, 'approve', 'Sizing mismatch. Toe box too tight.', 'Verified purchase. Sizing issue aligns with other footwear complaints.', 0.90),
(6, 14, 9, 5, '2026-06-07', 'Wrong size', 'The running shoes are extremely tight on the sides. Size is correct but the design is far too narrow.', NULL, 'approved', 50, 'approve', 'Sizing mismatch. Narrow design.', 'Sizing/fit complaint matches previous returns for this product.', 0.92),
(7, 15, 5, 5, '2026-06-20', 'Quality poor', 'Coating scraped off immediately when cooking eggs. Definitely not premium quality.', NULL, 'approved', 88, 'approve', 'Defective surface coating.', 'Second instance of coating failure for this batch. High risk pattern.', 0.94),
(10, 24, 13, 3, '2026-06-22', 'Wrong size', 'The hiking boots are extremely stiff around the ankles, causing serious blisters. Size fits but the material is unwearable.', NULL, 'approved', 40, 'approve', 'Stiff ankle support issue.', 'Common break-in complaint, but approved under customer satisfaction policy.', 0.85),
(11, 26, 15, 5, '2026-06-25', 'Quality poor', 'I washed this hoodie once in cold water and it shrank by almost two sizes! I can no longer fit into it.', NULL, 'approved', 60, 'approve', 'Fabric shrinkage issue.', 'Pre-shrunk cotton failure. Product quality concern confirmed.', 0.88);

-- Pending Returns (Waiting for AI Agent / Seller Action)
INSERT INTO returns (id, order_id, product_id, customer_id, return_date, return_reason, detailed_notes, image_url, status) VALUES
(8, 12, 2, 4, '2026-07-01', 'Defective', 'The smartwatch screen keeps flickering and the bluetooth disconnects every few minutes. I cannot pair it with my Android phone anymore.', 'https://res.cloudinary.com/demo/image/upload/v12345/watch_defect.jpg', 'pending'),
(9, 17, 4, 5, '2026-07-02', 'Wrong color', 'The color of the jacket is much lighter than shown in the website photographs. It looks washed out.', NULL, 'pending'),
(12, 27, 16, 2, '2026-07-02', 'Defective', 'The coffee grinder motor completely stopped spinning. It hums when plugged in and pressed, but the blades do not spin. Seems like the motor is seized.', NULL, 'pending');


-- ============================================================
-- 5. SEED REVIEWS
-- ============================================================
INSERT INTO reviews (id, product_id, customer_id, rating, review_text, review_date) VALUES
-- SoundWave Max Wireless Headphones
(1, 1, 2, 5, 'Absolutely love these! The active noise cancellation is amazing and the sound quality is top-notch.', '2026-06-05'),
(2, 1, 3, 4, 'Great battery life and comfortable ear cups. A bit bulky, but worth the price.', '2026-06-12'),

-- AstroWear Smartwatch v2
(3, 2, 5, 2, 'Battery life is terrible. It barely lasts half a day if GPS is on. Disappointed.', '2026-06-10'),
(4, 2, 2, 3, 'The step counter works okay, but the bluetooth pairing drops constantly on my Samsung phone.', '2026-06-15'),
(5, 2, 3, 5, 'Works perfectly for my daily runs. OLED screen is super bright.', '2026-06-20'),

-- Elite Fit Men's Cotton Polo T-Shirt
(6, 3, 2, 5, 'Excellent fabric! Very soft and breathable. The medium size fits me perfectly.', '2026-06-10'),
(7, 3, 4, 4, 'Nice polo shirt. The color has not faded after 3 washes. Good purchase.', '2026-06-25'),

-- Classic Indigo Denim Jacket
(8, 4, 2, 3, 'Quality of the denim is solid and heavy, but the color is much lighter than the product photo. Looks grey-blue.', '2026-06-26'),
(9, 4, 3, 4, 'Fit is a bit snug in the shoulders, but it looks very stylish.', '2026-06-28'),

-- ChefPro Non-Stick Cookware Set
(10, 5, 3, 2, 'Bad quality. The non-stick coating started peeling off from the saucepan. Highly unsafe!', '2026-06-18'),
(11, 5, 4, 1, 'Utter waste of money. Hand washed it with soft sponge, yet the coating is chipping off.', '2026-06-24'),
(12, 5, 5, 4, 'Lids fit well, but the pans are smaller than expected. Non-stick works fine so far.', '2026-06-26'),

-- AromaDiffuser Humidifier
(13, 6, 2, 5, 'Very quiet and produces a nice cool mist. The LED lights are peaceful at night.', '2026-06-10'),
(14, 6, 4, 5, 'Highly recommend this! Helps a lot with dry winter air in my bedroom.', '2026-06-22'),

-- UrbanTraveler Backpack
(15, 7, 2, 4, 'Spacious with many pockets. Waterproof coating seems to work in light rain.', '2026-06-15'),
(16, 7, 4, 3, 'Backpack space is good, but the main zipper feels cheap and catches easily.', '2026-06-28'),

-- Premium Leather Wallet
(17, 8, 3, 5, 'Beautiful soft leather. Cards fit tightly at first but have loosened up nicely.', '2026-06-08'),
(18, 8, 4, 4, 'A solid wallet. Keeps a slim profile even when full of cards.', '2026-06-20'),

-- Apex Run Men's Running Shoes
(19, 9, 3, 2, 'Too narrow! The shoes squeezed the sides of my feet so badly I got blisters. Had to return.', '2026-06-10'),
(20, 9, 4, 2, 'Cushioning is great, but these are definitely not made for standard or wide feet. Painfully narrow toe box.', '2026-06-18'),
(21, 9, 5, 5, 'Extremely lightweight and fast shoes. Fits like a glove (I have narrow feet).', '2026-06-25'),

-- SoleComfort flats
(22, 10, 2, 4, 'Very comfortable memory foam. Good for working on my feet all day.', '2026-06-15'),
(23, 10, 5, 3, 'Simple flats, but they run a bit large and slip off my heel when walking.', '2026-06-22'),

-- FitGlow Smart Ring (Reviews)
(24, 11, 4, 4, 'The ring is lightweight and tracks my sleep patterns accurately. Battery lasts 5 days.', '2026-06-28'),
(25, 11, 2, 5, 'Awesome titanium ring. Fits well, barely notice it, and the app dashboard is nice.', '2026-07-01'),

-- EcoEarth Tote Bags (Reviews)
(26, 12, 5, 5, 'Highly durable and environment friendly. Easily washable. Fits all my groceries!', '2026-06-30'),

-- TrailBlazer Hiking Boots (Reviews)
(27, 13, 3, 3, 'They look good but are very stiff around the ankle and caused bad chafing. Disappointed.', '2026-06-21'),

-- ProCharge Power Bank (Reviews)
(28, 14, 4, 5, 'Charges my phone fast, a bit heavy but solid build. Perfect for traveling.', '2026-06-28'),

-- UltraSoft Cotton Hoodie (Reviews)
(29, 15, 5, 2, 'Very soft at first, but it shrank so much after the first cold wash that my little brother has to wear it now.', '2026-06-23'),

-- DailyGrind Coffee Grinder (Reviews)
(30, 16, 2, 2, 'Humming motor but the blade stopped spinning after the second day. Had to ask for return.', '2026-07-01');


-- ============================================================
-- 6. SEED CHAT HISTORY
-- ============================================================
INSERT INTO chat_history (user_id, message, sender) VALUES
(2, 'Hello! What is EliteMart\'s return policy?', 'user'),
(2, 'EliteMart offers a 30-day return policy for most products. Items must be in their original condition and packaging. You can submit a return request directly from your orders page.', 'ai'),
(2, 'I want to know if Apex Run running shoes are reliable.', 'user'),
(2, 'The Apex Run Men\'s Running Shoes have a Return Health Score of 58%. Several customers have reported that the shoes run narrow in the toe box, leading to sizing returns. If you have wider feet, you might want to consider ordering a size up or looking at alternative walking shoes.', 'ai');
