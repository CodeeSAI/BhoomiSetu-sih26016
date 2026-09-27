import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Banknote, Search, Check, Flag, Eye, Plus, X, Download } from 'lucide-react';

const formatCurrency = (v: number) => v >= 10000000 ? `₹${(v / 10000000).toFixed(2)} Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(1)} L` : `₹${v.toLocaleString('en-IN')}`;

const STATUS_COLORS: Record<string, string> = {
  'Disbursed': 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
  'Approved': 'bg-blue-500/15 text-blue-800 border border-blue-500/30',
  'Processing': 'bg-cyan-500/15 text-cyan-800 border border-cyan-500/30',
  'Pending': 'bg-amber-500/15 text-amber-800 border border-amber-500/30',
  'Disputed': 'bg-rose-500/15 text-rose-800 border border-rose-500/30',
  'Failed': 'bg-red-500/15 text-red-800 border border-red-500/30',
};

interface AddForm {
  projectId: string;
  parcelId: string;
  beneficiary: string;
  assessedAmount: string;
  bankAccount: string;
  remarks: string;
}
const INIT: AddForm = { projectId: '', parcelId: '', beneficiary: '', assessedAmount: '', bankAccount: '', remarks: '' };

export default function CompensationPage() {
  const store = useStore();
  const { user, permissions } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddForm>(INIT);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const compensation = store.getCompensation();
  const projects = store.getProjects();

  const filtered = useMemo(() => {
    let items = compensation;
    if (search) { const q = search.toLowerCase(); items = items.filter(c => c.id.toLowerCase().includes(q) || c.beneficiary.toLowerCase().includes(q)); }
    if (statusFilter) items = items.filter(c => c.paymentStatus === statusFilter);
    return items;
  }, [compensation, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totals = useMemo(() => ({
    assessed: filtered.reduce((s, c) => s + c.assessedAmount, 0),
    approved: filtered.reduce((s, c) => s + c.approvedAmount, 0),
    paid: filtered.reduce((s, c) => s + c.paidAmount, 0),
    pending: filtered.filter(c => c.paymentStatus === 'Pending' || c.paymentStatus === 'Approved').length,
    disputed: filtered.filter(c => c.paymentStatus === 'Disputed').length,
  }), [filtered]);

  const handleDisburse = (id: string) => {
    const rec = compensation.find(c => c.id === id);
    if (!rec || rec.paymentStatus === 'Disbursed') return;
    store.updateCompensation(id, {
      paymentStatus: 'Disbursed',
      paidAmount: rec.approvedAmount,
      disbursedDate: new Date().toISOString().split('T')[0],
    });
    store.addAuditEvent({
      timestamp: new Date().toISOString(),
      userId: user?.id || '', userName: user?.name || '', userRole: user?.role || 'Land Acquisition Officer',
      action: 'Compensation Disbursed', entityType: 'Compensation', entityId: id,
      details: `${formatCurrency(rec.approvedAmount)} disbursed to ${rec.beneficiary}`,
    });
    toast.success('Compensation marked as disbursed');
  };

  const handleApprove = (id: string) => {
    const rec = compensation.find(c => c.id === id);
    if (!rec || rec.paymentStatus === 'Approved' || rec.paymentStatus === 'Disbursed') return;
    store.updateCompensation(id, { paymentStatus: 'Approved' });
    store.addAuditEvent({
      timestamp: new Date().toISOString(),
      userId: user?.id || '', userName: user?.name || '', userRole: user?.role || 'Land Acquisition Officer',
      action: 'Compensation Approved', entityType: 'Compensation', entityId: id,
    });
    toast.success('Compensation approved');
  };

  const handleFlag = (id: string) => {
    const rec = compensation.find(c => c.id === id);
    if (!rec || rec.paymentStatus === 'Disputed') return;
    store.updateCompensation(id, { paymentStatus: 'Disputed', verificationState: 'Flagged' });
    toast.warning('Compensation flagged as disputed');
  };

  const handleAddRecord = () => {
    if (!form.projectId || !form.beneficiary || !form.assessedAmount) {
      toast.error('Project, beneficiary, and assessed amount are required');
      return;
    }
    const assessed = parseFloat(form.assessedAmount);
    store.createCompensation({
      projectId: form.projectId,
      parcelId: form.parcelId || `PRC-${Math.floor(10000 + Math.random() * 90000)}`,
      beneficiary: form.beneficiary,
      assessedAmount: assessed,
      approvedAmount: assessed,
      paidAmount: 0,
      bankAccount: form.bankAccount || `DEMO${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      paymentStatus: 'Pending',
      verificationState: 'Unverified',
      remarks: form.remarks,
    });
    store.addAuditEvent({
      timestamp: new Date().toISOString(),
      userId: user?.id || '', userName: user?.name || '', userRole: user?.role || 'Land Acquisition Officer',
      action: 'Compensation Record Created', entityType: 'Compensation', entityId: 'new',
      details: `New compensation record for ${form.beneficiary}: ${formatCurrency(assessed)}`,
    });
    toast.success(`Compensation record created for ${form.beneficiary}`);
    setForm(INIT);
    setShowAdd(false);
  };

  const handleExport = () => {
    const headers = ['ID', 'Beneficiary', 'Project', 'Assessed', 'Approved', 'Paid', 'Status'];
    const rows = filtered.map(c => {
      const proj = projects.find(p => p.id === c.projectId);
      return [c.id, c.beneficiary, proj?.name || c.projectId, c.assessedAmount, c.approvedAmount, c.paidAmount, c.paymentStatus];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `compensation_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported');
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <Banknote size={22} className="text-primary-600" />
            Compensation Management
          </h1>
          <p className="text-xs text-surface-500 mt-1">Assessment, approval and disbursement under RFCTLARR Act, 2013</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
            <Download size={14} /> Export
          </button>
          {permissions?.canManageCompensation && (
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
              <Plus size={14} /> Add Record
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="glass-kpi border-l-4 border-l-violet-500">
          <p className="text-[10px] uppercase font-bold text-violet-700 tracking-wider">Total Assessed</p>
          <p className="text-lg font-bold text-surface-900 mt-1">{formatCurrency(totals.assessed)}</p>
        </div>
        <div className="glass-kpi border-l-4 border-l-blue-500">
          <p className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Total Approved</p>
          <p className="text-lg font-bold text-surface-900 mt-1">{formatCurrency(totals.approved)}</p>
        </div>
        <div className="glass-kpi border-l-4 border-l-emerald-500">
          <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Total Paid</p>
          <p className="text-lg font-bold text-surface-900 mt-1">{formatCurrency(totals.paid)}</p>
        </div>
        <div className="glass-kpi border-l-4 border-l-amber-500">
          <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Pending/Approved</p>
          <p className="text-lg font-bold text-surface-900 mt-1">{totals.pending}</p>
        </div>
        <div className="glass-kpi border-l-4 border-l-rose-500">
          <p className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">Disputed</p>
          <p className="text-lg font-bold text-surface-900 mt-1">{totals.disputed}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input type="text" placeholder="Search by ID or beneficiary..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="glass-input w-full h-9 pl-9 pr-3 text-xs" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="glass-input h-9 px-3 text-xs">
          <option value="">All Status</option>
          {['Pending', 'Approved', 'Processing', 'Disbursed', 'Failed', 'Disputed'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="glass-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="glass-table-header">
                {['ID', 'Beneficiary', 'Assessed', 'Approved', 'Paid', 'Bank', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-3.5 py-3 text-left font-bold text-surface-700 uppercase tracking-wider text-[11px] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200/50">
              {paged.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-surface-400">No records match filters</td></tr>
              ) : paged.map(c => (
                <tr key={c.id} className="hover:bg-white/60 transition-colors">
                  <td className="px-3.5 py-3 font-mono text-surface-500 font-semibold">{c.id}</td>
                  <td className="px-3.5 py-3 text-surface-900 font-semibold">{c.beneficiary}</td>
                  <td className="px-3.5 py-3 text-surface-700">{formatCurrency(c.assessedAmount)}</td>
                  <td className="px-3.5 py-3 text-surface-700 font-medium">{formatCurrency(c.approvedAmount)}</td>
                  <td className="px-3.5 py-3 text-surface-500 font-mono" title="Bank account masked under DPDP Act 2023 privacy policy">
                    •••• •••• {c.bankAccount ? c.bankAccount.slice(-4) : '4589'}
                  </td>
                  <td className="px-3.5 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_COLORS[c.paymentStatus] || 'bg-surface-100 text-surface-600'}`}>
                      {c.paymentStatus}
                    </span>
                  </td>
                  <td className="px-3.5 py-3">
                    {permissions?.canManageCompensation && (
                      <div className="flex gap-1.5">
                        {c.paymentStatus === 'Pending' && (
                          <button onClick={() => handleApprove(c.id)} className="px-2.5 py-1 bg-violet-100 text-violet-800 text-[10px] rounded-lg hover:bg-violet-200 font-bold border border-violet-200/60">Approve</button>
                        )}
                        {(c.paymentStatus === 'Approved' || c.paymentStatus === 'Processing') && (
                          <button onClick={() => handleDisburse(c.id)} className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] rounded-lg hover:bg-emerald-200 font-bold border border-emerald-200/60">Disburse</button>
                        )}
                        {c.paymentStatus !== 'Disputed' && c.paymentStatus !== 'Disbursed' && (
                          <button onClick={() => handleFlag(c.id)} className="px-2.5 py-1 bg-red-100 text-red-800 text-[10px] rounded-lg hover:bg-red-200 font-bold border border-red-200/60">Flag</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200/50 bg-white/40">
            <p className="text-xs text-surface-500">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2.5 py-1 text-xs glass-button-secondary rounded-lg disabled:opacity-40">← Prev</button>
              <span className="px-3 py-1 text-xs bg-primary-600 text-white font-semibold rounded-lg shadow-sm">{page}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2.5 py-1 text-xs glass-button-secondary rounded-lg disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="glass-modal w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200/50 bg-white/40">
              <h2 className="text-sm font-bold text-surface-900">Add Compensation Record</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-white/60"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Project *</label>
                <select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                  className="glass-input w-full h-9 px-3 text-xs">
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Beneficiary Name *</label>
                <input value={form.beneficiary} onChange={e => setForm(f => ({ ...f, beneficiary: e.target.value }))}
                  placeholder="Full name of land owner / family head"
                  className="glass-input w-full h-9 px-3 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">Assessed Amount (₹) *</label>
                  <input type="number" value={form.assessedAmount} onChange={e => setForm(f => ({ ...f, assessedAmount: e.target.value }))}
                    placeholder="e.g., 2500000"
                    className="glass-input w-full h-9 px-3 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">Bank Account</label>
                  <input value={form.bankAccount} onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))}
                    placeholder="Account number"
                    className="glass-input w-full h-9 px-3 text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Remarks</label>
                <textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                  placeholder="Optional notes..."
                  className="glass-input w-full p-2.5 text-xs min-h-[60px]" />
              </div>
            </div>
            <div className="flex gap-2.5 px-5 py-4 border-t border-surface-200/50 bg-white/30">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 py-2 text-xs font-semibold text-surface-600 hover:bg-surface-200/60 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleAddRecord}
                className="flex-1 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
                Create Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
