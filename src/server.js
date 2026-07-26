import app from './app.js';
import { env } from './config/env.js';
import connectDB from './config/database.js';
import cors from 'cors';

app.use(cors());

async function start() {
    try {
        await connectDB();
        app.listen(env.port, () => {
            console.log(`Server is running on port ${env.port}`);
        });
    } catch (err) {
        console.error('Error starting the server:', err.message);
        process.exit(1);
    }
}

start();