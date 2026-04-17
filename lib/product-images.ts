import { Product } from '@/lib/types';

const categoryImageMap: Record<string, string> = {
  pizza: '/pizza-card.svg',
  burgers: '/burger-card.svg',
  burger: '/burger-card.svg',
  salads: '/salad-card.svg',
  salad: '/salad-card.svg',
  pasta: '/pasta-card.svg',
  snacks: '/puff-card.svg',
  puffs: '/puff-card.svg',
};

const productImageMap: Record<string, string> = {
  'margherita pizza': '/pizza-card.svg',
  'pepperoni pizza': '/pizza-card.svg',
  cheeseburger: '/burger-card.svg',
  'chicken burger': '/burger-card.svg',
  'caesar salad': '/salad-card.svg',
  'pasta carbonara': '/pasta-card.svg',
  'egg puff': '/egg-puff.jpg',
};

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? '';
}

export function getProductImageUrl(product: Pick<Product, 'name' | 'category' | 'image_url'>) {
  if (product.image_url?.trim()) {
    return product.image_url;
  }

  const productMatch = productImageMap[normalize(product.name)];
  if (productMatch) {
    return productMatch;
  }

  const categoryMatch = categoryImageMap[normalize(product.category)];
  if (categoryMatch) {
    return categoryMatch;
  }

  // Final fallback to a high-quality generic food placeholder
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
}
