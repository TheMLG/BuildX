import Cart from '../models/Cart.model.js';
import Product from '../models/Product.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

// Handle NFC scan from ESP device
export const handleNFCScan = asyncHandler(async (req, res) => {
  const { cartId, nfcId } = req.body;

  // Validate input
  if (!cartId || !nfcId) {
    throw new ApiError(400, 'cartId and nfcId are required');
  }

  // Find the cart
  const cart = await Cart.findOne({ cartId });

  if (!cart) {
    throw new ApiError(404, 'Cart not found');
  }

  // Check if cart is already checked out
  if (cart.status === 'checkedout') {
    throw new ApiError(400, 'Cannot add items to a checked out cart');
  }

  // Find the product by NFC tag ID
  const product = await Product.findOne({ nfcTagId: nfcId });

  if (!product) {
    throw new ApiError(404, 'Product not found for this NFC tag');
  }

  // Check if product is in stock
  if (product.stock <= 0) {
    throw new ApiError(400, 'Product is out of stock');
  }

  // Check if product already exists in cart
  const existingItemIndex = cart.items.findIndex(
    (item) => item.productId === product.productId
  );

  if (existingItemIndex > -1) {
    // Product exists, increment quantity
    cart.items[existingItemIndex].quantity += 1;
  } else {
    // Add new product to cart
    cart.items.push({
      productId: product.productId,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image || '',
    });
  }

  // Recalculate total amount
  cart.totalAmount = cart.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Save the cart
  await cart.save();

  res.status(200).json(
    new ApiResponse(
      200,
      {
        cart,
        addedProduct: {
          productId: product.productId,
          name: product.name,
          price: product.price,
          nfcTagId: product.nfcTagId,
        },
      },
      'Product added to cart successfully'
    )
  );
});

// Remove item from cart via NFC (optional feature)
export const removeNFCItem = asyncHandler(async (req, res) => {
  const { cartId, nfcId } = req.body;

  // Validate input
  if (!cartId || !nfcId) {
    throw new ApiError(400, 'cartId and nfcId are required');
  }

  // Find the cart
  const cart = await Cart.findOne({ cartId });

  if (!cart) {
    throw new ApiError(404, 'Cart not found');
  }

  // Check if cart is already checked out
  if (cart.status === 'checkedout') {
    throw new ApiError(400, 'Cannot modify a checked out cart');
  }

  // Find the product by NFC tag ID
  const product = await Product.findOne({ nfcTagId: nfcId });

  if (!product) {
    throw new ApiError(404, 'Product not found for this NFC tag');
  }

  // Find and remove/decrement the item in cart
  const existingItemIndex = cart.items.findIndex(
    (item) => item.productId === product.productId
  );

  if (existingItemIndex === -1) {
    throw new ApiError(404, 'Product not found in cart');
  }

  if (cart.items[existingItemIndex].quantity > 1) {
    // Decrement quantity
    cart.items[existingItemIndex].quantity -= 1;
  } else {
    // Remove item from cart
    cart.items.splice(existingItemIndex, 1);
  }

  // Recalculate total amount
  cart.totalAmount = cart.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Save the cart
  await cart.save();

  res.status(200).json(
    new ApiResponse(200, cart, 'Product removed/decremented from cart successfully')
  );
});

// Get product info by NFC ID (for ESP to verify scan)
export const getProductByNFC = asyncHandler(async (req, res) => {
  const { nfcId } = req.params;

  if (!nfcId) {
    throw new ApiError(400, 'nfcId is required');
  }

  const product = await Product.findOne({ nfcTagId: nfcId });

  if (!product) {
    throw new ApiError(404, 'Product not found for this NFC tag');
  }

  res.status(200).json(
    new ApiResponse(200, product, 'Product fetched successfully')
  );
});
