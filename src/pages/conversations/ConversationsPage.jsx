import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, MessageSquare, Eye } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../services/api';
import { Table, Badge, Pagination, PageHeader } from '../../components/ui/index.jsx';

const STATUSES = ['', 'active', 'awaiting_menu', 'completed', 'abandoned', 'escalated'];

export default function ConversationsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const params = { page, limit: 20 };
  if (search) params.search = search;
  if (status) params.status = status;

  const { data, isLoading } = useQuery({
    queryKey: ['conversations', params],
    queryFn: () => api.get('/conversations', { params }).then(r => r.data),
    keepPreviousData: true,
  });

  const sessions = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Conversations" subtitle={`${pagination?.total ?? 0} total conversations`} />

      <div className="card p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search number…" className="input pl-9" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input w-44">
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <Table
          headers={['WhatsApp Number', 'Service', 'Phase', 'Status', 'Step', 'Last Active', 'Action']}
          loading={isLoading}
          empty={sessions.length === 0 ? 'No conversations found' : null}
        >
          {sessions.map(s => (
            <tr key={s._id} className="hover:bg-gray-50">
              <td className="table-cell font-mono text-sm">{s.whatsappNumber}</td>
              <td className="table-cell text-sm">{s.currentService || <span className="text-gray-400">—</span>}</td>
              <td className="table-cell text-xs capitalize">{s.phase}</td>
              <td className="table-cell"><Badge label={s.status} variant={s.status} /></td>
              <td className="table-cell text-center">{s.currentQuestionIndex >= 0 ? s.currentQuestionIndex + 1 : '—'}</td>
              <td className="table-cell text-xs text-gray-500">{s.lastInteractionAt ? format(new Date(s.lastInteractionAt), 'dd MMM, HH:mm') : '—'}</td>
              <td className="table-cell">
                <Link to={`/conversations/${s._id}`} className="btn-ghost p-1.5 rounded" title="View"><Eye size={15} /></Link>
              </td>
            </tr>
          ))}
        </Table>
        <Pagination pagination={pagination} onPage={setPage} />
      </div>
    </div>
  );
}
