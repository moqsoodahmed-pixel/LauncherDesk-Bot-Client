import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Download, Filter, Eye } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../services/api';
import { Table, Badge, Pagination, FilterBar, PageHeader, EmptyState } from '../../components/ui/index.jsx';
import toast from 'react-hot-toast';

const STATUSES = ['', 'New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost', 'Abandoned'];
const SERVICES = [
  '', 'business-registration', 'licenses-certifications', 'ipr-trademark',
  'it-services', 'marketplace-software', 'finance-accounts', 'legal-compliance',
  'international-expansion', 'office-setup', 'office-space', 'virtual-office',
  'e-stamp', 'talk-to-expert',
];
const SERVICE_LABELS = {
  '': 'All Services',
  'business-registration': 'Business Registration',
  'licenses-certifications': 'Licenses & Certifications',
  'ipr-trademark': 'IPR & Trademark',
  'it-services': 'IT Services',
  'marketplace-software': 'Marketplace Software',
  'finance-accounts': 'Finance & Accounts',
  'legal-compliance': 'Legal & Compliance',
  'international-expansion': 'International Expansion',
  'office-setup': 'Office Setup',
  'office-space': 'Office Space',
  'virtual-office': 'Virtual Office',
  'e-stamp': 'E-Stamp',
  'talk-to-expert': 'Talk to an Expert',
};

export default function LeadsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [service, setService] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [exporting, setExporting] = useState(false);

  const params = { page, limit: 20, sortBy, order };
  if (search) params.search = search;
  if (status) params.status = status;
  if (service) params.service = service;

  const { data, isLoading } = useQuery({
    queryKey: ['leads', params],
    queryFn: () => api.get('/leads', { params }).then(r => r.data),
    keepPreviousData: true,
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/leads/export', { params: { status, service, search }, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = 'launcherdesk-leads.csv'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Leads exported!');
    } catch { toast.error('Export failed'); } finally { setExporting(false); }
  };

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
  const handleStatus = (e) => { setStatus(e.target.value); setPage(1); };
  const handleService = (e) => { setService(e.target.value); setPage(1); };

  const leads = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Leads"
        subtitle={`${pagination?.total ?? 0} total leads`}
        actions={
          <button onClick={handleExport} disabled={exporting} className="btn-secondary gap-2">
            <Download size={16} />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        }
      />

      {/* Filters */}
      <div className="card p-4">
        <FilterBar>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={handleSearch} placeholder="Search name, mobile, service…" className="input pl-9" />
          </div>
          <select value={status} onChange={handleStatus} className="input w-40">
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
          <select value={service} onChange={handleService} className="input w-52">
            {SERVICES.map(s => <option key={s} value={s}>{SERVICE_LABELS[s]}</option>)}
          </select>
          <select value={`${sortBy}:${order}`} onChange={e => { const [f, o] = e.target.value.split(':'); setSortBy(f); setOrder(o); }} className="input w-44">
            <option value="createdAt:desc">Newest First</option>
            <option value="createdAt:asc">Oldest First</option>
            <option value="name:asc">Name A–Z</option>
            <option value="status:asc">Status</option>
          </select>
        </FilterBar>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <Table
          headers={['Lead ID', 'Name', 'Mobile', 'Service', 'Team', 'Status', 'Date', 'Action']}
          loading={isLoading}
          empty={leads.length === 0 ? 'No leads found' : null}
        >
          {leads.map(lead => (
            <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
              <td className="table-cell font-mono text-xs text-gray-500">{lead.leadId?.slice(-10)}</td>
              <td className="table-cell font-medium">{lead.name || <span className="text-gray-400">—</span>}</td>
              <td className="table-cell text-gray-500">{lead.mobile || '—'}</td>
              <td className="table-cell max-w-[160px] truncate text-xs">{lead.service}</td>
              <td className="table-cell">
                {lead.assignedTeam ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{lead.assignedTeam.name?.replace(' Team', '')}</span>
                ) : <span className="text-gray-400 text-xs">Unassigned</span>}
              </td>
              <td className="table-cell"><Badge label={lead.status} variant={lead.status} /></td>
              <td className="table-cell text-gray-500 text-xs">{lead.createdAt ? format(new Date(lead.createdAt), 'dd MMM, HH:mm') : '—'}</td>
              <td className="table-cell">
                <Link to={`/leads/${lead._id}`} className="btn-ghost p-1.5 rounded" title="View Lead">
                  <Eye size={15} />
                </Link>
              </td>
            </tr>
          ))}
        </Table>
        <Pagination pagination={pagination} onPage={setPage} />
      </div>
    </div>
  );
}
