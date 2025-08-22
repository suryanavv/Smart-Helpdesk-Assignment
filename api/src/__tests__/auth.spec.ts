import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('Auth', () => {
	it('registers and logs in a user', async () => {
		const reg = await request(app).post('/api/auth/register').send({ name: 'A', email: 'a@example.com', password: 'secret1' });
		expect(reg.status).toBe(200);
		expect(reg.body.token).toBeDefined();
		expect(reg.body.user.email).toBe('a@example.com');

		const login = await request(app).post('/api/auth/login').send({ email: 'a@example.com', password: 'secret1' });
		expect(login.status).toBe(200);
		expect(login.body.token).toBeDefined();
	});
});


