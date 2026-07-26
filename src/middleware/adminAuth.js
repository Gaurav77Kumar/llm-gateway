import crypto from 'crypto';
import { env } from '../config/env.js';

const adminAuth = (req, res, next) => {
    try {
        const providedSecret = req.headers['x-admin-secret'];

        if (
            !providedSecret ||
            typeof providedSecret !== 'string'
        ) {
            return res.status(401).json({
                error: 'Admin authentication required'
            });
        }

        const expectedSecret = env.adminSecret;

        if (!expectedSecret) {
            console.error('ADMIN_SECRET is not configured');

            return res.status(500).json({
                error: 'Server configuration error'
            });
        }

        // Buffers are required for timingSafeEqual
        const providedBuffer =
            Buffer.from(providedSecret);

        const expectedBuffer =
            Buffer.from(expectedSecret);

        // timingSafeEqual requires equal-length buffers
        if (
            providedBuffer.length !==
            expectedBuffer.length
        ) {
            return res.status(403).json({
                error: 'Invalid admin credentials'
            });
        }

        const isValid = crypto.timingSafeEqual(
            providedBuffer,
            expectedBuffer
        );

        if (!isValid) {
            return res.status(403).json({
                error: 'Invalid admin credentials'
            });
        }

        next();

    } catch (error) {
        console.error(
            'Admin authentication error:',
            error.message
        );

        return res.status(500).json({
            error: 'Admin authentication failed'
        });
    }
};

export default adminAuth;