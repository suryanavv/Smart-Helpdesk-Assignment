import mongoose from 'mongoose';
import { config } from './config.js';

let memoryServer: any | null = null;

export async function connectToDatabase(): Promise<void> {
	try {
		await mongoose.connect(config.mongoUri);
		console.log('Connected to MongoDB successfully');
	} catch (error) {
		console.error('Failed to connect to MongoDB:', error);
		// Development fallback: spin up in-memory Mongo when real DB is unavailable
		if (process.env.NODE_ENV !== 'production') {
			try {
				const { MongoMemoryServer } = await import('mongodb-memory-server');
				memoryServer = await MongoMemoryServer.create();
				const uri = memoryServer.getUri();
				await mongoose.connect(uri);
				console.log('Started in-memory MongoDB for development');
				return;
			} catch (memErr) {
				console.error('Failed to start in-memory MongoDB:', memErr);
				throw error;
			}
		}
		throw error;
	}
}

export async function disconnectFromDatabase(): Promise<void> {
	try {
		if (mongoose.connection.readyState !== 0) {
			await mongoose.disconnect();
		}
		if (memoryServer) {
			await memoryServer.stop();
			memoryServer = null;
		}
	} catch {
		// ignore
	}
}


