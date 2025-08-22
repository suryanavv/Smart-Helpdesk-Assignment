import { Schema, model } from 'mongoose';

export interface ArticleDoc {
	_id: string;
	title: string;
	body: string;
	tags: string[];
	status: 'draft' | 'published';
	updatedAt: Date;
}

const articleSchema = new Schema<ArticleDoc>({
	title: { type: String, required: true, index: 'text' },
	body: { type: String, required: true, index: 'text' },
	tags: { type: [String], default: [], index: true },
	status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
}, { timestamps: { createdAt: false, updatedAt: true } });

articleSchema.index({ title: 'text', body: 'text', tags: 'text' });

export const Article = model<ArticleDoc>('Article', articleSchema);


