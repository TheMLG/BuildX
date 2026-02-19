import Razorpay from 'razorpay';
import crypto from 'crypto';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import Order from '../models/Order.model.js';
import Cart from '../models/Cart.model.js';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_key_secret',
});

// Create Razorpay order
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount, currency = 'INR', receipt, notes } = req.body;

  if (!amount) {
    throw new ApiError(400, 'Amount is required');
  }

  // Create Razorpay order
  const options = {
    amount: Math.round(amount * 100), // Amount in paise
    currency,
    receipt: receipt || `receipt_${Date.now()}`,
    notes: notes || {},
  };

  const razorpayOrder = await razorpay.orders.create(options);

  res.status(201).json(
    new ApiResponse(201, razorpayOrder, 'Razorpay order created successfully')
  );
});

// Verify Razorpay payment signature
export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
    throw new ApiError(400, 'Missing required payment verification fields');
  }

  // Verify signature
  const sign = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your_key_secret')
    .update(sign.toString())
    .digest('hex');

  if (razorpay_signature !== expectedSign) {
    throw new ApiError(400, 'Invalid payment signature');
  }

  // Update order payment status
  const order = await Order.findOne({ orderId });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  order.paymentInfo.status = 'completed';
  order.paymentInfo.transactionId = razorpay_payment_id;
  order.paymentInfo.razorpayOrderId = razorpay_order_id;
  order.paymentInfo.razorpayPaymentId = razorpay_payment_id;
  order.status = 'confirmed';

  await order.save();

  // Reset cart: clear all items and set status back to active
  const cart = await Cart.findOne({ cartId: order.cartId });
  if (cart) {
    cart.items = [];
    cart.totalAmount = 0;
    cart.status = 'active';
    await cart.save();
  }

  res.status(200).json(
    new ApiResponse(200, order, 'Payment verified successfully')
  );
});

// Get payment details
export const getPaymentDetails = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  if (!paymentId) {
    throw new ApiError(400, 'Payment ID is required');
  }

  const payment = await razorpay.payments.fetch(paymentId);

  res.status(200).json(
    new ApiResponse(200, payment, 'Payment details fetched successfully')
  );
});
