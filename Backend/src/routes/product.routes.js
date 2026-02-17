import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  getProductByNfcTag,
  updateProduct,
  deleteProduct,
  mapNfcToProduct,
} from '../controllers/product.controller.js';

const router = express.Router();

// Create product
router.post('/', createProduct);

// Get all products
router.get('/', getAllProducts);

// Get product by productId
router.get('/:productId', getProductById);

// Get product by NFC tag
router.get('/nfc/:nfcTagId', getProductByNfcTag);

// Update product
router.put('/:productId', updateProduct);

// Delete product
router.delete('/:productId', deleteProduct);

// Map NFC tag to product
router.post('/map-nfc', mapNfcToProduct);

export default router;
