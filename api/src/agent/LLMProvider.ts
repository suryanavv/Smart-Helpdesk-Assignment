import type { ArticleDoc } from '../models/Article.js';

export interface ClassificationResult {
	predictedCategory: 'billing' | 'tech' | 'shipping' | 'other';
	confidence: number;
}

export interface DraftResult {
	draftReply: string;
	citations: string[]; // article IDs
}

export interface LLMProvider {
	classify(inputText: string): Promise<ClassificationResult>;
	draft(inputText: string, articles: Array<Pick<ArticleDoc, '_id' | 'title'>>): Promise<DraftResult>;
}


