import type { LLMProvider, ClassificationResult, DraftResult } from './LLMProvider.js';

const BILLING = ['refund', 'invoice', 'payment', 'charge', 'billing'];
const TECH = ['error', 'bug', 'stack', 'crash', '500', 'exception'];
const SHIPPING = ['delivery', 'shipment', 'tracking', 'package', 'courier'];

function scoreByKeywords(text: string, keywords: string[]): number {
	const lc = text.toLowerCase();
	let hits = 0;
	for (const kw of keywords) {
		if (lc.includes(kw)) hits += 1;
	}
	return Math.min(1, hits / Math.max(3, keywords.length));
}

export class StubLLMProvider implements LLMProvider {
	async classify(inputText: string): Promise<ClassificationResult> {
		const billingScore = scoreByKeywords(inputText, BILLING);
		const techScore = scoreByKeywords(inputText, TECH);
		const shippingScore = scoreByKeywords(inputText, SHIPPING);
		const pairs: Array<[ClassificationResult['predictedCategory'], number]> = [
			['billing', billingScore],
			['tech', techScore],
			['shipping', shippingScore],
			['other', 0.2],
		];
		pairs.sort((a, b) => b[1] - a[1]);
		const top = pairs[0] ?? ['other', 0] as const;
		const predictedCategory = top[0];
		const confidence = top[1];
		return { predictedCategory, confidence };
	}

	async draft(inputText: string, articles: Array<{ _id: string; title: string }>): Promise<DraftResult> {
		const lines = [
			"Thanks for reaching out. Here's what we found:",
			...articles.map((a, idx) => `${idx + 1}. ${a.title} [${a._id}]`),
			'If this resolves your issue, feel free to close the ticket. Otherwise, reply and an agent will assist you.',
		];
		return { draftReply: lines.join('\n'), citations: articles.map(a => a._id) };
	}
}


