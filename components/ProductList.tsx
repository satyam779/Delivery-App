'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';
import { useApp } from '@/lib/app-context';
import ProductCard from './ProductCard';

const fallbackProducts: Product[] = [
  {
    id: '1',
    name: 'Margherita Pizza',
    description: 'Classic cheese pizza',
    price: 12.99,
    image_url: '',
    category: 'Pizza',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Pepperoni Pizza',
    description: 'Pizza with pepperoni',
    price: 14.99,
    image_url: '',
    category: 'Pizza',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Cheeseburger',
    description: 'Juicy cheeseburger with fries',
    price: 9.99,
    image_url: '',
    category: 'Burgers',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [warningMessage, setWarningMessage] = useState('');
  const { dispatch } = useApp();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setProducts(data);
      } else {
        // No products found, use fallback
        setProducts(fallbackProducts);
        setWarningMessage(
          'Unable to load products from Supabase. Showing sample products instead. Check your Supabase URL and anon key in .env.local and run supabase-schema.sql if needed.'
        );
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setProducts(fallbackProducts);
      setWarningMessage(
        'Unable to load products from Supabase. Showing sample products instead. Check your Supabase URL and anon key in .env.local and run supabase-schema.sql if needed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    dispatch({ type: 'ADD_TO_CART', payload: { product, quantity: 1 } });
  };

  if (loading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  return (
    <>
      {warningMessage && (
        <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-800">
          {warningMessage}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
        ))}
      </div>
    </>
  );
}
