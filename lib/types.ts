export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  total_amount: number;
  delivery_address?: string;
  delivery_lat?: number;
  delivery_lng?: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  order_items?: OrderItem[];
  delivery?: Delivery | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Delivery {
  id: string;
  order_id: string;
  agent_id: string;
  status: 'assigned' | 'in_progress' | 'completed';
  current_lat?: number;
  current_lng?: number;
  created_at: string;
  updated_at: string;
  order?: Order;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  email: string;
  role?: 'customer' | 'admin' | 'agent';
}