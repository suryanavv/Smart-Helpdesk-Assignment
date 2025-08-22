import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ConfigModel } from '../models/Config.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), async (_req, res) => {
	const cfg = await ConfigModel.findOne().lean();
	return res.json(cfg || { autoCloseEnabled: true, confidenceThreshold: 0.78, slaHours: 24 });
});

const schema = z.object({
	autoCloseEnabled: z.boolean(),
	confidenceThreshold: z.number().min(0).max(1),
	slaHours: z.number().min(1),
});

router.put('/', requireAuth, requireRole('admin'), async (req, res) => {
	const parsed = schema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const updated = await ConfigModel.findOneAndUpdate({}, parsed.data, { upsert: true, new: true });
	return res.json(updated);
});

export default router;


