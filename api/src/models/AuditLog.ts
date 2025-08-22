import { Schema, model, Types } from 'mongoose';

export type AuditActor = 'system' | 'agent' | 'user';

export interface AuditLogDoc {
	_id: string;
	ticketId: Types.ObjectId;
	traceId: string;
	actor: AuditActor;
	action: string;
	meta?: Record<string, unknown>;
	timestamp: Date;
}

const auditLogSchema = new Schema<AuditLogDoc>({
	ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
	traceId: { type: String, required: true, index: true },
	actor: { type: String, enum: ['system', 'agent', 'user'], required: true },
	action: { type: String, required: true },
	meta: { type: Schema.Types.Mixed },
	timestamp: { type: Date, default: () => new Date(), index: true },
});

export const AuditLog = model<AuditLogDoc>('AuditLog', auditLogSchema);


