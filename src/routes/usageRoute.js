import express from 'express';
import { getUsage } from '../controller/usageController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/usage',authMiddleware,getUsage);

export default router;