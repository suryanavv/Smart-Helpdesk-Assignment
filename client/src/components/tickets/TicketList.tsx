import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ticketsApi, showApiError } from '@/lib/api';
import type { Ticket } from '@/types';
import { Plus, Search, Filter, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TicketList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await ticketsApi.getAll();
        setTickets(data);
        setFilteredTickets(data);
      } catch (error) {
        showApiError(error, 'Failed to load tickets');
        console.error('Failed to fetch tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  useEffect(() => {
    let filtered = tickets;
    if (searchQuery) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (statusFilter !== 'all') filtered = filtered.filter(t => t.status === statusFilter);
    if (categoryFilter !== 'all') filtered = filtered.filter(t => t.category === categoryFilter);
    setFilteredTickets(filtered);
  }, [tickets, searchQuery, statusFilter, categoryFilter]);

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

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground">Manage and track all support tickets</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <a href="/tickets/new">
            <Plus className="mr-2 h-4 w-4" /> New Ticket
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </CardTitle>
          <CardDescription>Refine results by search, status, and category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search tickets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="triaged">Triaged</SelectItem>
                  <SelectItem value="waiting_human">Waiting for Human</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="tech">Technical</SelectItem>
                  <SelectItem value="shipping">Shipping</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile: cards */}
      <div className="space-y-3 md:hidden">
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">No tickets found</CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{ticket.title}</div>
                    <div className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className={getCategoryColor(ticket.category)}>{ticket.category}</Badge>
                      <Badge variant="secondary" className={getStatusColor(ticket.status)}>{ticket.status.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(ticket.createdAt)}</div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/tickets/${ticket._id}`)}><Eye className="w-4 h-4 mr-2" />View</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop: table */}
      {filteredTickets.length > 0 && (
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getCategoryColor(ticket.category)}>{ticket.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusColor(ticket.status)}>{ticket.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(ticket.createdAt)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(ticket.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/tickets/${ticket._id}`)}><Eye className="w-4 h-4 mr-2" />View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
