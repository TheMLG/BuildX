export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string; // emoji or external image URL (http/https)
  category: string;
}

export const initialCartItems: CartItem[] = [
  {
    id: "1",
    name: "Organic Avocados",
    price: 4.99,
    quantity: 2,
    image: "🥑",
    category: "Produce",
  },
  {
    id: "2",
    name: "Almond Milk",
    price: 3.49,
    quantity: 1,
    image: "🥛",
    category: "Dairy",
  },
  {
    id: "3",
    name: "Sourdough Bread",
    price: 5.99,
    quantity: 1,
    image: "🍞",
    category: "Bakery",
  },
  {
    id: "4",
    name: "Free Range Eggs",
    price: 6.49,
    quantity: 1,
    image: "🥚",
    category: "Dairy",
  },
  {
    id: "5",
    name: "Greek Yogurt",
    price: 2.99,
    quantity: 3,
    image: "🫙",
    category: "Dairy",
  },
];

export const TAX_RATE = 0.08;
