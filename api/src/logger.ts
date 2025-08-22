import pino from 'pino';
import { v4 as uuid } from 'uuid';

export const logger = pino({
	level: process.env.LOG_LEVEL || 'info',
	transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
});

export function requestLogger() {
	return (req: any, res: any, next: any) => {
		const reqId = uuid();
		const start = Date.now();
		res.on('finish', () => {
			const durationMs = Date.now() - start;
			logger.info({ reqId, method: req.method, url: req.originalUrl || req.url, status: res.statusCode, durationMs }, 'request');
		});
		next();
	};
}


