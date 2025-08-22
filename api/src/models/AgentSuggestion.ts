import { Schema, model, Types } from 'mongoose';

export interface AgentSuggestionDoc {
	_id: string;
	ticketId: Types.ObjectId;
	predictedCategory: 'billing' | 'tech' | 'shipping' | 'other';
	articleIds: string[];
	draftReply: string;
	confidence: number;
	autoClosed: boolean;
	modelInfo: { provider: string; model: string; promptVersion: string; latencyMs: number };
	createdAt: Date;
}

const agentSuggestionSchema = new Schema<AgentSuggestionDoc>({
	ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
	predictedCategory: { type: String, enum: ['billing', 'tech', 'shipping', 'other'], required: true },
	articleIds: { type: [String], default: [] },
	draftReply: { type: String, required: true },
	confidence: { type: Number, required: true },
	autoClosed: { type: Boolean, default: false },
	modelInfo: { provider: String, model: String, promptVersion: String, latencyMs: Number },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const AgentSuggestion = model<AgentSuggestionDoc>('AgentSuggestion', agentSuggestionSchema);


