import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Eye, ToggleLeft, ToggleRight, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../../services/api';
import { PageHeader, LoadingSpinner, Badge } from '../../components/ui/index.jsx';
import toast from 'react-hot-toast';

export default function ServicesPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then(r => r.data.data),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/services/${id}`, { isActive }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries(['services']); },
    onError: () => toast.error('Failed to update'),
  });

  const reorder = useMutation({
    mutationFn: ({ id, order }) => api.patch(`/services/${id}/reorder`, { order }),
    onSuccess: () => qc.invalidateQueries(['services']),
  });

  const services = data || [];

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Services & Flows" subtitle="Manage WhatsApp bot service categories and conversation flows" />

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="space-y-3">
          {services.map((svc, idx) => {
            const flow = svc.flows?.find(f => f.isActive) || svc.flows?.[svc.flows.length - 1];
            return (
              <div key={svc._id} className={`card p-4 transition-all ${!svc.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {svc.icon || '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{svc.name}</span>
                      <span className="text-xs text-gray-400 font-mono">/{svc.slug}</span>
                      {!svc.isActive && <Badge label="Inactive" variant="Abandoned" />}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>Questions: <strong>{flow?.totalSteps || 0}</strong></span>
                      <span>Flow v<strong>{svc.currentFlowVersion || 1}</strong></span>
                      <span>Team: <strong>{svc.routingTeam?.name || 'None'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => reorder.mutate({ id: svc._id, order: (svc.order || 0) - 1 })}
                      disabled={idx === 0}
                      className="btn-ghost p-1.5 disabled:opacity-30" title="Move up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => reorder.mutate({ id: svc._id, order: (svc.order || 0) + 1 })}
                      disabled={idx === services.length - 1}
                      className="btn-ghost p-1.5 disabled:opacity-30" title="Move down"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      onClick={() => toggleActive.mutate({ id: svc._id, isActive: !svc.isActive })}
                      className={`btn-ghost p-1.5 ${svc.isActive ? 'text-green-600' : 'text-gray-400'}`}
                      title={svc.isActive ? 'Disable' : 'Enable'}
                    >
                      {svc.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    <Link to={`/services/${svc._id}`} className="btn-primary px-3 py-1.5 text-xs">
                      <Eye size={14} /> Edit Flow
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
