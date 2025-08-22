import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { User } from '../models/User.js';
import { Ticket } from '../models/Ticket.js';
import { AuditLog } from '../models/AuditLog.js';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

describe('Audit', () => {
	it('logs ticket creation with audit trail', async () => {
		// Create test data
		const user = await User.create({ name: 'User', email: 'u@example.com', passwordHash: 'x', role: 'user' });
		const userToken = jwt.sign({ userId: user._id.toString(), role: 'user' }, config.jwtSecret);

		// Create a ticket
		const create = await request(app)
			.post('/api/tickets')
			.set('Authorization', `Bearer ${userToken}`)
			.send({ title: 'Test ticket', description: 'Test description' });
		
		expect(create.status).toBe(201);
		const ticketId = create.body._id as string;

		// Check audit logs
		const audit = await AuditLog.find({ ticketId }).lean();
		expect(audit.length).toBeGreaterThanOrEqual(1);
		
		const ticketCreated = audit.find(log => log.action === 'TICKET_CREATED');
		expect(ticketCreated).toBeTruthy();
		expect(ticketCreated.actor).toBe('user');
		expect(ticketCreated.ticketId.toString()).toBe(ticketId);
	});

	it('logs agent actions with traceId', async () => {
		// Create test data
		const user = await User.create({ name: 'User', email: 'u@example.com', passwordHash: 'x', role: 'user' });
		const ticket = await Ticket.create({
			title: 'Test ticket',
			description: 'Test description',
			status: 'open',
			createdBy: user._id
		});

		// Trigger triage
		await request(app)
			.post('/api/agent/triage')
			.set('Authorization', `Bearer ${jwt.sign({ userId: user._id.toString(), role: 'agent' }, config.jwtSecret)}`)
			.send({ ticketId: ticket._id.toString() });

		// Wait for triage to complete
		await new Promise(r => setTimeout(r, 500));

		// Check audit logs have consistent traceId
		const audit = await AuditLog.find({ ticketId: ticket._id }).lean();
		expect(audit.length).toBeGreaterThanOrEqual(4);
		
		const traceIds = [...new Set(audit.map(log => log.traceId))];
		expect(traceIds.length).toBe(1); // All logs should have the same traceId
		
		// Check specific actions were logged
		const actions = audit.map(log => log.action);
		expect(actions).toContain('TICKET_RECEIVED');
		expect(actions).toContain('AGENT_CLASSIFIED');
		expect(actions).toContain('KB_RETRIEVED');
		expect(actions).toContain('DRAFT_GENERATED');
	});
});
