// Application constants
export const TAX_RATE = 0.08; // 8% tax rate

// Order status enum
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

// Payment status enum
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// Cart status enum
export const CART_STATUS = {
  ACTIVE: 'active',
  CHECKEDOUT: 'checkedout',
  ABANDONED: 'abandoned',
};
