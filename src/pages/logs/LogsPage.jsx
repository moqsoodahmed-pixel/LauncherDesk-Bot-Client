import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '../../services/api';
import { PageHeader, Table, Pagination, Badge } from '../../components/ui/index.jsx';

export default function LogsPage() {
  const [tab, setTab] = useState('messages');
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState('');
  const [status, setStatus] = useState('');

  const messagesQ = useQuery({
    queryKey: ['logs-messages', page, direction, status],
    queryFn: () => api.get('/logs/messages', { params: { page, limit: 30, direction, status } }).then(r => r.data),
    enabled: tab === 'messages',
    keepPreviousData: true,
  });

  const webhooksQ = useQuery({
    queryKey: ['logs-webhooks', page, status],
    queryFn: () => api.get('/logs/webhooks', { params: { page, limit: 30, status } }).then(r => r.data),
    enabled: tab === 'webhooks',
    keepPreviousData: true,
  });

  const active = tab === 'messages' ? messagesQ : webhooksQ;
  const logs = active.data?.data || [];
  const pagination = active.data?.pagination;

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Logs" subtitle="Message and webhook event logs" />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {['messages', 'webhooks'].map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex gap-3">
        {tab === 'messages' && (
          <select value={direction} onChange={e => { setDirection(e.target.value); setPage(1); }} className="input w-36">
            <option value="">All directions</option>
            <option value="incoming">Incoming</option>
            <option value="outgoing">Outgoing</option>
          </select>
        )}
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input w-36">
          <option value="">All statuses</option>
          {tab === 'messages'
            ? ['sent', 'delivered', 'read', 'failed', 'received'].map(s => <option key={s}>{s}</option>)
            : ['pending', 'processed', 'failed', 'duplicate'].map(s => <option key={s}>{s}</option>)
          }
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {tab === 'messages' ? (
          <Table headers={['Direction', 'Number', 'Type', 'Content', 'Status', 'Time']} loading={messagesQ.isLoading} empty={logs.length === 0 ? 'No logs found' : null}>
            {logs.map(l => (
              <tr key={l._id} className="hover:bg-gray-50">
                <td className="table-cell"><span className={`badge ${l.direction === 'incoming' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{l.direction}</span></td>
                <td className="table-cell font-mono text-xs">{l.whatsappNumber}</td>
                <td className="table-cell text-xs">{l.messageType || 'text'}</td>
                <td className="table-cell text-xs text-gray-600 max-w-xs truncate">{l.content}</td>
                <td className="table-cell"><Badge label={l.status} variant={l.status === 'failed' ? 'Lost' : l.status === 'sent' ? 'New' : 'Contacted'} /></td>
                <td className="table-cell text-xs text-gray-400">{l.createdAt ? format(new Date(l.createdAt), 'dd MMM HH:mm:ss') : '—'}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <Table headers={['Event ID', 'Number', 'Type', 'Status', 'Time (ms)', 'Created']} loading={webhooksQ.isLoading} empty={logs.length === 0 ? 'No webhook events' : null}>
            {logs.map(l => (
              <tr key={l._id} className="hover:bg-gray-50">
                <td className="table-cell font-mono text-xs truncate max-w-[140px]">{l.eventId}</td>
                <td className="table-cell font-mono text-xs">{l.whatsappNumber}</td>
                <td className="table-cell text-xs">{l.eventType}</td>
                <td className="table-cell"><Badge label={l.status} variant={l.status === 'processed' ? 'Won' : l.status === 'failed' ? 'Lost' : l.status === 'duplicate' ? 'Abandoned' : 'New'} /></td>
                <td className="table-cell text-xs">{l.processingTimeMs ?? '—'}</td>
                <td className="table-cell text-xs text-gray-400">{l.createdAt ? format(new Date(l.createdAt), 'dd MMM HH:mm:ss') : '—'}</td>
              </tr>
            ))}
          </Table>
        )}
        <Pagination pagination={pagination} onPage={setPage} />
      </div>
    </div>
  );
}
