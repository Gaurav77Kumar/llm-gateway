import mongoose from 'mongoose';

async function connectDB() {
     mongoose.set('strictQuery', true);

     try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 8000,
        });
        console.log('MongoDB connected successfully: ', mongoose.connection.host);
     }catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
     }
     mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected');
     });

     mongoose.connection.on('error', (err) => {
         console.error('MongoDB connection error:', err.message);
     });

     mongoose.connection.on('reconnected', () => {
         console.log('MongoDB reconnected');
     })
}

export default connectDB;