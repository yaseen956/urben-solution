import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    mongoose.connection.on('error', (error) => {
      console.error(`MongoDB runtime error: ${error.message}`);
    });
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Retrying connection in 5 seconds...');
      setTimeout(() => {
        connectDB().catch((error) => console.error(`MongoDB reconnect failed: ${error.message}`));
      }, 5000);
    });
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    setTimeout(() => {
      connectDB().catch((retryError) => console.error(`MongoDB reconnect failed: ${retryError.message}`));
    }, 5000);
  }
};
