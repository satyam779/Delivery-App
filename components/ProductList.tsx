'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';
import { useApp } from '@/lib/app-context';
import ProductCard from './ProductCard';

const fallbackProducts: Product[] = [
  // Food Items
  { id: '1', name: 'Egg Puff', description: 'Spicy egg puff with crispy pastry', price: 30, category: 'Snacks', image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: '2', name: 'Biryani', description: 'Aromatic chicken biryani with premium spices', price: 150, category: 'Main Course', image_url: 'https://images.unsplash.com/photo-1563379091339-03b1cbb8e4c8?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: '3', name: 'Cool Drinks', description: 'Refreshing chilled beverages', price: 20, category: 'Drinks', image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: '4', name: 'Chicken Burger', description: 'Crispy chicken breast with fresh veggies', price: 100, category: 'Fast Food', image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: '5', name: 'Caesar Salad', description: 'Fresh lettuce with parmesan and croutons', price: 150, category: 'Healthy', image_url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: '6', name: 'Pasta Carbonara', description: 'Creamy pasta with bacon and egg', price: 200, category: 'Italian', image_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: '7', name: 'Pepperoni Pizza', description: 'Large pizza with loaded pepperoni', price: 450, category: 'Pizza', image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: '8', name: 'Paneer Tikka', description: 'Grilled cottage cheese with spices', price: 180, category: 'Appetizer', image_url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: '9', name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten center', price: 120, category: 'Dessert', image_url: 'https://images.unsplash.com/photo-1624353365286-3f862210f61d?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: '10', name: 'Hakka Noodles', description: 'Stir-fried noodles with crisp veggies', price: 140, category: 'Chinese', image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  
  // Grocery Items
  { id: 'g1', name: 'Fresh Tomatoes', description: 'Organic farm-fresh tomatoes (1kg)', price: 45, category: 'Grocery', image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: 'g2', name: 'Organic Onions', description: 'Crispy red onions (1kg)', price: 35, category: 'Grocery', image_url: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: 'g3', name: 'Red Potatoes', description: 'Fresh mountain potatoes (1kg)', price: 40, category: 'Grocery', image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: 'g4', name: 'Fresh Milk', description: 'Pasteurized full-cream milk (500ml)', price: 28, category: 'Grocery', image_url: 'https://images.unsplash.com/photo-1550583724-125581fe2f8a?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: 'g5', name: 'Brown Bread', description: 'Whole wheat healthy bread', price: 45, category: 'Grocery', image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: 'g6', name: 'Large Eggs', description: 'Farm-fresh white eggs (Pack of 6)', price: 42, category: 'Grocery', image_url: 'https://images.unsplash.com/photo-1582722872445-44c56bb62741?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: 'g7', name: 'Basmati Rice', description: 'Premium long grain rice (1kg)', price: 120, category: 'Grocery', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: 'g8', name: 'Sunflower Oil', description: 'Refined cooking oil (1L)', price: 165, category: 'Grocery', image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: 'g9', name: 'Ata Flour', description: 'Whole wheat chakki atta (5kg)', price: 210, category: 'Grocery', image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: 'g10', name: 'Table Salt', description: 'Iodized crystalline salt (1kg)', price: 22, category: 'Grocery', image_url: 'https://images.unsplash.com/photo-1626197031507-c17099753214?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: 'g11', name: 'Fruit Basket', description: 'Seasonal apples and bananas', price: 240, category: 'Grocery', image_url: 'https://images.unsplash.com/photo-1619566636858-adb3ef2618a7?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: 'g12', name: 'Assam Tea', description: 'Strong black tea leaves', price: 95, category: 'Grocery', image_url: 'https://images.unsplash.com/photo-1544787210-2211d24731b7?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
  { id: 'g13', name: 'Butter', description: 'Salted creamy butter', price: 55, category: 'Grocery', image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=800&q=80', created_at: '', updated_at: '' },
];

function applyProductCardImages(products: Product[]) {
  return products.map((product, index) => {
    if (product.image_url && product.image_url !== '') return product;
    
    // Auto-assign some images for demo if missing
    return index === 3 ? { ...product, image_url: '/chicken burger.webp' }
      : index === 4 ? { ...product, image_url: '/caesar-salad.jpg' }
      : index === 5 ? { ...product, image_url: '/pasta.jpg' }
      : product;
  });
}

export default function ProductList({ category }: { category?: string }) {
  const { state, addToCart, dispatch } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      let finalProducts = data && data.length > 0 ? data : fallbackProducts;
      
      if (category) {
        finalProducts = finalProducts.filter((p: Product) => p.category === category);
      } else {
        finalProducts = finalProducts.filter((p: Product) => p.category !== 'Grocery');
      }

      setProducts(applyProductCardImages(finalProducts));
    } catch (error) {
      console.warn('Error fetching products, using fallback:', error);
      let finalFallback = fallbackProducts;
      if (category) {
        finalFallback = fallbackProducts.filter((p: Product) => p.category === category);
      } else {
        finalFallback = fallbackProducts.filter((p: Product) => p.category !== 'Grocery');
      }
      setProducts(applyProductCardImages(finalFallback));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-[2rem] h-[450px] border border-gray-100 shadow-sm" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
      {products.map((product) => {
        const cartItem = state.cart.find((item) => item.product.id === product.id);
        const quantity = cartItem ? cartItem.quantity : 0;
        
        return (
          <ProductCard 
            key={product.id} 
            product={product} 
            onAddToCart={() => addToCart(product)}
            cartQuantity={quantity}
            onUpdateQuantity={updateQuantity}
          />
        );
      })}
    </div>
  );
}
