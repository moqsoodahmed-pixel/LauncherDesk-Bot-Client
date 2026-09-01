import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import api from '../../services/api';
import { PageHeader, LoadingSpinner, Modal, EmptyState } from '../../components/ui/index.jsx';
import toast from 'react-hot-toast';

function TeamModal({ open, onClose, team, onSave, loading }) {
  const [form, setForm] = useState(team || { name: '', slug: '', description: '', email: '', color: '#3B82F6' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => setForm(team || { name: '', slug: '', description: '', email: '', color: '#3B82F6' }), [team]);
  return (
    <Modal open={open} onClose={onClose} title={team ? 'Edit Team' : 'Create Team'}
      footer={<>
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={() => onSave(form)} disabled={loading} className="btn-primary">{loading ? 'Saving…' : 'Save'}</button>
      </>}
    >
      <div className="space-y-4">
        <div>
          <label className="label">Team Name</label>
          <input value={form.name} onChange={e => { set('name', e.target.value); if (!team) set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '')); }} className="input" />
        </div>
        <div>
          <label className="label">Slug</label>
          <input value={form.slug} onChange={e => set('slug', e.target.value)} className="input font-mono text-sm" />
        </div>
        <div>
          <label className="label">Description</label>
          <input value={form.description || ''} onChange={e => set('description', e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Color</label>
          <input type="color" value={form.color || '#3B82F6'} onChange={e => set('color', e.target.value)} className="h-9 w-16 rounded border border-gray-300 cursor-pointer" />
        </div>
      </div>
    </Modal>
  );
}

import { useEffect } from 'react';
export default function TeamsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState({ open: false, team: null });

  const { data, isLoading } = useQuery({ queryKey: ['teams'], queryFn: () => api.get('/teams').then(r => r.data.data) });

  const save = useMutation({
    mutationFn: (form) => modal.team ? api.patch(`/teams/${modal.team._id}`, form) : api.post('/teams', form),
    onSuccess: () => { toast.success('Team saved!'); qc.invalidateQueries(['teams']); setModal({ open: false, team: null }); },
    onError: () => toast.error('Failed to save team'),
  });

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/teams/${id}`),
    onSuccess: () => { toast.success('Team removed'); qc.invalidateQueries(['teams']); },
    onError: () => toast.error('Failed to remove team'),
  });

  const teams = data || [];

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Teams" subtitle="Manage routing teams for lead assignment"
        actions={<button onClick={() => setModal({ open: true, team: null })} className="btn-primary"><Plus size={16} /> New Team</button>}
      />
      {isLoading ? <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div> : teams.length === 0 ? (
        <EmptyState icon={Users} title="No teams yet" description="Create your first routing team" action={<button onClick={() => setModal({ open: true, team: null })} className="btn-primary">Create Team</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(t => (
            <div key={t._id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${t.color}20` }}>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{t.description || t.slug}</div>
                  {t.email && <div className="text-xs text-gray-400 mt-0.5">{t.email}</div>}
                  <div className="text-xs text-gray-400 mt-1">{(t.members || []).length} members</div>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <button onClick={() => setModal({ open: true, team: t })} className="btn-ghost text-xs flex-1 gap-1"><Edit2 size={12} /> Edit</button>
                <button onClick={() => { if (window.confirm(`Remove ${t.name}?`)) remove.mutate(t._id); }} className="btn-ghost text-xs text-red-500 hover:bg-red-50 flex-1 gap-1"><Trash2 size={12} /> Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <TeamModal open={modal.open} onClose={() => setModal({ open: false, team: null })} team={modal.team} onSave={(f) => save.mutate(f)} loading={save.isPending} />
    </div>
  );
}
