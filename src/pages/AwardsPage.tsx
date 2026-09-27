import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Award, Search, CheckCircle, AlertCircle, RotateCcw, Download, Filter } from 'lucide-react';
import type { Award as AwardType } from '../types';

const formatCurrency = (v: number) => v >= 10000000 ? `₹${(v / 10000000).toFixed(2)} Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(1)} L` : `₹${v.toLocaleString('en-IN')}`;

const STATUS_BADGE: Record<string, string> = {
  'Draft': 'bg-surface-100/90 text-surface-600 border border-surface-200/50',
  'Issued': 'bg-blue-500/15 text-blue-800 border border-blue-500/30',
  'Accepted': 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
  'Disputed': 'bg-rose-500/15 text-rose-800 border border-rose-500/30',
  'Revised': 'bg-amber-500/15 text-amber-800 border border-amber-500/30',
};

export default function AwardsPage() {
  const store = useStore();
  const { user, permissions } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const awards = store.getAwards();
  const projects = store.getProjects();

  const filtered = useMemo(() => {
    let items = awards;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(a => a.id.toLowerCase().includes(q) || a.beneficiary.toLowerCase().includes(q));
    }
    if (statusFilter) items = items.filter(a => a.status === statusFilter);
    if (projectFilter) items = items.filter(a => a.projectId === projectFilter);
    return items;
  }, [awards, search, statusFilter, projectFilter]);

  const totals = useMemo(() => ({
    total: awards.length,
    assessed: awards.reduce((s, a) => s + a.assessedAmount, 0),
    awarded: awards.reduce((s, a) => s + a.awardAmount, 0),
    area: awards.reduce((s, a) => s + a.landArea, 0),
    issued: awards.filter(a => a.status === 'Issued' || a.status === 'Accepted').length,
    disputed: awards.filter(a => a.status === 'Disputed').length,
  }), [awards]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleIssue = (id: string) => {
    const award = awards.find(a => a.id === id);
    if (!award || award.status === 'Issued') return;
    store.updateAward(id, { status: 'Issued' });
    store.addAuditEvent({
      timestamp: new Date().toISOString(),
      userId: user?.id || '', userName: user?.name || '', userRole: user?.role || 'Land Acquisition Officer',
      action: 'Award Issued', entityType: 'Award', entityId: id,
      details: `Award ${id} issued to ${award.beneficiary} for ${formatCurrency(award.awardAmount)}`,
    });
    toast.success(`Award ${id} issued to ${award.beneficiary}`);
  };

  const handleAccept = (id: string) => {
    const award = awards.find(a => a.id === id);
    if (!award || award.status === 'Accepted') return;
    store.updateAward(id, { status: 'Accepted' });
    store.addAuditEvent({
      timestamp: new Date().toISOString(),
      userId: user?.id || '', userName: user?.name || '', userRole: user?.role || 'Land Acquisition Officer',
      action: 'Award Accepted', entityType: 'Award', entityId: id,
      details: `Award ${id} accepted by ${award.beneficiary}`,
    });
    toast.success(`Award ${id} accepted`);
  };

  const handleDispute = (id: string) => {
    const award = awards.find(a => a.id === id);
    if (!award || award.status === 'Disputed') return;
    store.updateAward(id, { status: 'Disputed' });
    store.addAuditEvent({
      timestamp: new Date().toISOString(),
      userId: user?.id || '', userName: user?.name || '', userRole: user?.role || 'Land Acquisition Officer',
      action: 'Award Disputed', entityType: 'Award', entityId: id,
      details: `Award ${id} marked as disputed`,
    });
    toast.error(`Award ${id} marked as disputed`);
  };

  const handleRevise = (id: string) => {
    const award = awards.find(a => a.id === id);
    if (!award || award.status === 'Revised') return;
    store.updateAward(id, { status: 'Revised' });
    toast.info(`Award ${id} sent for revision`);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Project', 'Parcel', 'Beneficiary', 'Award Date', 'Area (Ha)', 'Assessed (₹)', 'Awarded (₹)', 'Status'];
    const rows = filtered.map(a => {
      const proj = projects.find(p => p.id === a.projectId);
      return [a.id, proj?.name || a.projectId, a.parcelId, a.beneficiary, a.awardDate, a.landArea.toFixed(2), a.assessedAmount, a.awardAmount, a.status];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `bhoomisetu_awards_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Awards exported as CSV');
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <Award size={22} className="text-primary-600" />
            Land Awards
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">
            Compensation awards under RFCTLARR Act, 2013 • {awards.length} total awards
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Awards', value: totals.total.toLocaleString(), color: 'bg-white/80 border-surface-200/80 text-surface-800' },
          { label: 'Issued/Accepted', value: totals.issued.toString(), color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800' },
          { label: 'Disputed', value: totals.disputed.toString(), color: 'bg-rose-500/10 border-rose-500/20 text-rose-800' },
          { label: 'Total Area', value: `${totals.area.toFixed(1)} Ha`, color: 'bg-blue-500/10 border-blue-500/20 text-blue-800' },
          { label: 'Assessed Value', value: formatCurrency(totals.assessed), color: 'bg-violet-500/10 border-violet-500/20 text-violet-800' },
          { label: 'Award Value', value: formatCurrency(totals.awarded), color: 'bg-amber-500/10 border-amber-500/20 text-amber-800' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`glass-kpi ${color}`}>
            <p className="text-[10px] font-semibold opacity-75 uppercase tracking-wider">{label}</p>
            <p className="text-lg font-bold mt-1 tracking-tight truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <input
            type="text" placeholder="Search awards..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-3 rounded-xl glass-input text-sm"
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-xl glass-input text-sm">
          <option value="">All Status</option>
          {['Draft', 'Issued', 'Accepted', 'Disputed', 'Revised'].map(s => <option key={s} value={s}>{s}</option>)}
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
                {['ID', 'Project', 'Parcel', 'Beneficiary', 'Award Date', 'Area (Ha)', 'Assessed', 'Award Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-3.5 py-3 text-left text-xs font-semibold text-surface-700 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-surface-400 text-sm">No awards match the current filters</td></tr>
              ) : paged.map(a => {
                const proj = projects.find(p => p.id === a.projectId);
                return (
                  <tr key={a.id} className="border-b border-surface-200/50 hover:bg-primary-500/5 transition-colors">
                    <td className="px-3.5 py-2.5 text-xs font-mono font-medium text-surface-600">{a.id}</td>
                    <td className="px-3.5 py-2.5 text-xs font-medium text-surface-800 max-w-[160px] truncate" title={proj?.name}>{proj?.name || a.projectId}</td>
                    <td className="px-3.5 py-2.5 text-xs font-mono text-surface-500">{a.parcelId}</td>
                    <td className="px-3.5 py-2.5 text-xs text-surface-900 font-semibold">{a.beneficiary}</td>
                    <td className="px-3.5 py-2.5 text-xs text-surface-600 whitespace-nowrap">{a.awardDate}</td>
                    <td className="px-3.5 py-2.5 text-xs text-surface-700 font-medium">{a.landArea.toFixed(2)}</td>
                    <td className="px-3.5 py-2.5 text-xs text-surface-600">{formatCurrency(a.assessedAmount)}</td>
                    <td className="px-3.5 py-2.5 text-xs text-surface-900 font-bold">{formatCurrency(a.awardAmount)}</td>
                    <td className="px-3.5 py-2.5">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${STATUS_BADGE[a.status] || 'bg-surface-100 text-surface-600'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-1">
                        {a.status === 'Draft' && permissions?.canManageAwards && (
                          <button
                            onClick={() => handleIssue(a.id)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                            title="Issue Award"
                          >
                            <Award size={14} />
                          </button>
                        )}
                        {a.status === 'Issued' && (
                          <>
                            <button
                              onClick={() => handleAccept(a.id)}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                              title="Mark Accepted"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => handleDispute(a.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors"
                              title="Mark Disputed"
                            >
                              <AlertCircle size={14} />
                            </button>
                          </>
                        )}
                        {a.status === 'Disputed' && permissions?.canManageAwards && (
                          <button
                            onClick={() => handleRevise(a.id)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                            title="Request Revision"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                        {a.status === 'Accepted' && (
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">✓ Complete</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200/60 bg-surface-50/50">
            <p className="text-xs text-surface-500 font-medium">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} awards
            </p>
            <div className="flex gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2.5 py-1 text-xs border border-surface-200/80 rounded-lg disabled:opacity-40 hover:bg-white/80 transition-colors">← Prev</button>
              <span className="px-3 py-1 text-xs bg-primary-600 text-white rounded-lg font-semibold shadow-xs">{page}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2.5 py-1 text-xs border border-surface-200/80 rounded-lg disabled:opacity-40 hover:bg-white/80 transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Action legend */}
      <div className="flex items-center gap-4 text-xs text-surface-500">
        <span>🏆 = Issue Award (Draft → Issued)</span>
        <span>✓ = Accept Award</span>
        <span>⚠ = Mark Disputed</span>
        <span>↩ = Request Revision</span>
      </div>
    </div>
  );
}
