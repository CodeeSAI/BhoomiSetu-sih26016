import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, Search, Filter, Download, User, Calendar, Activity, ArrowRight, Shield } from 'lucide-react';
import type { AuditEvent } from '../types';
import { format, parseISO, isValid } from 'date-fns';

const ACTION_COLORS: Record<string, string> = {
  'User Login': 'bg-blue-500/15 text-blue-800 border border-blue-500/30',
  'User Logout': 'bg-surface-100/90 text-surface-600 border border-surface-200/50',
  'Workflow Submit': 'bg-violet-500/15 text-violet-800 border border-violet-500/30',
  'Workflow Approve': 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
  'Workflow Reject': 'bg-rose-500/15 text-rose-800 border border-rose-500/30',
  'Workflow Revise': 'bg-amber-500/15 text-amber-800 border border-amber-500/30',
};

function getActionColor(action: string): string {
  for (const [key, val] of Object.entries(ACTION_COLORS)) {
    if (action.includes(key)) return val;
  }
  return 'bg-surface-100 text-surface-600';
}

function fmtDate(iso: string) {
  try {
    const d = parseISO(iso);
    return isValid(d) ? format(d, 'dd MMM yyyy, HH:mm:ss') : iso;
  } catch {
    return iso;
  }
}

export default function AuditPage() {
  const store = useStore();
  const { permissions } = useAuth();

  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const events = store.getAuditEvents();

  const entityTypes = useMemo(() => [...new Set(events.map(e => e.entityType))].sort(), [events]);
  const actionTypes = useMemo(() => {
    const actions = new Set<string>();
    events.forEach(e => {
      const parts = e.action.split(':');
      actions.add(parts[0].trim());
    });
    return [...actions].sort();
  }, [events]);

  const filtered = useMemo(() => {
    let items = [...events];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(e =>
        e.userName.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.entityType.toLowerCase().includes(q) ||
        (e.entityName?.toLowerCase().includes(q)) ||
        (e.details?.toLowerCase().includes(q))
      );
    }
    if (entityFilter) items = items.filter(e => e.entityType === entityFilter);
    if (actionFilter) items = items.filter(e => e.action.startsWith(actionFilter));
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [events, search, entityFilter, actionFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'User', 'Role', 'Action', 'Entity Type', 'Entity', 'Old Value', 'New Value', 'Details'].join(','),
      ...filtered.map(e => [
        e.timestamp, e.userName, e.userRole, `"${e.action}"`, e.entityType,
        `"${e.entityName || ''}"`, `"${e.oldValue || ''}"`, `"${e.newValue || ''}"`, `"${e.details || ''}"`
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bhoomisetu_audit_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!permissions?.canViewAudit) {
    return (
      <div className="p-8 text-center">
        <Shield size={40} className="mx-auto text-surface-300 mb-3" />
        <p className="text-surface-600 font-medium">Access Restricted</p>
        <p className="text-surface-400 text-sm">You do not have permission to view the audit trail.</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <ClipboardList size={22} className="text-primary-600" />
            Statutory Audit Trail
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            Immutable log of all administrative actions, stage approvals & compensation payments — {filtered.length.toLocaleString()} events
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Download size={14} />
          Export CSV Log
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: events.length.toLocaleString(), icon: <Activity size={16} />, color: 'text-primary-600', border: 'border-l-primary-500' },
          { label: 'Logged Today', value: events.filter(e => e.timestamp.startsWith(new Date().toISOString().slice(0,10))).length.toString(), icon: <Calendar size={16} />, color: 'text-emerald-600', border: 'border-l-emerald-500' },
          { label: 'Active Authorities', value: new Set(events.map(e => e.userId)).size.toString(), icon: <User size={16} />, color: 'text-violet-600', border: 'border-l-violet-500' },
          { label: 'Workflow Actions', value: events.filter(e => e.action.startsWith('Workflow')).length.toString(), icon: <ArrowRight size={16} />, color: 'text-amber-600', border: 'border-l-amber-500' },
        ].map(({ label, value, icon, color, border }) => (
          <div key={label} className={`glass-kpi border-l-4 ${border}`}>
            <div className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider mb-1 ${color}`}>
              {icon}
              <span>{label}</span>
            </div>
            <p className="text-xl font-bold text-surface-900 font-mono">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-panel p-3.5 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search users, actions, entities..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="glass-input w-full h-9 pl-9 pr-3 text-xs"
          />
        </div>
        <select
          value={entityFilter}
          onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
          className="glass-input h-9 px-3 text-xs"
        >
          <option value="">All Entity Types</option>
          {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          className="glass-input h-9 px-3 text-xs"
        >
          <option value="">All Actions</option>
          {actionTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="glass-table-header">
                <th className="text-left px-4 py-3 font-bold text-surface-700 uppercase tracking-wider text-[11px] whitespace-nowrap">Timestamp</th>
                <th className="text-left px-4 py-3 font-bold text-surface-700 uppercase tracking-wider text-[11px]">User</th>
                <th className="text-left px-4 py-3 font-bold text-surface-700 uppercase tracking-wider text-[11px]">Action</th>
                <th className="text-left px-4 py-3 font-bold text-surface-700 uppercase tracking-wider text-[11px]">Entity</th>
                <th className="text-left px-4 py-3 font-bold text-surface-700 uppercase tracking-wider text-[11px]">Change</th>
                <th className="text-left px-4 py-3 font-bold text-surface-700 uppercase tracking-wider text-[11px]">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200/50">
              {paged.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-surface-400">No audit records found</td></tr>
              ) : paged.map(event => (
                <tr key={event.id} className="hover:bg-white/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-surface-500 font-medium whitespace-nowrap">
                    {fmtDate(event.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-surface-900">{event.userName}</p>
                    <p className="text-surface-500 text-[10px] truncate max-w-[140px] font-medium">{event.userRole}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${getActionColor(event.action)}`}>
                      {event.action.length > 30 ? event.action.slice(0, 30) + '…' : event.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-surface-800">{event.entityType}</p>
                    <p className="text-[10px] text-surface-400 font-mono truncate max-w-[120px]">{event.entityName || event.entityId}</p>
                  </td>
                  <td className="px-4 py-3">
                    {(event.oldValue || event.newValue) ? (
                      <div className="flex items-center gap-1 text-[10px]">
                        {event.oldValue && <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded border border-red-200/60 truncate max-w-[80px] font-medium">{event.oldValue}</span>}
                        {event.oldValue && event.newValue && <ArrowRight size={10} className="text-surface-400 shrink-0" />}
                        {event.newValue && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200/60 truncate max-w-[80px] font-medium">{event.newValue}</span>}
                      </div>
                    ) : <span className="text-surface-300 text-[10px]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-surface-600 max-w-[240px]">
                    <span className="line-clamp-2">{event.details || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200/50 bg-white/40">
            <p className="text-xs text-surface-500 font-medium">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length.toLocaleString()}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 rounded-xl text-xs glass-button-secondary text-surface-700 disabled:opacity-40"
              >Previous</button>
              <span className="px-2 text-xs font-semibold text-surface-700">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2.5 py-1 rounded-xl text-xs glass-button-secondary text-surface-700 disabled:opacity-40"
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
