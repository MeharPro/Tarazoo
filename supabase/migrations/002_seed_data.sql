-- Seed merchant data
INSERT INTO products (merchant_id, sku, name, price_cents, barcode) VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'SKU001', 'Organic Coffee Beans 1kg', 2499, '1234567890123'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'SKU002', 'Premium Dark Chocolate 200g', 899, '2345678901234'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'SKU003', 'Artisan Sourdough Bread', 599, '3456789012345'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'SKU004', 'Organic Almond Butter 500g', 1299, '4567890123456'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'SKU005', 'Free Range Eggs (Dozen)', 799, '5678901234567'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'SKU006', 'Greek Yogurt 1L', 699, '6789012345678'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'SKU007', 'Honey Raw 500ml', 1499, '7890123456789'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'SKU008', 'Olive Oil Extra Virgin 1L', 1899, '8901234567890')
ON CONFLICT (sku) DO NOTHING;
