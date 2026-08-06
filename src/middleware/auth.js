import VirtualKey from '../models/VirtualKey.js';
import {hashApiKey, isValidApiKey } from '../utils/apiKey.js';

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Authorization header is missing' });
        }

        const parts = authHeader.trim().split(/\s+/);
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({ error: 'Invalid Authorization header format. Expected "Bearer <api_key>"' });
        }

        const apiKey = parts[1];

        if (!isValidApiKey(apiKey)) {
            return res.status(401).json({ error: 'Invalid API key format' });
        }

        const keyHash = hashApiKey(apiKey);
        const virtualKey = await VirtualKey.findOne({ keyHash, isActive: true });

        if(!virtualKey) {
            return res.status(401).json({ error: 'API key not found' });
        } 

        req.virtualKey = virtualKey;
        next();
    } catch (err) {
        console.error("Authentication middleware error:", err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export default authMiddleware;