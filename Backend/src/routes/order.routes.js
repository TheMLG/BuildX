import express from 'express';
import {
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
  getOrdersByCustomer,
  downloadBillPDF,
} from '../controllers/order.controller.js';

const router = express.Router();

// Create order from cart
router.post('/', createOrder);

// Get all orders
router.get('/', getAllOrders);

// Get orders by customer email (must be before /:orderId to avoid shadowing)
router.get('/customer/:email', getOrdersByCustomer);

// Download PDF bill (two-segment path, not shadowed by /:orderId)
router.get('/:orderId/download-bill', downloadBillPDF);

// Get order by orderId
router.get('/:orderId', getOrderById);


// Update order status
router.patch('/:orderId/status', updateOrderStatus);

// Update payment status
router.patch('/:orderId/payment', updatePaymentStatus);

// Delete order
router.delete('/:orderId', deleteOrder);

export default router;
