import { Schema, model, Types } from 'mongoose';

export type TicketStatus = 'open' | 'triaged' | 'waiting_human' | 'resolved' | 'closed';
export type TicketCategory = 'billing' | 'tech' | 'shipping' | 'other';

export interface TicketDoc {
	_id: string;
	title: string;
	description: string;
	category: TicketCategory;
	status: TicketStatus;
	/** stable trace id for lifecycle and audit correlation */
	traceId: string;
	createdBy: Types.ObjectId;
	assignee?: Types.ObjectId;
	agentSuggestionId?: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const ticketSchema = new Schema<TicketDoc>({
	title: { type: String, required: true },
	description: { type: String, required: true },
	category: { type: String, enum: ['billing', 'tech', 'shipping', 'other'], default: 'other', index: true },
	status: { type: String, enum: ['open', 'triaged', 'waiting_human', 'resolved', 'closed'], default: 'open', index: true },
	traceId: { type: String, index: true },
	createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	assignee: { type: Schema.Types.ObjectId, ref: 'User' },
	agentSuggestionId: { type: Schema.Types.ObjectId, ref: 'AgentSuggestion' },
}, { timestamps: true });

export const Ticket = model<TicketDoc>('Ticket', ticketSchema);


