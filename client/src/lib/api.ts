import type { 
  User, 
  Article, 
  Ticket, 
  AgentSuggestion, 
  AuditLog, 
  Config, 
  AuthResponse,
  // ApiResponse 
} from '@/types';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

class ApiError extends Error {
  public status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function showApiError(err: unknown, fallback = 'Something went wrong') {
  if (err instanceof ApiError) {
    toast.error(err.message || fallback);
  } else if (err && typeof err === 'object' && 'message' in err) {
    toast.error((err as any).message || fallback);
  } else {
    toast.error(fallback);
  }
}

async function request<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const maybeJson = await response.clone().json();
      if (maybeJson && typeof maybeJson.error === 'string') message = maybeJson.error;
    } catch {}
    
    // Don't show toast for 401 errors in request helper - let components handle it
    if (response.status !== 401) {
      toast.error(message);
    }
    
    throw new ApiError(response.status, message);
  }

  // Handle empty/204 responses gracefully
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // Try read text; if empty, return undefined
    const text = await response.text();
    return (text ? (JSON.parse(text) as unknown as T) : (undefined as unknown as T));
  }

  return response.json();
}

// Auth API
export const authApi = {
  async register(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async logout(): Promise<void> {
    await request<void>('/auth/logout', { method: 'POST' });
    localStorage.removeItem('user');
  },

  async me(): Promise<{ user: User }> {
    return request<{ user: User }>('/auth/me');
  },
};

// KB API
export const kbApi = {
  async search(query: string): Promise<Article[]> {
    return request<Article[]>(`/kb?query=${encodeURIComponent(query)}`);
  },

  async getById(id: string): Promise<Article> {
    return request<Article>(`/kb/${id}`);
  },

  async create(data: { title: string; body: string; tags: string[]; status: 'draft' | 'published' }): Promise<Article> {
    return request<Article>('/kb', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<Article>): Promise<Article> {
    return request<Article>(`/kb/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return request<void>(`/kb/${id}`, {
      method: 'DELETE',
    });
  },
};

// Tickets API
export const ticketsApi = {
  async create(data: { title: string; description: string; category?: string }): Promise<Ticket> {
    return request<Ticket>('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAll(filters?: { status?: string; category?: string }): Promise<Ticket[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    
    const query = params.toString();
    return request<Ticket[]>(`/tickets${query ? `?${query}` : ''}`);
  },

  async getById(id: string): Promise<Ticket> {
    return request<Ticket>(`/tickets/${id}`);
  },

  async reply(id: string, reply: string): Promise<void> {
    return request<void>(`/tickets/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message: reply }),
    });
  },

  async assign(id: string, assigneeId: string): Promise<void> {
    return request<void>(`/tickets/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assigneeId }),
    });
  },
};

// Agent API
export const agentApi = {
  async triage(ticketId: string): Promise<void> {
    return request<void>('/agent/triage', {
      method: 'POST',
      body: JSON.stringify({ ticketId }),
    });
  },

  async getSuggestion(ticketId: string): Promise<AgentSuggestion> {
    const res = await fetch(`${API_BASE}/agent/suggestion/${ticketId}`, { credentials: 'include' });
    if (res.status === 204) {
      return undefined as unknown as AgentSuggestion;
    }
    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const maybeJson = await res.clone().json();
        if (maybeJson && typeof maybeJson.error === 'string') message = maybeJson.error;
      } catch {}
      throw new ApiError(res.status, message);
    }
    return res.json();
  },
};

// Config API
export const configApi = {
  async get(): Promise<Config> {
    return request<Config>('/config');
  },

  async update(data: Partial<Config>): Promise<Config> {
    return request<Config>('/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Audit API
export const auditApi = {
  async getTicketAudit(ticketId: string): Promise<AuditLog[]> {
    return request<AuditLog[]>(`/tickets/${ticketId}/audit`);
  },
};

export { ApiError };
