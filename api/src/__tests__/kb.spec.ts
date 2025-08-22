import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { Article } from '../models/Article.js';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

describe('KB', () => {
	it('search returns published articles', async () => {
		// Create test data
		const admin = await User.create({ name: 'Admin', email: 'admin@example.com', passwordHash: 'x', role: 'admin' });
		const adminToken = jwt.sign({ userId: admin._id.toString(), role: 'admin' }, config.jwtSecret);
		await Article.create({ title: 'Refund Policy', body: 'How refunds work', tags: ['refund', 'policy'], status: 'published' });
		await Article.create({ title: 'Troubleshooting 500 errors', body: 'Steps...', tags: ['error', '500'], status: 'published' });

		const res = await request(app)
			.get('/api/kb')
			.set('Authorization', `Bearer ${adminToken}`)
			.query({ query: 'refund' });
		expect(res.status).toBe(200);
		expect(res.body.length).toBeGreaterThan(0);
	});
});


