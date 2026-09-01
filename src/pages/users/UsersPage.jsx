import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, UserX } from 'lucide-react';
import api from '../../services/api';
import { PageHeader, LoadingSpinner, Modal, Badge } from '../../components/ui/index.jsx';
import toast from 'react-hot-toast';

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AGENT'];

function UserModal({ open, onClose, user, teams, onSave, loading }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'AGENT', team: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => {
    if (user) setForm({ name: user.name, email: user.email, password: '', role: user.role, team: user.team?._id || '' });
    else setForm({ name: '', email: '', password: '', role: 'AGENT', team: '' });
  }, [user]);

  return (
    <Modal open={open} onClose={onClose} title={user ? 'Edit User' : 'Create Admin User'}
      footer={<>
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={() => onSave(form)} disabled={loading} className="btn-primary">{loading ? 'Saving…' : 'Save'}</button>
      </>}
    >
      <div className="space-y-4">
        <div><label className="label">Name</label><input value={form.name} onChange={e => set('name', e.target.value)} className="input" /></div>
        <div><label className="label">Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input" /></div>
        {!user && <div><label className="label">Password</label><input type="password" value={form.password} onChange={e => set('password', e.target.value)} className="input" placeholder="Min 8 characters" /></div>}
        <div>
          <label className="label">Role</label>
          <select value={form.role} onChange={e => set('role', e.target.value)} className="input">
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Team</label>
          <select value={form.team} onChange={e => set('team', e.target.value)} className="input">
            <option value="">No team</option>
            {(teams || []).map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState({ open: false, user: null });

  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: () => api.get('/users').then(r => r.data.data) });
  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: () => api.get('/teams').then(r => r.data.data) });

  const save = useMutation({
    mutationFn: (form) => {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (!payload.team) delete payload.team;
      return modal.user ? api.patch(`/users/${modal.user._id}`, payload) : api.post('/users', payload);
    },
    onSuccess: () => { toast.success('User saved!'); qc.invalidateQueries(['users']); setModal({ open: false, user: null }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save user'),
  });

  const deactivate = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => { toast.success('User deactivated'); qc.invalidateQueries(['users']); },
    onError: () => toast.error('Failed to deactivate'),
  });

  const users = data || [];
  const roleBadge = (role) => {
    const map = { SUPER_ADMIN: 'Won', ADMIN: 'Qualified', MANAGER: 'Contacted', AGENT: 'New' };
    return map[role] || 'New';
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Admin Users" subtitle="Manage dashboard access"
        actions={<button onClick={() => setModal({ open: true, user: null })} className="btn-primary"><Plus size={16} /> New User</button>}
      />
      {isLoading ? <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div> : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name', 'Email', 'Role', 'Team', 'Last Login', 'Actions'].map(h => <th key={h} className="table-header">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">{u.name?.charAt(0).toUpperCase()}</div>
                      {u.name}
                    </div>
                  </td>
                  <td className="table-cell text-gray-500">{u.email}</td>
                  <td className="table-cell"><Badge label={u.role} variant={roleBadge(u.role)} /></td>
                  <td className="table-cell text-sm">{u.team?.name || <span className="text-gray-400">—</span>}</td>
                  <td className="table-cell text-xs text-gray-400">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button onClick={() => setModal({ open: true, user: u })} className="btn-ghost p-1.5"><Edit2 size={14} /></button>
                      <button onClick={() => { if (window.confirm('Deactivate user?')) deactivate.mutate(u._id); }} className="btn-ghost p-1.5 text-red-500"><UserX size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <UserModal open={modal.open} onClose={() => setModal({ open: false, user: null })} user={modal.user} teams={teams} onSave={f => save.mutate(f)} loading={save.isPending} />
    </div>
  );
}
