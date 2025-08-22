import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { AgentService } from '../services/AgentService.js';
import { AgentSuggestion } from '../models/AgentSuggestion.js';

const router = Router();
const service = new AgentService();

router.post('/triage', requireAuth, requireRole('admin', 'agent'), async (req, res) => {
	const { ticketId } = req.body as { ticketId?: string };
	if (!ticketId) return res.status(400).json({ error: 'ticketId required' });
	await service.triage(ticketId);
	return res.status(202).json({ ok: true });
});

router.get('/suggestion/:ticketId', requireAuth, async (req, res) => {
	const suggestion = await AgentSuggestion.findOne({ ticketId: req.params.ticketId }).sort({ createdAt: -1 }).lean();
	if (!suggestion) return res.status(404).json({ error: 'Not found' });
	return res.json(suggestion);
});

export default router;


