import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { kbApi, showApiError } from '@/lib/api';
import type { Article } from '@/types';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function KBListPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        const data = await kbApi.search(query);
        setArticles(data);
      } catch (e) {
        showApiError(e, 'Failed to load articles');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground">Search and manage help articles</p>
        </div>
        {user?.role === 'admin' && (
          <Button onClick={() => navigate('/kb/new')} aria-label="Create new article" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> New Article
          </Button>
        )}
      </div>

      <div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" aria-hidden />
          <Input
            placeholder="Search articles..."
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search articles"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} aria-busy>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((a) => (
            <Card key={a._id} className="hover:shadow-sm transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-1 text-base">{a.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Badge variant="secondary" className={a.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {a.status}
                  </Badge>
                  <span className="text-xs">Updated {new Date(a.updatedAt).toLocaleDateString()}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">{a.body}</p>
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/kb/${a._id}`)} aria-label={`View ${a.title}`}>View</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
