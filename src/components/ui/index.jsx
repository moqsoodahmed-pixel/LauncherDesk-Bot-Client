import { Loader2 } from 'lucide-react';

// ── LoadingSpinner ─────────────────────────────────────────
export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 16, md: 24, lg: 40 };
  return <Loader2 size={sizes[size]} className={`animate-spin text-blue-600 ${className}`} />;
}

// ── PageHeader ─────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

// ── StatCard ───────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = 'blue', delta }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    orange: 'bg-orange-50 text-orange-600',
    teal: 'bg-teal-50 text-teal-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
          {delta !== undefined && (
            <p className={`text-xs mt-1 ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {delta >= 0 ? '+' : ''}{delta} today
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[color] || colors.blue}`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────
const BADGE_VARIANTS = {
  New: 'bg-blue-100 text-blue-700',
  Contacted: 'bg-indigo-100 text-indigo-700',
  Qualified: 'bg-purple-100 text-purple-700',
  Proposal: 'bg-yellow-100 text-yellow-700',
  Won: 'bg-green-100 text-green-700',
  Lost: 'bg-red-100 text-red-700',
  Abandoned: 'bg-gray-100 text-gray-500',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  abandoned: 'bg-gray-100 text-gray-500',
  escalated: 'bg-orange-100 text-orange-700',
  awaiting_menu: 'bg-yellow-100 text-yellow-700',
};

export function Badge({ label, variant }) {
  const cls = BADGE_VARIANTS[variant || label] || 'bg-gray-100 text-gray-600';
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ── Table ──────────────────────────────────────────────────
export function Table({ headers, children, loading, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>{headers.map((h) => <th key={h} className="table-header">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr><td colSpan={headers.length} className="py-16 text-center"><LoadingSpinner className="mx-auto" /></td></tr>
          ) : empty ? (
            <tr><td colSpan={headers.length} className="py-16 text-center text-sm text-gray-400">{empty}</td></tr>
          ) : children}
        </tbody>
      </table>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────
export function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, total } = pagination;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-sm">
      <span className="text-gray-500">Total: <strong>{total}</strong></span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="btn-ghost px-2 py-1 text-xs disabled:opacity-40">‹ Prev</button>
        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          const p = Math.max(1, page - 2) + i;
          if (p > pages) return null;
          return (
            <button key={p} onClick={() => onPage(p)}
              className={`w-8 h-8 rounded text-xs font-medium ${p === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
              {p}
            </button>
          );
        })}
        <button onClick={() => onPage(page + 1)} disabled={page >= pages} className="btn-ghost px-2 py-1 text-xs disabled:opacity-40">Next ›</button>
      </div>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

// ── FilterBar ──────────────────────────────────────────────
export function FilterBar({ children }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {children}
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-16 px-4">
      {Icon && <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Icon size={28} className="text-gray-400" /></div>}
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default LoadingSpinner;
