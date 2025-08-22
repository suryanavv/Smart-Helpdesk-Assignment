import type { Response } from 'express';
import { config } from '../config.js';
import { logger } from '../logger.js';

type NotificationEvent = {
	/** e.g., TICKET_CREATED, STATUS_CHANGED, REPLY_SENT, ASSIGNED_TO_HUMAN */
	type: string;
	/** Ticket identifier related to the event */
	ticketId: string;
	/** Optional payload depending on event type */
	payload?: Record<string, unknown>;
};

/**
 * Very simple in-memory SSE broadcaster for notifications.
 * Not suitable for multi-process deployments; for production, use Redis pub/sub or a message bus.
 */
class InMemoryBroadcaster {
	private subscribers: Set<Response> = new Set();

	addSubscriber(res: Response): void {
		this.subscribers.add(res);
		// Send an initial comment to keep the connection alive
		res.write(`: connected\n\n`);
	}

	removeSubscriber(res: Response): void {
		this.subscribers.delete(res);
	}

	broadcast(event: NotificationEvent): void {
		const data = JSON.stringify(event);
		for (const res of this.subscribers) {
			try {
				res.write(`event: ${event.type}\n`);
				res.write(`data: ${data}\n\n`);
			} catch {
				// If the client is gone, drop it
				this.subscribers.delete(res);
			}
		}
	}
}

// Optional Redis-backed pub/sub implementation
// Dynamically import to avoid hard dependency if not configured
let redisPublisher: any = null as unknown as { publish: (channel: string, message: string) => Promise<number> } | null;
let redisSubscriber: any = null as unknown as { subscribe: (channel: string) => Promise<void>; on: (ev: string, cb: (ch: string, msg: string) => void) => void } | null;

async function ensureRedis(): Promise<boolean> {
	if (!config.redisUrl) return false;
	if (redisPublisher && redisSubscriber) return true;
	try {
		const RedisCtor: any = (await import('ioredis')).default as unknown as any;
		redisPublisher = new RedisCtor(config.redisUrl);
		redisSubscriber = new RedisCtor(config.redisUrl);
		await redisSubscriber.subscribe('notifications');
		logger.info('Redis pub/sub connected for notifications');
		return true;
	} catch (err) {
		logger.warn({ err }, 'Failed to initialize Redis; falling back to in-memory notifications');
		redisPublisher = null;
		redisSubscriber = null;
		return false;
	}
}

const memory = new InMemoryBroadcaster();

// When Redis is active, forward messages to in-memory subscribers
(async () => {
	if (await ensureRedis()) {
		redisSubscriber!.on('message', (_channel: string, message: string) => {
			try {
				const event = JSON.parse(message) as NotificationEvent;
				memory.broadcast(event);
			} catch {}
		});
	}
})();

export const notificationBroadcaster = {
	addSubscriber(res: Response) {
		memory.addSubscriber(res);
	},
	removeSubscriber(res: Response) {
		memory.removeSubscriber(res);
	},
};

export async function notify(event: NotificationEvent): Promise<void> {
	const payload = JSON.stringify(event);
	if (await ensureRedis()) {
		await redisPublisher!.publish('notifications', payload);
		return;
	}
	memory.broadcast(event);
}


