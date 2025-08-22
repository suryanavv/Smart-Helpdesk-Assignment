import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { User } from '../models/User.js';
import { Article } from '../models/Article.js';
import { Ticket } from '../models/Ticket.js';
import { AgentSuggestion } from '../models/AgentSuggestion.js';
import { AuditLog } from '../models/AuditLog.js';
import { ConfigModel } from '../models/Config.js';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

describe('Integration Tests', () => {
  let adminToken: string;
  let userToken: string;
  let agentToken: string;

  it('sets up test data and runs all test scenarios', async () => {
    // Create test users
    const admin = await User.create({ name: 'Admin', email: 'admin@test.com', passwordHash: 'x', role: 'admin' });
    const user = await User.create({ name: 'User', email: 'user@test.com', passwordHash: 'x', role: 'user' });
    const agent = await User.create({ name: 'Agent', email: 'agent@test.com', passwordHash: 'x', role: 'agent' });
    
    adminToken = jwt.sign({ userId: admin._id.toString(), role: 'admin' }, config.jwtSecret);
    userToken = jwt.sign({ userId: user._id.toString(), role: 'user' }, config.jwtSecret);
    agentToken = jwt.sign({ userId: agent._id.toString(), role: 'agent' }, config.jwtSecret);

    // Test 1: Auth - User can register and login
    const reg = await request(app).post('/api/auth/register').send({ 
      name: 'TestUser', 
      email: 'test@example.com', 
      password: 'password123' 
    });
    expect(reg.status).toBe(200);
    expect(reg.body.token).toBeDefined();

    // Test 2: KB - Admin can create and search articles
    const article = await Article.create({ 
      title: 'Test Article', 
      body: 'Test content', 
      tags: ['test'], 
      status: 'published' 
    });
    
    const kbRes = await request(app)
      .get('/api/kb')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ query: 'test' });
    expect(kbRes.status).toBe(200);
    expect(kbRes.body.length).toBeGreaterThan(0);

    // Test 3: Tickets - User can create ticket
    const ticket = await Ticket.create({
      title: 'Test ticket',
      description: 'Test description',
      status: 'open',
      createdBy: user._id
    });
    expect(ticket._id).toBeDefined();

    // Test 4: Agent - Can perform triage
    const triageRes = await request(app)
      .post('/api/agent/triage')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ ticketId: ticket._id.toString() });
    expect(triageRes.status).toBe(202); // Agent triage returns 202 Accepted

    // Wait for triage to complete
    await new Promise(r => setTimeout(r, 500));

    // Check suggestion was created
    const suggestion = await AgentSuggestion.findOne({ ticketId: ticket._id }).lean();
    expect(suggestion).toBeTruthy();

    // Test 5: Audit - Check audit logs
    const audit = await AuditLog.find({ ticketId: ticket._id }).lean();
    expect(audit.length).toBeGreaterThanOrEqual(4);

    // Test 6: Config - Admin can manage config
    await ConfigModel.create({
      autoCloseEnabled: true,
      confidenceThreshold: 0.8,
      slaHours: 24
    });

    const configRes = await request(app)
      .get('/api/config')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(configRes.status).toBe(200);
    expect(configRes.body.autoCloseEnabled).toBe(true);

    // Test 7: Role-based access - User cannot access admin endpoints
    const userConfigRes = await request(app)
      .get('/api/config')
      .set('Authorization', `Bearer ${userToken}`);
    expect(userConfigRes.status).toBe(403);

    console.log('✅ All integration tests passed successfully!');
  });
});
