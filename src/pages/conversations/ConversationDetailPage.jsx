import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../services/api';
import { Badge, LoadingSpinner } from '../../components/ui/index.jsx';

export default function ConversationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => api.get(`/conversations/${id}`).then(r => r.data.data),
  });

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!data) return <div className="p-6 text-center text-gray-500">Conversation not found</div>;

  const messages = data.messages || [];
  const answers = data.answers || {};

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-lg"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900 font-mono">{data.whatsappNumber}</h1>
            <Badge label={data.status} variant={data.status} />
          </div>
          <p className="text-xs text-gray-500">{data.currentService || 'Menu'} · Phase: {data.phase}</p>
        </div>
        {data.lead && (
          <Link to={`/leads/${data.lead._id || data.lead}`} className="btn-primary text-sm">
            <ArrowUpRight size={15} /> View Lead
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Chat messages */}
        <div className="md:col-span-2">
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Message Timeline</h2>
            {messages.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">No messages recorded</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.direction === 'outgoing'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{msg.content || '[interactive]'}</p>
                      <p className={`text-xs mt-1 ${msg.direction === 'outgoing' ? 'text-blue-200' : 'text-gray-400'}`}>
                        {msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm') : ''}
                        {msg.direction === 'outgoing' && msg.status ? ` · ${msg.status}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Session meta */}
        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Session Info</h2>
            <div className="space-y-2 text-sm">
              {[
                ['Status', <Badge label={data.status} variant={data.status} />],
                ['Phase', data.phase],
                ['Service', data.currentService || '—'],
                ['Step', data.currentQuestionIndex >= 0 ? `Q${data.currentQuestionIndex + 1}` : '—'],
                ['Last Active', data.lastInteractionAt ? format(new Date(data.lastInteractionAt), 'dd MMM, HH:mm') : '—'],
                ['Created', data.createdAt ? format(new Date(data.createdAt), 'dd MMM yyyy') : '—'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between gap-2">
                  <span className="text-gray-500">{l}</span>
                  <span className="font-medium text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Collected answers */}
          {Object.keys(answers).length > 0 && (
            <div className="card p-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Collected Data</h2>
              <div className="space-y-1.5">
                {Object.entries(answers).map(([key, ans]) => (
                  <div key={key} className="text-xs">
                    <span className="text-gray-500 capitalize">{ans?.label || key}: </span>
                    <span className="font-medium text-gray-800">
                      {Array.isArray(ans?.value) ? ans.value.join(', ') : (ans?.displayValue || ans?.value || '—')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
