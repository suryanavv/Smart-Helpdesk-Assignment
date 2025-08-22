import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { User } from '../models/User.js';
import { ConfigModel } from '../models/Config.js';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

describe('Config', () => {
	it('allows admin to get and update config', async () => {
		// Create test data
		const admin = await User.create({ name: 'Admin', email: 'admin@example.com', passwordHash: 'x', role: 'admin' });
		const adminToken = jwt.sign({ userId: admin._id.toString(), role: 'admin' }, config.jwtSecret);
		
		const user = await User.create({ name: 'User', email: 'user@example.com', passwordHash: 'x', role: 'user' });
		const userToken = jwt.sign({ userId: user._id.toString(), role: 'user' }, config.jwtSecret);

		// Create initial config
		await ConfigModel.create({
			autoCloseEnabled: true,
			confidenceThreshold: 0.8,
			slaHours: 24
		});

		// Admin can get config
		const getRes = await request(app)
			.get('/api/config')
			.set('Authorization', `Bearer ${adminToken}`);
		
		expect(getRes.status).toBe(200);
		expect(getRes.body.autoCloseEnabled).toBe(true);
		expect(getRes.body.confidenceThreshold).toBe(0.8);

		// Admin can update config
		const updateRes = await request(app)
			.put('/api/config')
			.set('Authorization', `Bearer ${adminToken}`)
			.send({
				autoCloseEnabled: false,
				confidenceThreshold: 0.9,
				slaHours: 48
			});
		
		expect(updateRes.status).toBe(200);
		expect(updateRes.body.autoCloseEnabled).toBe(false);
		expect(updateRes.body.confidenceThreshold).toBe(0.9);

		// User cannot access config
		const userGetRes = await request(app)
			.get('/api/config')
			.set('Authorization', `Bearer ${userToken}`);
		
		expect(userGetRes.status).toBe(403);
	});
});
