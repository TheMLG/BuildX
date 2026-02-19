import express from 'express';
import { getConfig } from '../controllers/config.controller.js';

const router = express.Router();

// Get application configuration
router.get('/', getConfig);

export default router;
