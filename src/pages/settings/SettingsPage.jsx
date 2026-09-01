import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import api from '../../services/api';
import { PageHeader, LoadingSpinner } from '../../components/ui/index.jsx';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({});
  const [initialized, setInitialized] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data.data),
    onSuccess: (data) => { if (!initialized) { setForm(data || {}); setInitialized(true); } },
  });

  const save = useMutation({
    mutationFn: () => api.patch('/settings', form),
    onSuccess: () => { toast.success('Settings saved!'); qc.invalidateQueries(['settings']); },
    onError: () => toast.error('Failed to save settings'),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <PageHeader title="Settings" subtitle="Configure the WhatsApp bot and application settings" />

      <div className="card p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-800 border-b pb-2">Bot Messages</h2>

        <div>
          <label className="label">App Name</label>
          <input value={form.app_name || ''} onChange={e => set('app_name', e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Welcome Message</label>
          <textarea value={form.whatsapp_welcome_message || ''} onChange={e => set('whatsapp_welcome_message', e.target.value)} className="input h-24 resize-none" />
        </div>
        <div>
          <label className="label">Success Message</label>
          <textarea value={form.success_message || ''} onChange={e => set('success_message', e.target.value)} className="input h-24 resize-none" />
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-800 border-b pb-2">Session Timing</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Inactivity Reminder (minutes)</label>
            <input type="number" value={form.inactivity_reminder_minutes || 10} onChange={e => set('inactivity_reminder_minutes', parseInt(e.target.value))} className="input" min={1} max={60} />
          </div>
          <div>
            <label className="label">Session Abandon (hours)</label>
            <input type="number" value={form.session_abandon_hours || 24} onChange={e => set('session_abandon_hours', parseInt(e.target.value))} className="input" min={1} max={168} />
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-800 border-b pb-2">Business Hours</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start Time</label>
            <input type="time" value={form.business_hours_start || '09:00'} onChange={e => set('business_hours_start', e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">End Time</label>
            <input type="time" value={form.business_hours_end || '19:00'} onChange={e => set('business_hours_end', e.target.value)} className="input" />
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800 border-b pb-2">MSG91 Configuration Status</h2>
        <p className="text-sm text-gray-500">MSG91 credentials are configured through environment variables on the server. See <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">.env.example</code> for the required variables.</p>
        <div className="space-y-2">
          {['MSG91_AUTH_KEY', 'MSG91_WHATSAPP_NUMBER', 'MSG91_INTEGRATION_ID', 'MSG91_WEBHOOK_SECRET'].map(key => (
            <div key={key} className="flex items-center gap-3 text-sm">
              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">{key}</span>
              <span className="text-gray-400 text-xs">— configured in server .env</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary px-6">
          <Save size={16} /> {save.isPending ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
