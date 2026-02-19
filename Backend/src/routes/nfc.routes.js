import express from 'express';
import { 
  handleNFCScan, 
  removeNFCItem, 
  getProductByNFC 
} from '../controllers/nfc.controller.js';

const router = express.Router();

// Main endpoint for ESP to send NFC scan data
router.post('/scan', handleNFCScan);

// Optional: Remove item via NFC scan
router.post('/remove', removeNFCItem);

// Get product info by NFC ID (for verification)
router.get('/product/:nfcId', getProductByNFC);

export default router;
