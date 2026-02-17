import express from 'express';
import {
  getCartByCartId,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  createCart,
} from '../controllers/cart.controller.js';

const router = express.Router();

// Create new cart (admin only)
router.post('/', createCart);

// Get cart by cartId
router.get('/:cartId', getCartByCartId);

// Add item to cart
router.post('/:cartId/items', addItemToCart);

// Update item quantity
router.put('/:cartId/items/:productId', updateCartItem);

// Remove item from cart
router.delete('/:cartId/items/:productId', removeCartItem);

// Clear cart
router.delete('/:cartId', clearCart);

export default router;
