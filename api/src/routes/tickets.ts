import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Ticket } from '../models/Ticket.js';
import { AuditLog } from '../models/AuditLog.js';
import { AgentService } from '../services/AgentService.js';
import { logger } from '../logger.js';
import { v4 as uuid } from 'uuid';
import { notify } from '../services/NotificationService.js';

const router = Router();

const createSchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1),
	category: z.enum(['billing', 'tech', 'shipping', 'other']).optional(),
});

router.post('/', requireAuth, async (req, res) => {
	const parsed = createSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const { title, description, category } = parsed.data;
	const traceId = uuid();
	const ticket = await Ticket.create({ title, description, category: category || 'other', createdBy: req.auth!.userId, traceId });
	await AuditLog.create({ ticketId: ticket._id, traceId, actor: 'user', action: 'TICKET_CREATED', meta: {}, timestamp: new Date() });
	notify({ type: 'TICKET_CREATED', ticketId: String(ticket._id) });
	// Trigger triage internally (fire-and-forget)
	(async () => {
		try {
			const service = new AgentService();
			await service.triage(String(ticket._id));
		} catch (err) {
			logger.error({ err, ticketId: String(ticket._id) }, 'Failed to triage ticket');
		}
	})();
	return res.status(201).json(ticket);
});

router.get('/', requireAuth, async (req, res) => {
	const status = String(req.query.status || '');
	const mine = String(req.query.mine || 'false').toLowerCase() === 'true';
	const assignedToMe = String(req.query.assignedToMe || 'false').toLowerCase() === 'true';
	const filter: Record<string, unknown> = {};
	if (status) filter.status = status;
	if (mine) filter.createdBy = req.auth!.userId;
	if (assignedToMe) filter.assignee = req.auth!.userId;
	const tickets = await Ticket.find(filter).sort({ createdAt: -1 }).limit(50).lean();
	return res.json(tickets);
});

router.get('/:id', requireAuth, async (req, res) => {
	const ticket = await Ticket.findById(req.params.id).lean();
	if (!ticket) return res.status(404).json({ error: 'Not found' });
	return res.json(ticket);
});

const replySchema = z.object({ message: z.string().min(1) });

router.post('/:id/reply', requireAuth, requireRole('agent', 'admin'), async (req, res) => {
	const parsed = replySchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const ticket = await Ticket.findById(req.params.id);
	if (!ticket) return res.status(404).json({ error: 'Not found' });
	await AuditLog.create({ ticketId: ticket._id, traceId: ticket.traceId, actor: 'agent', action: 'REPLY_SENT', meta: { message: parsed.data.message }, timestamp: new Date() });
	notify({ type: 'REPLY_SENT', ticketId: String(ticket._id), payload: { message: parsed.data.message } });
	return res.status(204).send();
});

const assignSchema = z.object({ assigneeId: z.string().min(1) });

router.post('/:id/assign', requireAuth, requireRole('agent', 'admin'), async (req, res) => {
	const parsed = assignSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const ticket = await Ticket.findByIdAndUpdate(req.params.id, { assignee: parsed.data.assigneeId }, { new: true });
	if (!ticket) return res.status(404).json({ error: 'Not found' });
	await AuditLog.create({ ticketId: ticket._id, traceId: ticket.traceId, actor: 'agent', action: 'ASSIGNED_TO_HUMAN', meta: { assigneeId: parsed.data.assigneeId }, timestamp: new Date() });
	notify({ type: 'ASSIGNED_TO_HUMAN', ticketId: String(ticket._id), payload: { assigneeId: parsed.data.assigneeId } });
	return res.json(ticket);
});

export default router;


