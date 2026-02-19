export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string; // emoji or external image URL (http/https)
  category: string;
}

// Tax rate constant - should match backend configuration
export const TAX_RATE = 0.08; // 8%
