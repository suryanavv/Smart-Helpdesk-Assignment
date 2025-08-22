import { Schema, model } from 'mongoose';

export interface UserDoc {
	_id: string;
	name: string;
	email: string;
	passwordHash: string;
	role: 'admin' | 'agent' | 'user';
	createdAt: Date;
}

const userSchema = new Schema<UserDoc>({
	name: { type: String, required: true },
	email: { type: String, required: true, unique: true, index: true },
	passwordHash: { type: String, required: true },
	role: { type: String, enum: ['admin', 'agent', 'user'], default: 'user', index: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const User = model<UserDoc>('User', userSchema);


