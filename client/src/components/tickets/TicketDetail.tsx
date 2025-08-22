import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { agentApi, auditApi, ticketsApi } from '@/lib/api';
import type { AgentSuggestion, AuditLog, Ticket } from '@/types';
import { ArrowLeft, Send, Sparkles, Clock, CheckCircle2, User, Bot } from 'lucide-react';

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [suggestion, setSuggestion] = useState<AgentSuggestion | null>(null);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isTriageLoading, setIsTriageLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [t, a] = await Promise.all([
          ticketsApi.getById(id),
          auditApi.getTicketAudit(id),
        ]);
        setTicket(t);
        setAudit(a.sort((x, y) => new Date(x.timestamp).getTime() - new Date(y.timestamp).getTime()));
        try {
          const s = await agentApi.getSuggestion(id);
          setSuggestion(s);
          setReply(s.draftReply);
        } catch {
          // no suggestion yet
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const statusBadge = useMemo(() => {
    if (!ticket) return null;
    const color = {
      open: 'bg-blue-100 text-blue-800',
      triaged: 'bg-yellow-100 text-yellow-800',
      waiting_human: 'bg-orange-100 text-orange-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    }[ticket.status] || 'bg-gray-100 text-gray-800';
    return (
      <Badge variant="secondary" className={color}>
        {ticket.status.replace('_', ' ')}
      </Badge>
    );
  }, [ticket]);

  const handleReply = async () => {
    if (!id || !reply.trim()) return;
    setIsReplying(true);
    try {
      await ticketsApi.reply(id, reply.trim());
      navigate('/tickets');
    } catch (e) {
      console.error(e);
    } finally {
      setIsReplying(false);
    }
  };

  const triggerTriage = async () => {
    if (!id) return;
    setIsTriageLoading(true);
    try {
      await agentApi.triage(id);
      // re-fetch suggestion and audit
      try {
        const s = await agentApi.getSuggestion(id);
        setSuggestion(s);
        setReply(s.draftReply);
      } catch {}
      const a = await auditApi.getTicketAudit(id);
      setAudit(a.sort((x, y) => new Date(x.timestamp).getTime() - new Date(y.timestamp).getTime()));
    } finally {
      setIsTriageLoading(false);
    }
  };

  if (loading || !ticket) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2"><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" onClick={() => navigate('/tickets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{ticket.title}</h1>
          {statusBadge}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={triggerTriage} disabled={isTriageLoading}>
            <Sparkles className="mr-2 h-4 w-4" />
            {isTriageLoading ? 'Triaging...' : 'Run Triage'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ticket Details</CardTitle>
            <CardDescription>Submitted on {new Date(ticket.createdAt).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Category</h4>
                <div className="mt-1">
                  <Badge variant="secondary">{ticket.category}</Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Suggestion */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Suggestion</CardTitle>
            <CardDescription>
              AI-generated draft reply {suggestion ? `· ${Math.round(suggestion.confidence * 100)}% confidence` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!suggestion ? (
              <div className="text-sm text-muted-foreground">
                No suggestion yet. Run triage to generate a draft reply.
              </div>
            ) : (
              <div className="space-y-3">
                <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{suggestion.draftReply}</pre>
                <div className="text-xs text-muted-foreground">
                  Citations: {suggestion.articleIds.join(', ')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reply Composer */}
      <Card>
        <CardHeader>
          <CardTitle>Reply</CardTitle>
          <CardDescription>Send a response to the user</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write your reply here..."
              rows={6}
            />
            <div className="flex justify-end">
              <Button onClick={handleReply} disabled={isReplying || !reply.trim()}>
                {isReplying ? 'Sending...' : (<><Send className="mr-2 h-4 w-4" />Send Reply</>)}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Timeline</CardTitle>
          <CardDescription>Events for trace {ticket.traceId}</CardDescription>
        </CardHeader>
        <CardContent>
          {audit.length === 0 ? (
            <div className="text-sm text-muted-foreground">No audit events yet.</div>
          ) : (
            <div className="space-y-3">
              {audit.map((e) => (
                <div key={e._id} className="flex items-start space-x-3">
                  <div className="mt-1">
                    {e.actor === 'system' ? <Bot className="w-4 h-4 text-muted-foreground" /> : <User className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{e.action}</div>
                    <div className="text-xs text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</div>
                    {e.meta && (
                      <pre className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground bg-muted rounded p-2">
                        {JSON.stringify(e.meta, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
