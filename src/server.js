import app from './app.js';
import { env } from './config/env.js';
import connectDB from './config/database.js';
import cors from 'cors';

app.use(cors());

async function start() {
    try {
        await connectDB();
            const PORT = process.env.PORT || env.port || 3000;

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Error starting the server:', err.message);
        process.exit(1);
    }
}

start();