import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { User } from '../models/User.js';
import { Ticket } from '../models/Ticket.js';
import { AgentSuggestion } from '../models/AgentSuggestion.js';
import { AuditLog } from '../models/AuditLog.js';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

describe('Agent', () => {
	it('performs triage and creates suggestion', async () => {
		// Create test data
		const user = await User.create({ name: 'User', email: 'u@example.com', passwordHash: 'x', role: 'user' });
		const ticket = await Ticket.create({
			title: 'Payment issue',
			description: 'I was charged twice for the same item',
			category: 'billing',
			status: 'open',
			createdBy: user._id
		});

		// Trigger triage
		const res = await request(app)
			.post('/api/agent/triage')
			.set('Authorization', `Bearer ${jwt.sign({ userId: user._id.toString(), role: 'agent' }, config.jwtSecret)}`)
			.send({ ticketId: ticket._id.toString() });
		
		expect(res.status).toBe(202); // Agent triage returns 202 Accepted

		// Wait for triage to complete
		await new Promise(r => setTimeout(r, 500));

		// Check suggestion was created
		const suggestion = await AgentSuggestion.findOne({ ticketId: ticket._id }).lean();
		expect(suggestion).toBeTruthy();
		expect(suggestion!.predictedCategory).toBe('billing');
		expect(suggestion!.draftReply).toBeDefined();

		// Check audit logs
		const audit = await AuditLog.find({ ticketId: ticket._id }).lean();
		expect(audit.length).toBeGreaterThanOrEqual(4); // TICKET_RECEIVED, AGENT_CLASSIFIED, KB_RETRIEVED, DRAFT_GENERATED
	});

	it('fetches suggestion for a ticket', async () => {
		// Create test data
		const user = await User.create({ name: 'User', email: 'u@example.com', passwordHash: 'x', role: 'user' });
		const ticket = await Ticket.create({
			title: 'Tech support needed',
			description: 'Getting 500 error when trying to login',
			category: 'tech',
			status: 'open',
			createdBy: user._id
		});

		// Create a suggestion
		const suggestion = await AgentSuggestion.create({
			ticketId: ticket._id,
			predictedCategory: 'tech',
			articleIds: [],
			draftReply: 'Here are some steps to resolve the 500 error...',
			confidence: 0.85,
			autoClosed: false,
			modelInfo: {
				provider: 'stub',
				model: 'heuristic',
				promptVersion: '1.0',
				latencyMs: 50
			}
		});

		// Fetch suggestion
		const res = await request(app)
			.get(`/api/agent/suggestion/${ticket._id.toString()}`)
			.set('Authorization', `Bearer ${jwt.sign({ userId: user._id.toString(), role: 'user' }, config.jwtSecret)}`);
		
		expect(res.status).toBe(200);
		expect(res.body._id).toBe(suggestion._id.toString());
		expect(res.body.predictedCategory).toBe('tech');
	});
});
