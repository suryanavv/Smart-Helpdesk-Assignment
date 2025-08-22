import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { kbApi } from '@/lib/api';

const schema = z.object({
  title: z.string().min(5, 'Title too short'),
  body: z.string().min(20, 'Body too short'),
  tags: z.string().optional(),
  status: z.enum(['draft', 'published']),
});

type FormData = z.infer<typeof schema>;

export function KBEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [_loading, setLoading] = useState(!!id);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'draft' },
  });

  useEffect(() => {
    if (!id) return;
    const run = async () => {
      try {
        const a = await kbApi.getById(id);
        setValue('title', a.title);
        setValue('body', a.body);
        setValue('tags', a.tags?.join(', ') || '');
        setValue('status', a.status);
      } catch (e: any) {
        setError(e.message || 'Failed to load article');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const tags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      if (id) {
        await kbApi.update(id, { title: data.title, body: data.body, tags, status: data.status });
      } else {
        const created = await kbApi.create({ title: data.title, body: data.body, tags, status: data.status });
        navigate(`/kb/${created._id}`);
        return;
      }
      navigate('/kb');
    } catch (e: any) {
      setError(e.message || 'Failed to save article');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{id ? 'Edit Article' : 'New Article'}</h1>
        <p className="text-muted-foreground">{id ? 'Update the article content' : 'Create a knowledge base article'}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Article</CardTitle>
          <CardDescription>Provide title, content, tags and status</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} className={errors.title ? 'border-red-500' : ''} />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Body</Label>
              <Textarea id="body" rows={12} {...register('body')} className={errors.body ? 'border-red-500' : ''} />
              {errors.body && <p className="text-sm text-red-500">{errors.body.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" placeholder="billing, payments" {...register('tags')} />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select defaultValue="draft" onValueChange={(v) => setValue('status', v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate('/kb')}>Cancel</Button>
              <Button type="submit">{id ? 'Save Changes' : 'Create Article'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
