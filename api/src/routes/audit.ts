import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { AuditLog } from '../models/AuditLog.js';

const router = Router();

router.get('/tickets/:id/audit', requireAuth, async (req, res) => {
	const events = await AuditLog.find({ ticketId: req.params.id }).sort({ timestamp: 1 }).lean();
	return res.json(events);
});

export default router;


