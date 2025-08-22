import { v4 as uuid } from 'uuid';
import { Article } from '../models/Article.js';
import { AgentSuggestion } from '../models/AgentSuggestion.js';
import { AuditLog } from '../models/AuditLog.js';
import { Ticket } from '../models/Ticket.js';
import { config } from '../config.js';
import { StubLLMProvider } from '../agent/StubLLMProvider.js';
import { logger } from '../logger.js';
import { notify } from './NotificationService.js';

const triageLocks = new Set<string>();

export class AgentService {
	private provider = new StubLLMProvider();

	async triage(ticketId: string): Promise<void> {
		if (triageLocks.has(ticketId)) {
			logger.warn({ ticketId }, 'triage already in progress; skipping');
			return;
		}
		triageLocks.add(ticketId);
		const ticket = await Ticket.findById(ticketId);
		if (!ticket) return;
		const traceId = ticket.traceId || uuid();
		if (!ticket.traceId) {
			// Backfill in case of legacy tickets
			ticket.traceId = traceId;
			await ticket.save();
		}
		await AuditLog.create({ ticketId: ticket._id, traceId, actor: 'system', action: 'TICKET_RECEIVED', timestamp: new Date() });

		const classification = await this.withRetry(() => this.withTimeout(() => this.provider.classify(`${ticket.title}\n${ticket.description}`), 1500, 'classify'), 2, 'classify');
		await AuditLog.create({ ticketId: ticket._id, traceId, actor: 'system', action: 'AGENT_CLASSIFIED', meta: classification, timestamp: new Date() });

		const topArticles = await Article.find({ $text: { $search: ticket.title } }).limit(3).lean();
		await AuditLog.create({ ticketId: ticket._id, traceId, actor: 'system', action: 'KB_RETRIEVED', meta: { articleIds: topArticles.map(a => a._id) }, timestamp: new Date() });

		const started = Date.now();
		const draft = await this.withRetry(() => this.withTimeout(() => this.provider.draft(ticket.description, topArticles.map(a => ({ _id: String(a._id), title: a.title }))), 1500, 'draft'), 2, 'draft');
		const latencyMs = Date.now() - started;
		await AuditLog.create({ ticketId: ticket._id, traceId, actor: 'system', action: 'DRAFT_GENERATED', meta: draft, timestamp: new Date() });

		const autoClose = config.autoCloseEnabled && classification.confidence >= config.confidenceThreshold;
		const suggestion = await AgentSuggestion.create({
			ticketId: ticket._id,
			predictedCategory: classification.predictedCategory,
			articleIds: draft.citations,
			draftReply: draft.draftReply,
			confidence: classification.confidence,
			autoClosed: autoClose,
			modelInfo: { provider: 'stub', model: 'heuristic', promptVersion: 'v1', latencyMs },
		});

		if (autoClose) {
			await Ticket.findByIdAndUpdate(ticket._id, { status: 'resolved', agentSuggestionId: suggestion._id });
			await AuditLog.create({ ticketId: ticket._id, traceId, actor: 'system', action: 'AUTO_CLOSED', timestamp: new Date() });
			notify({ type: 'STATUS_CHANGED', ticketId: String(ticket._id), payload: { status: 'resolved' } });
		} else {
			await Ticket.findByIdAndUpdate(ticket._id, { status: 'waiting_human', agentSuggestionId: suggestion._id });
			await AuditLog.create({ ticketId: ticket._id, traceId, actor: 'system', action: 'ASSIGNED_TO_HUMAN', timestamp: new Date() });
			notify({ type: 'STATUS_CHANGED', ticketId: String(ticket._id), payload: { status: 'waiting_human' } });
		}
		triageLocks.delete(ticketId);
	}

	private async withTimeout<T>(fn: () => Promise<T>, ms: number, step: string): Promise<T> {
		const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Timeout in ${step}`)), ms));
		try {
			// eslint-disable-next-line @typescript-eslint/await-thenable
			return await Promise.race([fn(), timeout]);
		} catch (err) {
			logger.error({ err, step }, 'Agent step failed');
			throw err;
		}
	}

	private async withRetry<T>(fn: () => Promise<T>, retries: number, step: string): Promise<T> {
		let lastError: unknown;
		for (let attempt = 0; attempt <= retries; attempt++) {
			try {
				return await fn();
			} catch (err) {
				lastError = err;
				logger.warn({ step, attempt }, 'retrying agent step');
				await new Promise(r => setTimeout(r, 100 * (attempt + 1)));
			}
		}
		throw lastError as Error;
	}
}


