// config/db.js
// This file handles the MongoDB connection using Mongoose
// mongodb+srv://swayamkumar103_db_user:swayam1234@cluster0.q30dbna.mongodb.net/productivity_app?appName=Cluster0
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Connect to MongoDB - replace with your connection string
    // For local: 'mongodb://localhost:27017/productivity_app'
    // For Atlas: 'mongodb+srv://<user>:<pass>@cluster.mongodb.net/productivity_app'
    const conn = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb+srv://swayamkumar103_db_user:swayam1234@cluster0.q30dbna.mongodb.net/productivity_app?appName=Cluster0'
    );

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
