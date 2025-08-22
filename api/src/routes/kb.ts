import { Router } from 'express';
import { z } from 'zod';
import { Article } from '../models/Article.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Read access limited to staff (admin/agent). End users have no direct KB access
router.get('/', requireAuth, requireRole('admin', 'agent'), async (req, res) => {
	const query = String(req.query.query || '').trim();
	if (!query) {
		const articles = await Article.find({ status: 'published' }).limit(20).lean();
		return res.json(articles);
	}
	const results = await Article.find({ $text: { $search: query }, status: 'published' })
		.limit(10).lean();
	return res.json(results);
});

const upsertSchema = z.object({
	title: z.string().min(1),
	body: z.string().min(1),
	tags: z.array(z.string()).default([]),
	status: z.enum(['draft', 'published']).default('draft'),
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
	const parsed = upsertSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const created = await Article.create(parsed.data);
	return res.status(201).json(created);
});

router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
	const parsed = upsertSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const { id } = req.params;
	const updated = await Article.findByIdAndUpdate(id, parsed.data, { new: true });
	if (!updated) return res.status(404).json({ error: 'Not found' });
	return res.json(updated);
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
	const { id } = req.params;
	const deleted = await Article.findByIdAndDelete(id);
	if (!deleted) return res.status(404).json({ error: 'Not found' });
	return res.status(204).send();
});

export default router;


