import 'dotenv/config';
import { connectToDatabase } from './db.js';
import { User } from './models/User.js';
import { Article } from './models/Article.js';
import { Ticket } from './models/Ticket.js';
import bcrypt from 'bcryptjs';

async function main() {
	await connectToDatabase();
	const password = await bcrypt.hash('password', 10);
	await User.deleteMany({});
	await Article.deleteMany({});
	await Ticket.deleteMany({});

	const admin = await User.create({ name: 'Admin', email: 'admin@example.com', passwordHash: password, role: 'admin' });
	const agent = await User.create({ name: 'Agent', email: 'agent@example.com', passwordHash: password, role: 'agent' });
	const user = await User.create({ name: 'User', email: 'user@example.com', passwordHash: password, role: 'user' });

	await Article.insertMany([
		{ title: 'How to update payment method', body: 'Steps to update card ...', tags: ['billing', 'payments'], status: 'published' },
		{ title: 'Troubleshooting 500 errors', body: 'Check logs and retry ...', tags: ['tech', 'errors'], status: 'published' },
		{ title: 'Tracking your shipment', body: 'Use tracking id ...', tags: ['shipping', 'delivery'], status: 'published' },
	]);

	await Ticket.insertMany([
		{ title: 'Refund for double charge', description: 'I was charged twice for order #1234', category: 'other', createdBy: user._id },
		{ title: 'App shows 500 on login', description: 'Stack trace mentions auth', category: 'other', createdBy: user._id },
		{ title: 'Where is my package?', description: 'Shipment delayed 5 days', category: 'other', createdBy: user._id },
	]);

	 
	console.log('Seeded users:', { admin: admin.email, agent: agent.email, user: user.email });
}

void main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });


