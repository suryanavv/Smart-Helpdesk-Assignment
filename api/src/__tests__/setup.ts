import { beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongo: MongoMemoryServer;
let isConnected = false;

beforeAll(async () => {
  // Only create MongoDB instance if not already connected
  if (!isConnected) {
    console.log('🚀 Starting MongoDB Memory Server for tests...');
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    process.env.MONGO_URI = uri;
    
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(uri);
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
  }
});

afterAll(async () => {
  // Only cleanup if we created the instance
  if (mongo && isConnected) {
    console.log('🔄 Cleaning up MongoDB connections...');
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('✅ MongoDB disconnected');
    }
    await mongo.stop();
    console.log('✅ MongoDB Memory Server stopped');
    isConnected = false;
  }
});

beforeEach(async () => {
  // Clear model cache to prevent recompilation errors
  Object.keys(mongoose.models).forEach(modelName => {
    delete mongoose.models[modelName];
  });
  
  // Only clear collections if connected
  if (isConnected && mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});
