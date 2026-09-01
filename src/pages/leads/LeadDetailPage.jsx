import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageSquare, Send, Edit2, Check, X, User, Building, Phone, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../services/api';
import { Badge, LoadingSpinner, Modal } from '../../components/ui/index.jsx';
import toast from 'react-hot-toast';

const STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost', 'Abandoned'];

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={14} className="text-gray-500" />
      </div>
      <div>
        <div className="text-xs text-gray-500 font-medium">{label}</div>
        <div className="text-sm text-gray-800 font-medium mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const [editStatus, setEditStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [showAssign, setShowAssign] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => api.get(`/leads/${id}`).then(r => r.data.data),
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => api.get('/teams').then(r => r.data.data),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data.data),
  });

  const invalidate = () => qc.invalidateQueries(['lead', id]);

  const updateStatus = useMutation({
    mutationFn: (status) => api.patch(`/leads/${id}/status`, { status }),
    onSuccess: () => { toast.success('Status updated'); setEditStatus(false); invalidate(); },
    onError: () => toast.error('Failed to update status'),
  });

  const addNote = useMutation({
    mutationFn: () => api.post(`/leads/${id}/notes`, { content: note }),
    onSuccess: () => { toast.success('Note added'); setNote(''); invalidate(); },
    onError: () => toast.error('Failed to add note'),
  });

  const assignLead = useMutation({
    mutationFn: (data) => api.patch(`/leads/${id}/assign`, data),
    onSuccess: () => { toast.success('Lead assigned'); setShowAssign(false); invalidate(); },
    onError: () => toast.error('Failed to assign lead'),
  });

  const lead = data;
  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!lead) return <div className="p-6 text-center text-gray-500">Lead not found</div>;

  const answers = lead.answers || [];

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-lg"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{lead.name || 'Unknown Lead'}</h1>
            {editStatus ? (
              <div className="flex items-center gap-2">
                <select value={newStatus || lead.status} onChange={e => setNewStatus(e.target.value)} className="input w-36 py-1 text-xs">
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                <button onClick={() => updateStatus.mutate(newStatus || lead.status)} className="btn-primary p-1.5"><Check size={14} /></button>
                <button onClick={() => setEditStatus(false)} className="btn-secondary p-1.5"><X size={14} /></button>
              </div>
            ) : (
              <button onClick={() => { setEditStatus(true); setNewStatus(lead.status); }} className="flex items-center gap-1.5 group">
                <Badge label={lead.status} variant={lead.status} />
                <Edit2 size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1 font-mono">{lead.leadId}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAssign(true)} className="btn-secondary">Assign</button>
          {lead.conversationId && (
            <Link to={`/conversations/${lead.conversationId._id || lead.conversationId}`} className="btn-primary">
              <MessageSquare size={15} /> View Chat
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Lead info */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Contact Information</h2>
            <InfoRow icon={User} label="Name" value={lead.name} />
            <InfoRow icon={Phone} label="Mobile" value={lead.mobile} />
            <InfoRow icon={Building} label="Business Name" value={lead.businessName} />
            <InfoRow icon={MapPin} label="City" value={lead.city} />
            <InfoRow icon={MapPin} label="State" value={lead.state} />
            <InfoRow icon={MessageSquare} label="Service" value={lead.service} />
            <InfoRow icon={Calendar} label="Submitted" value={lead.submittedAt ? format(new Date(lead.submittedAt), 'dd MMM yyyy, HH:mm') : null} />
          </div>

          {/* Answers */}
          {answers.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">All Collected Answers</h2>
              <div className="space-y-2">
                {answers.map((ans, i) => (
                  <div key={i} className="flex gap-3 text-sm py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-500 font-medium w-44 flex-shrink-0">{ans.questionLabel || ans.questionKey}:</span>
                    <span className="text-gray-800">
                      {Array.isArray(ans.value) ? ans.value.join(', ') : (ans.displayValue || ans.value || <span className="text-gray-400">—</span>)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Internal Notes</h2>
            <div className="space-y-3 mb-4">
              {(lead.notes || []).length === 0 && <p className="text-sm text-gray-400">No notes yet</p>}
              {(lead.notes || []).map((n, i) => (
                <div key={i} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-gray-800">{n.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{n.authorName} · {n.createdAt ? format(new Date(n.createdAt), 'dd MMM, HH:mm') : ''}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add a note…"
                className="input flex-1"
                onKeyDown={e => e.key === 'Enter' && note.trim() && addNote.mutate()}
              />
              <button onClick={() => addNote.mutate()} disabled={!note.trim() || addNote.isPending} className="btn-primary px-3">
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Assignment card */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Assignment</h2>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 font-medium mb-1">Assigned Team</div>
                <div className="text-sm font-medium text-gray-800">{lead.assignedTeam?.name || <span className="text-gray-400">Unassigned</span>}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium mb-1">Assigned To</div>
                <div className="text-sm font-medium text-gray-800">{lead.assignedUser?.name || <span className="text-gray-400">Unassigned</span>}</div>
              </div>
              <button onClick={() => setShowAssign(true)} className="btn-secondary w-full text-xs">Change Assignment</button>
            </div>
          </div>

          {/* Meta */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Meta</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Source</span><span className="font-medium">{lead.source}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Complete</span><span className={`font-medium ${lead.isComplete ? 'text-green-600' : 'text-yellow-600'}`}>{lead.isComplete ? 'Yes' : 'No'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Abandoned</span><span className={`font-medium ${lead.isAbandoned ? 'text-red-600' : 'text-gray-600'}`}>{lead.isAbandoned ? 'Yes' : 'No'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Created</span><span className="font-medium text-xs">{lead.createdAt ? format(new Date(lead.createdAt), 'dd MMM yyyy') : '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Updated</span><span className="font-medium text-xs">{lead.updatedAt ? format(new Date(lead.updatedAt), 'dd MMM yyyy') : '—'}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      <AssignModal
        open={showAssign}
        onClose={() => setShowAssign(false)}
        lead={lead}
        teams={teams || []}
        users={users || []}
        onAssign={(d) => assignLead.mutate(d)}
        loading={assignLead.isPending}
      />
    </div>
  );
}

function AssignModal({ open, onClose, lead, teams, users, onAssign, loading }) {
  const [team, setTeam] = useState(lead?.assignedTeam?._id || '');
  const [user, setUser] = useState(lead?.assignedUser?._id || '');
  return (
    <Modal open={open} onClose={onClose} title="Assign Lead"
      footer={<>
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={() => onAssign({ assignedTeam: team || null, assignedUser: user || null })} disabled={loading} className="btn-primary">
          {loading ? 'Saving…' : 'Save Assignment'}
        </button>
      </>}
    >
      <div className="space-y-4">
        <div>
          <label className="label">Team</label>
          <select value={team} onChange={e => setTeam(e.target.value)} className="input">
            <option value="">Unassigned</option>
            {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">User</label>
          <select value={user} onChange={e => setUser(e.target.value)} className="input">
            <option value="">Unassigned</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
}
