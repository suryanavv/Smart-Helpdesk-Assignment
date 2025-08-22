import type express from 'express';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { notificationBroadcaster } from '../services/NotificationService.js';

const router = Router();

// Simple SSE endpoint for in-app notifications
router.get('/stream', requireAuth, (req: express.Request, res: express.Response) => {
	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Connection', 'keep-alive');
	res.flushHeaders?.();

	notificationBroadcaster.addSubscriber(res);

	const keepAlive = setInterval(() => {
		try {
			res.write(': keep-alive\n\n');
		} catch {
			// Connection likely closed
		}
	}, 25000);

	req.on('close', () => {
		clearInterval(keepAlive);
		notificationBroadcaster.removeSubscriber(res);
	});
});

export default router;


