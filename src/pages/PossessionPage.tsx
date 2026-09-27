import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { KeyRound, Search, Check, AlertTriangle, FileText, Clock, Download } from 'lucide-react';
import type { PossessionStatus } from '../types';

const STATUS_COLOR: Record<PossessionStatus, string> = {
  'Not Due': 'bg-surface-100/80 text-surface-600 border border-surface-200/50',
  'Notice Issued': 'bg-cyan-500/15 text-cyan-800 border border-cyan-500/30',
  'Partial': 'bg-indigo-500/15 text-indigo-800 border border-indigo-500/30',
  'Completed': 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
  'Delayed': 'bg-amber-500/15 text-amber-800 border border-amber-500/30',
  'Disputed': 'bg-rose-500/15 text-rose-800 border border-rose-500/30',
};

export default function PossessionPage() {
  const store = useStore();
  const { user, permissions } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const possession = store.getPossession();
  const projects = store.getProjects();
  const parcels = store.getParcels();

  const filtered = useMemo(() => {
    let items = possession;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(p => p.id.toLowerCase().includes(q) || p.parcelId.toLowerCase().includes(q));
    }
    if (statusFilter) items = items.filter(p => p.status === statusFilter);
    if (projectFilter) items = items.filter(p => p.projectId === projectFilter);
    return items;
  }, [possession, search, statusFilter, projectFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = useMemo(() => ({
    total: possession.length,
    completed: possession.filter(p => p.status === 'Completed').length,
    noticeIssued: possession.filter(p => p.status === 'Notice Issued').length,
    partial: possession.filter(p => p.status === 'Partial').length,
    delayed: possession.filter(p => p.status === 'Delayed').length,
    disputed: possession.filter(p => p.status === 'Disputed').length,
  }), [possession]);

  const completionPct = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : '0';

  const handleIssueNotice = (id: string) => {
    const p = possession.find(x => x.id === id);
    if (!p || p.status === 'Notice Issued' || p.status === 'Completed') return;
    store.updatePossession(id, {
      status: 'Notice Issued',
      noticeDate: new Date().toISOString().split('T')[0],
    });
    store.addAuditEvent({
      timestamp: new Date().toISOString(),
      userId: user?.id || '', userName: user?.name || '', userRole: user?.role || 'Land Acquisition Officer',
      action: 'Possession Notice Issued', entityType: 'Possession', entityId: id,
    });
    toast.success('Possession notice issued');
  };

  const handleMarkPartial = (id: string) => {
    const p = possession.find(x => x.id === id);
    if (!p || p.status === 'Partial' || p.status === 'Completed') return;
    store.updatePossession(id, { status: 'Partial', isPartial: true });
    store.addAuditEvent({
      timestamp: new Date().toISOString(),
      userId: user?.id || '', userName: user?.name || '', userRole: user?.role || 'Land Acquisition Officer',
      action: 'Partial Possession Recorded', entityType: 'Possession', entityId: id,
    });
    toast.info('Partial possession recorded');
  };

  const handleComplete = (id: string) => {
    const p = possession.find(x => x.id === id);
    if (!p || p.status === 'Completed') return;
    const today = new Date().toISOString().split('T')[0];
    store.updatePossession(id, {
      status: 'Completed',
      completedDate: today,
      handoverDate: today,
    });
    store.addAuditEvent({
      timestamp: new Date().toISOString(),
      userId: user?.id || '', userName: user?.name || '', userRole: user?.role || 'Land Acquisition Officer',
      action: 'Possession Completed', entityType: 'Possession', entityId: id,
      details: `Possession ${id} completed on ${today}`,
    });
    toast.success('Possession marked as completed');
  };

  const handleMarkDelayed = (id: string) => {
    const p = possession.find(x => x.id === id);
    if (!p || p.status === 'Delayed' || p.status === 'Completed') return;
    store.updatePossession(id, { status: 'Delayed' });
    toast.warning('Possession marked as delayed');
  };

  const handleExport = () => {
    const headers = ['ID', 'Project', 'Parcel', 'Due Date', 'Notice Date', 'Completed Date', 'Status', 'Officer', 'Partial'];
    const rows = filtered.map(p => {
      const proj = projects.find(pr => pr.id === p.projectId);
      return [p.id, proj?.name || p.projectId, p.parcelId, p.dueDate, p.noticeDate || '', p.completedDate || '', p.status, p.possessionOfficer || '', p.isPartial ? 'Yes' : 'No'];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `possession_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Possession data exported');
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <KeyRound size={22} className="text-primary-600" />
            Possession Management
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">
            Land handover tracking • Section 38 RFCTLARR Act, 2013
          </p>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'bg-white/80 border-surface-200/80 text-surface-800' },
          { label: 'Completed', value: stats.completed, color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800' },
          { label: 'Notice Issued', value: stats.noticeIssued, color: 'bg-blue-500/10 border-blue-500/20 text-blue-800' },
          { label: 'Partial', value: stats.partial, color: 'bg-amber-500/10 border-amber-500/20 text-amber-800' },
          { label: 'Delayed', value: stats.delayed, color: 'bg-rose-500/10 border-rose-500/20 text-rose-800' },
          { label: 'Completion %', value: `${completionPct}%`, color: 'bg-primary-500/10 border-primary-500/20 text-primary-800' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`glass-kpi ${color}`}>
            <p className="text-[10px] font-semibold opacity-75 uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold mt-1 tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-surface-800">Overall Possession Completion</span>
          <span className="text-sm font-bold text-primary-600">{completionPct}%</span>
        </div>
        <div className="w-full h-3 bg-surface-200/60 rounded-full overflow-hidden p-0.5 border border-surface-200/50">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full transition-all duration-500 shadow-xs"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <input type="text" placeholder="Search by ID or parcel..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-3 rounded-xl glass-input text-sm"
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-xl glass-input text-sm">
          <option value="">All Status</option>
          {['Not Due', 'Notice Issued', 'Partial', 'Completed', 'Delayed', 'Disputed'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={projectFilter} onChange={e => { setProjectFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-xl glass-input text-sm max-w-[200px]">
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name.substring(0, 30)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="glass-table-header">
                {['ID', 'Project', 'Parcel', 'Due Date', 'Notice Date', 'Completed', 'Status', 'Officer', 'Actions'].map(h => (
                  <th key={h} className="px-3.5 py-3 text-left text-xs font-semibold text-surface-700 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-surface-400 text-sm">No records match the filters</td></tr>
              ) : paged.map(p => {
                const proj = projects.find(pr => pr.id === p.projectId);
                const overdue = p.status !== 'Completed' && new Date(p.dueDate) < new Date();
                return (
                  <tr key={p.id} className={`border-b border-surface-200/50 hover:bg-primary-500/5 transition-colors ${overdue ? 'bg-rose-500/5' : ''}`}>
                    <td className="px-3.5 py-2.5 text-xs font-mono font-medium text-surface-600">{p.id}</td>
                    <td className="px-3.5 py-2.5 text-xs font-medium text-surface-800 truncate max-w-[160px]">{proj?.name || p.projectId}</td>
                    <td className="px-3.5 py-2.5 text-xs font-mono text-surface-500">{p.parcelId}</td>
                    <td className="px-3.5 py-2.5 text-xs text-surface-600 whitespace-nowrap">
                      {p.dueDate}
                      {overdue && <span className="ml-1 text-rose-500 font-bold">⚠</span>}
                    </td>
                    <td className="px-3.5 py-2.5 text-xs text-surface-600">{p.noticeDate || '—'}</td>
                    <td className="px-3.5 py-2.5 text-xs text-surface-600">{p.completedDate || '—'}</td>
                    <td className="px-3.5 py-2.5">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${STATUS_COLOR[p.status]}`}>
                        {p.status}
                        {p.isPartial && ' (Partial)'}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-xs text-surface-600">{p.possessionOfficer || '—'}</td>
                    <td className="px-3.5 py-2.5">
                      {permissions?.canManagePossession && p.status !== 'Completed' && (
                        <div className="flex items-center gap-1">
                          {p.status === 'Not Due' && (
                            <button
                              onClick={() => handleIssueNotice(p.id)}
                              className="px-2.5 py-1 bg-blue-50 border border-blue-200/60 text-blue-700 text-[10px] rounded-lg hover:bg-blue-100 font-semibold flex items-center gap-1 transition-colors"
                              title="Issue Possession Notice"
                            >
                              <FileText size={11} /> Notice
                            </button>
                          )}
                          {(p.status === 'Notice Issued') && (
                            <button
                              onClick={() => handleMarkPartial(p.id)}
                              className="px-2.5 py-1 bg-amber-50 border border-amber-200/60 text-amber-700 text-[10px] rounded-lg hover:bg-amber-100 font-semibold transition-colors"
                              title="Mark Partial Possession"
                            >
                              Partial
                            </button>
                          )}
                          {(p.status === 'Notice Issued' || p.status === 'Partial') && (
                            <button
                              onClick={() => handleComplete(p.id)}
                              className="px-2.5 py-1 bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[10px] rounded-lg hover:bg-emerald-100 font-semibold flex items-center gap-1 transition-colors"
                              title="Mark Possession Complete"
                            >
                              <Check size={11} /> Complete
                            </button>
                          )}
                          {p.status !== 'Delayed' && overdue && (
                            <button
                              onClick={() => handleMarkDelayed(p.id)}
                              className="px-2.5 py-1 bg-rose-50 border border-rose-200/60 text-rose-700 text-[10px] rounded-lg hover:bg-rose-100 font-semibold transition-colors"
                              title="Mark Delayed"
                            >
                              Delayed
                            </button>
                          )}
                        </div>
                      )}
                      {p.status === 'Completed' && (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">✓ Done</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200/60 bg-surface-50/50">
            <p className="text-xs text-surface-500 font-medium">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2.5 py-1 text-xs border border-surface-200/80 rounded-lg disabled:opacity-40 hover:bg-white/80 transition-colors">← Prev</button>
              <span className="px-3 py-1 text-xs bg-primary-600 text-white rounded-lg font-semibold shadow-xs">{page}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2.5 py-1 text-xs border border-surface-200/80 rounded-lg disabled:opacity-40 hover:bg-white/80 transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
