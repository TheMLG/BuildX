import Product from '../models/Product.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

// Create a new product
export const createProduct = asyncHandler(async (req, res) => {
  const { productId, name, price, image, category, stock, nfcTagId } = req.body;

  if (!productId || !name || !price || !nfcTagId) {
    throw new ApiError(400, 'Missing required fields: productId, name, price, nfcTagId');
  }

  // Check if product or NFC tag already exists
  const existingProduct = await Product.findOne({
    $or: [{ productId }, { nfcTagId }]
  });

  if (existingProduct) {
    if (existingProduct.productId === productId) {
      throw new ApiError(400, 'Product ID already exists');
    }
    if (existingProduct.nfcTagId === nfcTagId) {
      throw new ApiError(400, 'NFC Tag ID already mapped to another product');
    }
  }

  const product = await Product.create({
    productId,
    name,
    price,
    image: image || '',
    category: category || 'General',
    stock: stock || 0,
    nfcTagId,
  });

  res.status(201).json(
    new ApiResponse(201, product, 'Product created successfully')
  );
});

// Get all products
export const getAllProducts = asyncHandler(async (req, res) => {
  const { category, limit = 100, skip = 0 } = req.query;

  const query = {};
  if (category) {
    query.category = category;
  }

  const products = await Product.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

  const total = await Product.countDocuments(query);

  res.status(200).json(
    new ApiResponse(200, { products, total }, 'Products fetched successfully')
  );
});

// Get product by productId
export const getProductById = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findOne({ productId });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  res.status(200).json(
    new ApiResponse(200, product, 'Product fetched successfully')
  );
});

// Get product by NFC Tag ID
export const getProductByNfcTag = asyncHandler(async (req, res) => {
  const { nfcTagId } = req.params;

  const product = await Product.findOne({ nfcTagId });

  if (!product) {
    throw new ApiError(404, 'Product not found for this NFC tag');
  }

  res.status(200).json(
    new ApiResponse(200, product, 'Product fetched successfully')
  );
});

// Update product
export const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { name, price, image, category, stock, nfcTagId } = req.body;

  const product = await Product.findOne({ productId });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  // If updating nfcTagId, check if it's already in use
  if (nfcTagId && nfcTagId !== product.nfcTagId) {
    const existingNfc = await Product.findOne({ nfcTagId });
    if (existingNfc) {
      throw new ApiError(400, 'NFC Tag ID already mapped to another product');
    }
    product.nfcTagId = nfcTagId;
  }

  // Update fields
  if (name) product.name = name;
  if (price !== undefined) product.price = price;
  if (image !== undefined) product.image = image;
  if (category) product.category = category;
  if (stock !== undefined) product.stock = stock;

  await product.save();

  res.status(200).json(
    new ApiResponse(200, product, 'Product updated successfully')
  );
});

// Delete product
export const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findOneAndDelete({ productId });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  res.status(200).json(
    new ApiResponse(200, null, 'Product deleted successfully')
  );
});

// Map NFC tag to product
export const mapNfcToProduct = asyncHandler(async (req, res) => {
  const { productId, nfcTagId } = req.body;

  if (!productId || !nfcTagId) {
    throw new ApiError(400, 'Product ID and NFC Tag ID are required');
  }

  // Check if NFC tag is already mapped
  const existingNfc = await Product.findOne({ nfcTagId });
  if (existingNfc && existingNfc.productId !== productId) {
    throw new ApiError(400, 'NFC Tag ID already mapped to another product');
  }

  const product = await Product.findOne({ productId });
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  product.nfcTagId = nfcTagId;
  await product.save();

  res.status(200).json(
    new ApiResponse(200, product, 'NFC tag mapped successfully')
  );
});
