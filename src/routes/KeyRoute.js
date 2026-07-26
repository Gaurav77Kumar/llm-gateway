import express from 'express';
import { createKey } from '../controller/keyController.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

router.post('/keys',adminAuth,createKey);

export default router;