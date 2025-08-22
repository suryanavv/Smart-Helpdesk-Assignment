import { Schema, model } from 'mongoose';

export interface ConfigDoc {
	_id: string;
	autoCloseEnabled: boolean;
	confidenceThreshold: number;
	slaHours: number;
}

const configSchema = new Schema<ConfigDoc>({
	autoCloseEnabled: { type: Boolean, default: true },
	confidenceThreshold: { type: Number, default: 0.78 },
	slaHours: { type: Number, default: 24 },
});

export const ConfigModel = model<ConfigDoc>('Config', configSchema);


