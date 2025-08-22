import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { ticketsApi } from '@/lib/api'

const originalFetch = global.fetch

describe('API client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('builds tickets list URL with filters', async () => {
    const mock = vi.fn().mockResolvedValue({ ok: true, headers: { get: () => 'application/json' }, json: async () => ([])} as any)
    // @ts-ignore
    global.fetch = mock

    await ticketsApi.getAll({ status: 'open', category: 'billing' })

    const calledUrl: string = mock.mock.calls[0][0]
    expect(calledUrl).toContain('/tickets?')
    expect(calledUrl).toContain('status=open')
    expect(calledUrl).toContain('category=billing')
  })

  it('handles 204 from suggestion as undefined', async () => {
    const { agentApi } = await import('@/lib/api')
    const mock = vi.fn().mockResolvedValue({ ok: true, status: 204 } as any)
    // @ts-ignore
    global.fetch = mock

    // @ts-ignore
    const res = await agentApi.getSuggestion('t1')
    expect(res).toBeUndefined()
  })
})

afterAll(() => {
  // @ts-ignore
  global.fetch = originalFetch
})
