import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectToDatabase } from './db.js';
import { config } from './config.js';
import { requestLogger, logger } from './logger.js';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import kbRoutes from './routes/kb.js';
import ticketsRoutes from './routes/tickets.js';
import configRoutes from './routes/config.js';
import auditRoutes from './routes/audit.js';
import agentRoutes from './routes/agent.js';
import notificationRoutes from './routes/notifications.js';

const app = express();

app.use(helmet());

// Configure CORS with proper cookie handling for development
const corsOptions = process.env.NODE_ENV === 'development' 
  ? { 
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true 
    }
  : { 
      origin: config.corsOrigin, 
      credentials: true 
    };

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(requestLogger());

// Rate limit auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 });
app.use('/api/auth', authLimiter);

app.get('/healthz', (_req: any, res: any) => res.status(200).json({ ok: true }));
app.get('/readyz', (_req: any, res: any) => res.status(200).json({ ready: true }));

app.use('/api/auth', authRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/config', configRoutes);
// Mount audit routes at /api to expose /api/tickets/:id/audit per PRD
app.use('/api', auditRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/notifications', notificationRoutes);

// Basic error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	logger.error({ err }, 'unhandled_error');
	return res.status(500).json({ error: 'Internal Server Error' });
});

const port = config.port;

if (process.env.NODE_ENV !== 'test') {
	void connectToDatabase().then(() => {
		app.listen(port, () => {
			// eslint-disable-next-line no-console
			console.log(`API listening on http://localhost:${port}`);
		});
	});
}

export default app;


