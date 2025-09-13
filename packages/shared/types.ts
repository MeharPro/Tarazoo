export interface Product {
  product_id: string;
  merchant_id: string;
  sku: string;
  name: string;
  price_cents: number;
  barcode?: string;
  shopify_id?: string;
  shopify_handle?: string;
  image_url?: string;
  created_at: string;
}

export interface Order {
  order_id: string;
  merchant_id: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  created_at: string;
  status: 'pending' | 'paid' | 'confirmed_demo' | 'shipped' | 'delivered';
}

export interface OrderItem {
  id: string;
  order_id: string;
  sku: string;
  qty: number;
  price_cents: number;
  created_at: string;
}

export interface MinlpRun {
  run_id: string;
  merchant_id: string;
  order_id?: string;
  input_json: any;
  solution_json?: any;
  rationale_text?: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface MinlpSolution {
  optimal_cost: number;
  assignments: Array<{
    sku: string;
    supplier: string;
    quantity: number;
    cost: number;
  }>;
  kpis: {
    total_cost: number;
    supplier_count: number;
    avg_lead_time: number;
  };
}

export interface MinlpExplanation {
  bullets: string[];
  tldr: string;
}
