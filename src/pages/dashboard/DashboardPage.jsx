import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Users, MessageSquare, TrendingUp, CheckCircle, XCircle, Clock, Award, PhoneCall } from 'lucide-react';
import api from '../../services/api';
import { StatCard, Badge, LoadingSpinner } from '../../components/ui/index.jsx';
import { format } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#d97706', '#7c3aed'];

function useDashboard() {
  const stats = useQuery({ queryKey: ['dash-stats'], queryFn: () => api.get('/dashboard/stats').then(r => r.data.data), refetchInterval: 30000 });
  const byService = useQuery({ queryKey: ['dash-service'], queryFn: () => api.get('/dashboard/leads-by-service').then(r => r.data.data) });
  const byDate = useQuery({ queryKey: ['dash-date'], queryFn: () => api.get('/dashboard/leads-by-date?days=30').then(r => r.data.data) });
  const byTeam = useQuery({ queryKey: ['dash-team'], queryFn: () => api.get('/dashboard/leads-by-team').then(r => r.data.data) });
  const recentLeads = useQuery({ queryKey: ['dash-recent-leads'], queryFn: () => api.get('/dashboard/recent-leads').then(r => r.data.data) });
  const recentConvs = useQuery({ queryKey: ['dash-recent-convs'], queryFn: () => api.get('/dashboard/recent-conversations').then(r => r.data.data) });
  return { stats, byService, byDate, byTeam, recentLeads, recentConvs };
}

export default function DashboardPage() {
  const { stats, byService, byDate, byTeam, recentLeads, recentConvs } = useDashboard();
  const s = stats.data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">LauncherDesk WhatsApp Lead Overview</p>
      </div>

      {/* Stat cards */}
      {stats.isLoading ? (
        <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Leads" value={s?.totalLeads} icon={Users} color="blue" />
          <StatCard label="Today's Leads" value={s?.todayLeads} icon={TrendingUp} color="green" />
          <StatCard label="New" value={s?.newLeads} icon={Clock} color="yellow" />
          <StatCard label="Qualified" value={s?.qualifiedLeads} icon={CheckCircle} color="purple" />
          <StatCard label="Won" value={s?.wonLeads} icon={Award} color="teal" />
          <StatCard label="Lost" value={s?.lostLeads} icon={XCircle} color="red" />
          <StatCard label="Abandoned" value={s?.abandonedLeads} icon={XCircle} color="orange" />
          <StatCard label="Active Chats" value={s?.activeConversations} icon={MessageSquare} color="indigo" />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads over time */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Leads (Last 30 Days)</h2>
          {byDate.isLoading ? <div className="h-48 flex items-center justify-center"><LoadingSpinner /></div> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={byDate.data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tickFormatter={d => d?.slice(5)} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Leads']} labelFormatter={l => `Date: ${l}`} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Leads by service */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Leads by Service</h2>
          {byService.isLoading ? <div className="h-48 flex items-center justify-center"><LoadingSpinner /></div> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(byService.data || []).slice(0, 8)} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="service" type="category" width={120} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent leads & conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Recent Leads</h2>
            <Link to="/leads" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentLeads.isLoading ? (
              <div className="py-8 flex justify-center"><LoadingSpinner /></div>
            ) : (recentLeads.data || []).length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">No leads yet</p>
            ) : (recentLeads.data || []).map(lead => (
              <Link key={lead._id} to={`/leads/${lead._id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                  {(lead.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800 truncate">{lead.name || 'Unknown'}</span>
                    <Badge label={lead.status} variant={lead.status} />
                  </div>
                  <div className="text-xs text-gray-500 truncate">{lead.service}</div>
                </div>
                <div className="text-xs text-gray-400">{lead.createdAt ? format(new Date(lead.createdAt), 'dd MMM') : ''}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Recent Conversations</h2>
            <Link to="/conversations" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentConvs.isLoading ? (
              <div className="py-8 flex justify-center"><LoadingSpinner /></div>
            ) : (recentConvs.data || []).length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">No conversations yet</p>
            ) : (recentConvs.data || []).map(conv => (
              <Link key={conv._id} to={`/conversations/${conv._id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 flex-shrink-0">
                  <PhoneCall size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800 truncate">{conv.whatsappNumber}</span>
                    <Badge label={conv.status} variant={conv.status} />
                  </div>
                  <div className="text-xs text-gray-500 truncate">{conv.currentService || 'Menu'}</div>
                </div>
                <div className="text-xs text-gray-400">{conv.lastInteractionAt ? format(new Date(conv.lastInteractionAt), 'HH:mm') : ''}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
