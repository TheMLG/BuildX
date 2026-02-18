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
  emailBill,
} from '../controllers/order.controller.js';

const router = express.Router();

// Create order from cart
router.post('/', createOrder);

// Get all orders
router.get('/', getAllOrders);

// Get order by orderId
router.get('/:orderId', getOrderById);

// Get orders by customer email
router.get('/customer/:email', getOrdersByCustomer);

// Download PDF bill
router.get('/:orderId/download-bill', downloadBillPDF);

// Send bill via email
router.post('/:orderId/email-bill', emailBill);

// Update order status
router.patch('/:orderId/status', updateOrderStatus);

// Update payment status
router.patch('/:orderId/payment', updatePaymentStatus);

// Delete order
router.delete('/:orderId', deleteOrder);

export default router;
