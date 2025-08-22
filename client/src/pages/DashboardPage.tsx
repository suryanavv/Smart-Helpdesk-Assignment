import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { ticketsApi, showApiError } from '@/lib/api';
import type { Ticket } from '@/types';
import { 
  Ticket as TicketIcon, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await ticketsApi.getAll();
        setTickets(data);
      } catch (error) {
        showApiError(error, 'Failed to load tickets');
        console.error('Failed to fetch tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const getStatusCount = (status: string) => tickets.filter(t => t.status === status).length;
  const getCategoryCount = (category: string) => tickets.filter(t => t.category === category).length;
  const getStatusColor = (status: string) => ({
    open: 'bg-blue-100 text-blue-800',
    triaged: 'bg-yellow-100 text-yellow-800',
    waiting_human: 'bg-orange-100 text-orange-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  } as any)[status] || 'bg-gray-100 text-gray-800';
  const getCategoryColor = (cat: string) => ({
    billing: 'bg-purple-100 text-purple-800',
    tech: 'bg-blue-100 text-blue-800',
    shipping: 'bg-green-100 text-green-800',
    other: 'bg-gray-100 text-gray-800',
  } as any)[cat] || 'bg-gray-100 text-gray-800';

  const recentTickets = tickets.slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid grid-cols-12 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="col-span-12 sm:col-span-6 xl:col-span-3">
              <Card>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-16" />
                </CardHeader>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}! Here's what's happening.</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <a href="/tickets/new">
            <Plus className="mr-2 h-4 w-4" /> New Ticket
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <TicketIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.length}</div>
              <p className="text-xs text-muted-foreground">Across all categories</p>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatusCount('open')}</div>
              <p className="text-xs text-muted-foreground">Waiting for triage</p>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatusCount('resolved')}</div>
              <p className="text-xs text-muted-foreground">Successfully closed</p>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Human</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatusCount('waiting_human')}</div>
              <p className="text-xs text-muted-foreground">Agent review required</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Categories</CardTitle>
            <CardDescription>Distribution by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {['billing', 'tech', 'shipping', 'other'].map((category) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className={getCategoryColor(category)}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Badge>
                </div>
                <span className="text-sm font-medium">{getCategoryCount(category)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Overview</CardTitle>
            <CardDescription>Current ticket statuses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {['open', 'triaged', 'waiting_human', 'resolved', 'closed'].map((status) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className={getStatusColor(status)}>
                    {status.replace('_', ' ').replace(/(^|\s)\S/g, (t) => t.toUpperCase())}
                  </Badge>
                </div>
                <span className="text-sm font-medium">{getStatusCount(status)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
          <CardDescription>Latest ticket activity</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTickets.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No tickets yet.</div>
          ) : (
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <div key={ticket._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{ticket.title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className={getCategoryColor(ticket.category)}>
                        {ticket.category}
                      </Badge>
                      <Badge variant="secondary" className={getStatusColor(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-nowrap ml-3">
                    {new Date(ticket.createdAt).toLocaleDateString()}
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
