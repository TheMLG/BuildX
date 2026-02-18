import express from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentDetails,
} from '../controllers/payment.controller.js';

const router = express.Router();

// Create Razorpay order
router.post('/create-order', createRazorpayOrder);

// Verify payment
router.post('/verify', verifyRazorpayPayment);

// Get payment details
router.get('/:paymentId', getPaymentDetails);

export default router;
