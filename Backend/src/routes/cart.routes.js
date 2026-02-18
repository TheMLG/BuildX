import express from 'express';
import {
  getCartByCartId,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  createCart,
  getAllCarts,
  deleteCart,
} from '../controllers/cart.controller.js';

const router = express.Router();

// Create new cart (admin only)
router.post('/', createCart);

// Get all carts (admin only)
router.get('/', getAllCarts);

// Get cart by cartId
router.get('/:cartId', getCartByCartId);

// Delete cart by cartId (admin only)
router.delete('/:cartId/delete', deleteCart);

// Add item to cart
router.post('/:cartId/items', addItemToCart);

// Update item quantity
router.put('/:cartId/items/:productId', updateCartItem);

// Remove item from cart
router.delete('/:cartId/items/:productId', removeCartItem);

// Clear cart
router.delete('/:cartId', clearCart);

export default router;
