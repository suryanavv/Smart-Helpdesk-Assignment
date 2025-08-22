import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AgentSuggestion } from '../models/AgentSuggestion.js';
import { AuditLog } from '../models/AuditLog.js';

describe('Tickets', () => {
	it('creates a ticket and triggers triage with audit', async () => {
		process.env.NODE_ENV = 'test';
		
		// Create test data
		const user = await User.create({ name: 'User', email: 'u@example.com', passwordHash: 'x', role: 'user' });
		const userToken = jwt.sign({ userId: user._id.toString(), role: 'user' }, config.jwtSecret);

		const create = await request(app)
			.post('/api/tickets')
			.set('Authorization', `Bearer ${userToken}`)
			.send({ title: 'Refund not received', description: 'I need a refund for my payment' });
		expect(create.status).toBe(201);
		const ticketId = create.body._id as string;

		// wait briefly for background triage
		await new Promise(r => setTimeout(r, 300));

		const suggestion = await AgentSuggestion.findOne({ ticketId }).lean();
		expect(suggestion).toBeTruthy();

		const audit = await AuditLog.find({ ticketId }).lean();
		expect(audit.length).toBeGreaterThanOrEqual(3);
	});
});


