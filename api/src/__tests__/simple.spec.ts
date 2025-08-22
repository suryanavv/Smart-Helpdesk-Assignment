import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('Simple Integration Test', () => {
  it('runs a basic health check', async () => {
    const response = await request(app).get('/healthz');
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it('runs a basic ready check', async () => {
    const response = await request(app).get('/readyz');
    expect(response.status).toBe(200);
    expect(response.body.ready).toBe(true);
  });
});
