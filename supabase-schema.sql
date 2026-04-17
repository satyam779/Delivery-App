-- Supabase Database Schemas for Delivery App
-- Full Reset: Dropping existing tables to ensure clean schema update
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- 1. Profiles table (to store user roles and metadata)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'agent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'customer'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Orders table (Consolidated with delivery tracking)
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT, -- Relaxed to TEXT to allow for flexible demo assignment
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_address TEXT,
  -- Destination coordinates
  delivery_lat DECIMAL(10,8),
  delivery_lng DECIMAL(11,8),
  -- Agent's current coordinates (Live tracking)
  current_lat DECIMAL(10,8),
  current_lng DECIMAL(11,8),
  assigned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Order items table
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);

-- Profiles are viewable by everyone, but only user can update their own
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Orders policies: Admins see all, Users see their own
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
  auth.uid() = user_id OR 
  auth.uid()::text = agent_id
);

DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
CREATE POLICY "Users can insert their own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authorized roles can update orders" ON orders;
CREATE POLICY "Authorized roles can update orders" ON orders FOR UPDATE USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
  auth.uid() = user_id OR 
  auth.uid()::text = agent_id
);

-- Order items policies
DROP POLICY IF EXISTS "Viewable by order participants" ON order_items;
CREATE POLICY "Viewable by order participants" ON order_items FOR SELECT USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR orders.agent_id::text = auth.uid()::text))
);

-- Setup Sample Data
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM products;

INSERT INTO products (name, description, price, category, image_url) VALUES
-- Food Items
('Egg Puff', 'Spicy egg puff with crispy pastry', 30.00, 'Snacks', '/egg-puff.jpg'),
('Biryani', 'Aromatic Hyderabadi chicken biryani', 150.00, 'Main Course', '/biryani.jpg'),
('Cool Drinks', 'Refreshing chilled beverages', 20.00, 'Drinks', '/coke.jpg'),
('Chicken Burger', 'Crispy chicken breast with fresh veggies', 100.00, 'Fast Food', '/chicken burger.webp'),
('Caesar Salad', 'Fresh lettuce with parmesan and croutons', 150.00, 'Healthy', '/salad.avif'),
('Pasta Carbonara', 'Creamy pasta with bacon and egg', 200.00, 'Italian', '/pasta.jpg'),
('Pepperoni Pizza', 'Large pizza with loaded pepperoni', 450.00, 'Pizza', '/pizza.png'),
('Paneer Tikka', 'Grilled cottage cheese with spices', 180.00, 'Appetizer', null),
('Chocolate Lava Cake', 'Mozzarella filled warm chocolate cake', 120.00, 'Dessert', null),
('Hakka Noodles', 'Stir-fried noodles with crisp veggies', 140.00, 'Chinese', null),
('Cold Coffee', 'Rich creamy blended coffee with ice cream', 90.00, 'Drinks', null),

-- Grocery Items (20 items)
('Fresh Tomatoes', 'Organic farm-fresh tomatoes (1kg)', 45.00, 'Grocery', '/tomatoes.png'),
('Organic Onions', 'Crispy red onions (1kg)', 35.00, 'Grocery', null),
('Red Potatoes', 'Fresh mountain potatoes (1kg)', 40.00, 'Grocery', null),
('Fresh Milk', 'Pasteurized full-cream milk (500ml)', 28.00, 'Grocery', '/milk.png'),
('Brown Bread', 'Whole wheat healthy bread', 45.00, 'Grocery', '/bread.png'),
('Large Eggs', 'Farm-fresh white eggs (Pack of 6)', 42.00, 'Grocery', null),
('Basmati Rice', 'Premium long grain rice (1kg)', 120.00, 'Grocery', null),
('Sunflower Oil', 'Refined cooking oil (1L)', 165.00, 'Grocery', null),
('Ata Flour', 'Whole wheat chakki atta (5kg)', 210.00, 'Grocery', null),
('Table Salt', 'Iodized crystalline salt (1kg)', 22.00, 'Grocery', null),
('Sugar', 'Refined white sugar (1kg)', 48.00, 'Grocery', null),
('Tea Powder', 'Strong Assam tea leaves (250g)', 85.00, 'Grocery', null),
('Coffee Beans', 'Roasted Arabica beans (100g)', 150.00, 'Grocery', null),
('Green Apples', 'Crisp Granny Smith apples (Pack of 4)', 180.00, 'Grocery', '/fruits.png'),
('Yellow Bananas', 'Ripe sweet bananas (Dozen)', 60.00, 'Grocery', '/fruits.png'),
('Fresh Spinach', 'Green leafy spinach bunch', 20.00, 'Grocery', null),
('Butter', 'Salted creamy butter (100g)', 55.00, 'Grocery', null),
('Greek Yogurt', 'Plain unsweetened yogurt (200g)', 40.00, 'Grocery', null),
('Dish Soap', 'Lemon-fresh dishwashing liquid', 35.00, 'Grocery', null),
('Laundry Pods', 'High-efficiency cleaning pods', 190.00, 'Grocery', null);