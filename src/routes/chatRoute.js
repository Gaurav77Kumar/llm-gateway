import express from 'express';
import { chatCompletion } from '../controller/chatController.js';
import authMiddleware from '../middleware/auth.js';
import budgetMiddleware from '../middleware/budget.js';

const router = express.Router();

router.post('/chat', authMiddleware, budgetMiddleware, chatCompletion);

export default router;