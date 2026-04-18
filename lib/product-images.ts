import { Product } from '@/lib/types';

const categoryImageMap: Record<string, string> = {
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
  burgers: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  salads: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  pasta: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=800&q=80',
  snacks: 'https://images.unsplash.com/photo-1599490659213-e2b9527bb087?auto=format&fit=crop&w=800&q=80',
  grocery: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
  drinks: 'https://images.unsplash.com/photo-1544145945-f904253d0c71?auto=format&fit=crop&w=800&q=80',
  dessert: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80',
};

const productImageMap: Record<string, string> = {
  // Food Items
  'egg puff': 'https://images.pexels.com/photos/17104937/pexels-photo-17104937.jpeg',
  'biryani': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
  'cool drinks': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
  'chicken burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  'caesar salad': 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=800&q=80',
  'pasta carbonara': 'https://images.unsplash.com/photo-1673442635965-34f1b36d8944?auto=format&fit=crop&w=800&q=80',
  'pepperoni pizza': 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80',
  'paneer tikka': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80',
  'chocolate lava cake': 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=800&q=80',
  'hakka noodles': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
  'cold coffee': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',

  // Grocery Items
  'fresh tomatoes': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
  'organic onions': 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80',
  'red potatoes': 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?auto=format&fit=crop&w=800&q=80',
  'fresh milk': 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=800',
  'brown bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  'large eggs': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80',
  'basmati rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
  'sunflower oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
  'ata flour': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  'atta': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  'chakki atta': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  'table salt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
  'iodized salt': 'https://images.unsplash.com/photo-1555529731-118a5a683431?auto=format&fit=crop&w=800&q=80',
  'sugar': 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=800&q=80',
  'tea powder': 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=800&q=80',
  'coffee beans': 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
  'green apples': 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&w=800&q=80',
  'yellow bananas': 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=800&q=80',
  'fresh spinach': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80',
  'butter': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=800&q=80',
  'greek yogurt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
  'dish soap': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
  'laundry pods': 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=800&q=80',
};

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? '';
}

export function getProductImageUrl(product: Pick<Product, 'name' | 'category' | 'image_url'>) {
  const normName = normalize(product.name);

  // 1. Explicit Exact Match (High Priority)
  if (productImageMap[normName]) {
    console.log(`[ImageMap] Match Found: ${product.name} -> ${productImageMap[normName]}`);
    return productImageMap[normName];
  }

  // 1.5 Deep Keyword Lookup (Medium-High Priority)
  const keywords = Object.keys(productImageMap);
  const keywordMatch = keywords.find(key => normName.includes(key));
  if (keywordMatch) {
    console.log(`[ImageMap] Keyword Match Found: ${product.name} contains "${keywordMatch}" -> ${productImageMap[keywordMatch]}`);
    return productImageMap[keywordMatch];
  }

  // 2. Database URL (if valid)
  if (product.image_url && (product.image_url.startsWith('http') || product.image_url.startsWith('/'))) {
    console.log(`[ImageMap] Using Database URL: ${product.name} -> ${product.image_url}`);
    return product.image_url;
  }

  const categoryMatch = categoryImageMap[normalize(product.category)];
  if (categoryMatch) {
    return categoryMatch;
  }

  // Final fallback
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80';
}
