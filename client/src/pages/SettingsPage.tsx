import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { configApi, showApiError } from '@/lib/api';
import type { Config } from '@/types';
import { toast } from 'sonner';

export function SettingsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const c = await configApi.get();
        setConfig(c);
      } catch (e: any) {
        setError(e.message || 'Failed to load settings');
        showApiError(e, 'Failed to load settings');
      }
    };
    load();
  }, []);

  const onSave = async () => {
    if (!config) return;
    setSaving(true);
    const prev = { ...config };
    try {
      toast.loading('Saving settings...', { id: 'settings' });
      const updated = await configApi.update({
        autoCloseEnabled: config.autoCloseEnabled,
        confidenceThreshold: config.confidenceThreshold,
        slaHours: config.slaHours,
      });
      setConfig(updated);
      toast.success('Settings saved', { id: 'settings' });
    } catch (e: any) {
      setConfig(prev);
      toast.error('Failed to save settings', { id: 'settings' });
      showApiError(e);
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Loading configuration...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage system configuration</p>
      </div>

      {error && (
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Agent Auto Close</CardTitle>
          <CardDescription>Automatically resolve tickets when confidence is high.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="autoClose">Enable Auto Close</Label>
            <Switch id="autoClose" checked={config.autoCloseEnabled} onCheckedChange={(v) => setConfig({ ...config, autoCloseEnabled: v })} />
          </div>

          <div className="space-y-2">
            <Label>Confidence Threshold: {config.confidenceThreshold.toFixed(2)}</Label>
            <Slider
              value={[config.confidenceThreshold]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(v) => setConfig({ ...config, confidenceThreshold: v[0] })}
            />
          </div>

          <div className="space-y-2">
            <Label>SLA Hours: {config.slaHours}</Label>
            <Slider
              value={[config.slaHours]}
              min={1}
              max={168}
              step={1}
              onValueChange={(v) => setConfig({ ...config, slaHours: v[0] })}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
