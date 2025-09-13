-- Create products table
CREATE TABLE IF NOT EXISTS products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    barcode VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL,
    subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
    tax_cents INTEGER NOT NULL CHECK (tax_cents >= 0),
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending'
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    qty INTEGER NOT NULL CHECK (qty > 0),
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create minlp_runs table
CREATE TABLE IF NOT EXISTS minlp_runs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL,
    order_id UUID REFERENCES orders(order_id),
    input_json JSONB NOT NULL,
    solution_json JSONB,
    rationale_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_products_merchant_id ON products(merchant_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_orders_merchant_id ON orders(merchant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_minlp_runs_merchant_id ON minlp_runs(merchant_id);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE minlp_runs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (open for demo, tighten for production)
CREATE POLICY "Products are viewable by everyone" ON products
    FOR SELECT USING (true);

CREATE POLICY "Orders are viewable by everyone" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Orders can be created by everyone" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Order items are viewable by everyone" ON order_items
    FOR SELECT USING (true);

CREATE POLICY "Order items can be created by everyone" ON order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "MINLP runs are viewable by everyone" ON minlp_runs
    FOR SELECT USING (true);

CREATE POLICY "MINLP runs can be created by everyone" ON minlp_runs
    FOR INSERT WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE minlp_runs;
