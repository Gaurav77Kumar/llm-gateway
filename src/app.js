import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import keyRoute from './routes/KeyRoute.js';
import chatRoute from './routes/chatRoute.js';
import usageRoute from './routes/usageRoute.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicPath = path.join(__dirname, '../public');

app.use(express.static(publicPath));
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok'
    });
});

// API routes
app.use('/api', keyRoute);
app.use('/api', chatRoute);
app.use('/api', usageRoute);

export default app;