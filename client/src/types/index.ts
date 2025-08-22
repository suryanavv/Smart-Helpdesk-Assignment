export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'agent' | 'user';
  createdAt?: string;
}

export interface Article {
  _id: string;
  title: string;
  body: string;
  tags: string[];
  status: 'draft' | 'published';
  updatedAt: string;
}

export interface Ticket {
  _id: string;
  title: string;
  description: string;
  category: 'billing' | 'tech' | 'shipping' | 'other';
  status: 'open' | 'triaged' | 'waiting_human' | 'resolved' | 'closed';
  traceId: string;
  createdBy: string;
  assignee?: string;
  agentSuggestionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentSuggestion {
  _id: string;
  ticketId: string;
  predictedCategory: 'billing' | 'tech' | 'shipping' | 'other';
  articleIds: string[];
  draftReply: string;
  confidence: number;
  autoClosed: boolean;
  modelInfo: {
    provider: string;
    model: string;
    promptVersion: string;
    latencyMs: number;
  };
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  ticketId: string;
  traceId: string;
  actor: 'system' | 'agent' | 'user';
  action: string;
  meta?: Record<string, any>;
  timestamp: string;
}

export interface Config {
  _id: string;
  autoCloseEnabled: boolean;
  confidenceThreshold: number;
  slaHours: number;
}

export interface AuthResponse {
  user: User;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}
