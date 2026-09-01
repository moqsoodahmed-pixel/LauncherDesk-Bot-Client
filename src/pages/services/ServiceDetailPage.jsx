import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, GripVertical, Save, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { LoadingSpinner, Modal } from '../../components/ui/index.jsx';
import toast from 'react-hot-toast';

const INPUT_TYPES = ['TEXT', 'BUTTONS', 'LIST', 'MULTI_SELECT', 'MOBILE'];

export default function ServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: service, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: () => api.get(`/services/${id}`).then(r => r.data.data),
  });

  const [questions, setQuestions] = useState([]);
  const [expandedQ, setExpandedQ] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showNewFlow, setShowNewFlow] = useState(false);

  useEffect(() => {
    if (service) {
      const activeFlow = service.flows?.find(f => f.isActive) || service.flows?.[service.flows.length - 1];
      if (activeFlow?.questions) {
        setQuestions([...activeFlow.questions].sort((a, b) => a.index - b.index));
      }
    }
  }, [service]);

  const saveFlow = async () => {
    setSaving(true);
    try {
      const version = service.currentFlowVersion || 1;
      await api.patch(`/services/${id}/flows/${version}/questions`, {
        questions: questions.map((q, i) => ({ ...q, index: i, order: i })),
      });
      toast.success('Flow saved!');
      qc.invalidateQueries(['service', id]);
    } catch {
      toast.error('Failed to save flow');
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    const newQ = {
      index: questions.length,
      key: `question_${questions.length + 1}`,
      question: 'New question?',
      inputType: 'TEXT',
      isRequired: true,
      isOptional: false,
      validationType: 'none',
      fieldLabel: 'New Question',
      options: [],
      order: questions.length,
      isActive: true,
    };
    setQuestions(qs => [...qs, newQ]);
    setExpandedQ(questions.length);
  };

  const removeQuestion = (idx) => setQuestions(qs => qs.filter((_, i) => i !== idx));

  const updateQuestion = (idx, field, value) => {
    setQuestions(qs => qs.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const addOption = (qIdx) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? {
      ...q,
      options: [...(q.options || []), { label: 'New Option', value: 'new-option', order: (q.options || []).length, isActive: true }]
    } : q));
  };

  const updateOption = (qIdx, oIdx, field, value) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? {
      ...q,
      options: q.options.map((o, j) => j === oIdx ? { ...o, [field]: value } : o)
    } : q));
  };

  const removeOption = (qIdx, oIdx) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? { ...q, options: q.options.filter((_, j) => j !== oIdx) } : q));
  };

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!service) return <div className="p-6 text-center text-gray-500">Service not found</div>;

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-lg"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{service.name}</h1>
          <p className="text-sm text-gray-500">Flow v{service.currentFlowVersion} · {questions.length} questions</p>
        </div>
        <button onClick={saveFlow} disabled={saving} className="btn-primary">
          <Save size={15} /> {saving ? 'Saving…' : 'Save Flow'}
        </button>
      </div>

      {/* Warning */}
      {questions.length > 6 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          ⚠️ This flow has {questions.length} questions. The maximum recommended is 6 (including Name & Mobile).
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-3">
        {questions.map((q, idx) => (
          <div key={idx} className="card border border-gray-200">
            {/* Question header */}
            <div
              className="flex items-center gap-3 p-4 cursor-pointer select-none"
              onClick={() => setExpandedQ(expandedQ === idx ? null : idx)}
            >
              <GripVertical size={16} className="text-gray-300 flex-shrink-0" />
              <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-800 truncate">{q.question}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {q.inputType} · {q.isRequired ? 'Required' : 'Optional'} · Key: {q.key}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }} className="btn-ghost p-1.5 text-red-500 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
                {expandedQ === idx ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
              </div>
            </div>

            {/* Expanded editor */}
            {expandedQ === idx && (
              <div className="px-4 pb-4 pt-0 border-t border-gray-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="label">Field Key</label>
                    <input value={q.key} onChange={e => updateQuestion(idx, 'key', e.target.value)} className="input font-mono text-sm" />
                  </div>
                  <div>
                    <label className="label">Field Label (summary display)</label>
                    <input value={q.fieldLabel || ''} onChange={e => updateQuestion(idx, 'fieldLabel', e.target.value)} className="input" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Question Text</label>
                    <input value={q.question} onChange={e => updateQuestion(idx, 'question', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="label">Input Type</label>
                    <select value={q.inputType} onChange={e => updateQuestion(idx, 'inputType', e.target.value)} className="input">
                      {INPUT_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-6 pt-5">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={q.isRequired} onChange={e => { updateQuestion(idx, 'isRequired', e.target.checked); if (e.target.checked) updateQuestion(idx, 'isOptional', false); }} className="rounded" />
                      Required
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={q.isOptional} onChange={e => { updateQuestion(idx, 'isOptional', e.target.checked); if (e.target.checked) updateQuestion(idx, 'isRequired', false); }} className="rounded" />
                      Optional
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={q.isActive} onChange={e => updateQuestion(idx, 'isActive', e.target.checked)} className="rounded" />
                      Active
                    </label>
                  </div>
                </div>

                {/* Options */}
                {['BUTTONS', 'LIST', 'MULTI_SELECT'].includes(q.inputType) && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="label mb-0">Options</label>
                      <button onClick={() => addOption(idx)} className="btn-secondary text-xs px-2 py-1"><Plus size={12} /> Add</button>
                    </div>
                    <div className="space-y-2">
                      {(q.options || []).map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input value={opt.label} onChange={e => { updateOption(idx, oi, 'label', e.target.value); updateOption(idx, oi, 'value', e.target.value.toLowerCase().replace(/[\s\/&]+/g, '-').replace(/[^a-z0-9\-]/g, '')); }} placeholder="Label" className="input flex-1 text-sm" />
                          <input value={opt.value} onChange={e => updateOption(idx, oi, 'value', e.target.value)} placeholder="value" className="input w-36 text-sm font-mono" />
                          <label className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                            <input type="checkbox" checked={opt.isActive !== false} onChange={e => updateOption(idx, oi, 'isActive', e.target.checked)} className="rounded" /> Active
                          </label>
                          <button onClick={() => removeOption(idx, oi)} className="btn-ghost p-1.5 text-red-500 flex-shrink-0"><Trash2 size={13} /></button>
                        </div>
                      ))}
                      {(q.options || []).length === 0 && <p className="text-xs text-gray-400">No options yet. Add one above.</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={addQuestion} className="btn-secondary w-full border-dashed">
        <Plus size={16} /> Add Question
      </button>
    </div>
  );
}
