import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Search, Users, Plus, Edit3, X, CheckCircle, AlertTriangle, Filter } from 'lucide-react';
import type { AffectedFamily, RRStatus, CompensationStatus } from '../types';

const RR_COLORS: Record<RRStatus, string> = {
  'Not Started': 'bg-surface-100/80 text-surface-600 border border-surface-200/50',
  'In Progress': 'bg-violet-500/15 text-violet-800 border border-violet-500/30',
  'Partial': 'bg-indigo-500/15 text-indigo-800 border border-indigo-500/30',
  'Completed': 'bg-teal-500/15 text-teal-800 border border-teal-500/30',
  'Pending Verification': 'bg-amber-500/15 text-amber-800 border border-amber-500/30',
};

const COMP_COLORS: Record<string, string> = {
  'Not Assessed': 'bg-surface-100/80 text-surface-600 border border-surface-200/50',
  'Assessed': 'bg-violet-500/15 text-violet-800 border border-violet-500/30',
  'Approved': 'bg-blue-500/15 text-blue-800 border border-blue-500/30',
  'Disbursed': 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
  'Partial': 'bg-amber-500/15 text-amber-800 border border-amber-500/30',
  'Disputed': 'bg-rose-500/15 text-rose-800 border border-rose-500/30',
  'Pending': 'bg-amber-500/15 text-amber-800 border border-amber-500/30',
};

interface AddFamilyForm {
  projectId: string;
  headOfFamily: string;
  village: string;
  district: string;
  state: string;
  members: string;
  isDisplaced: boolean;
  landholding: string;
  compensationEligibility: string;
}

const INIT_FORM: AddFamilyForm = {
  projectId: '', headOfFamily: '', village: '', district: '', state: '', members: '4',
  isDisplaced: false, landholding: '0.5', compensationEligibility: '500000',
};

export default function FamiliesPage() {
  const store = useStore();
  const { user, permissions } = useAuth();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [displacedFilter, setDisplacedFilter] = useState<'' | 'displaced' | 'non-displaced'>('');
  const [rrFilter, setRrFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editFamily, setEditFamily] = useState<AffectedFamily | null>(null);
  const [form, setForm] = useState<AddFamilyForm>(INIT_FORM);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const families = store.getFamilies();
  const projects = store.getProjects();
  const states = useMemo(() => [...new Set(families.map(f => f.state))].sort(), [families]);

  const filtered = useMemo(() => {
    let items = families;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(f =>
        f.headOfFamily.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q) ||
        f.village.toLowerCase().includes(q) ||
        f.district.toLowerCase().includes(q)
      );
    }
    if (stateFilter) items = items.filter(f => f.state === stateFilter);
    if (displacedFilter === 'displaced') items = items.filter(f => f.isDisplaced);
    if (displacedFilter === 'non-displaced') items = items.filter(f => !f.isDisplaced);
    if (rrFilter) items = items.filter(f => f.rrStatus === rrFilter);
    return items;
  }, [families, search, stateFilter, displacedFilter, rrFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = useMemo(() => ({
    total: families.length,
    members: families.reduce((s, f) => s + f.members, 0),
    displaced: families.filter(f => f.isDisplaced).length,
    disbursed: families.filter(f => f.compensationStatus === 'Disbursed').length,
    rrDone: families.filter(f => f.rrStatus === 'Completed').length,
    housing: families.filter(f => f.housingAssistance).length,
  }), [families]);

  const handleAddFamily = () => {
    if (!form.headOfFamily.trim() || !form.village.trim() || !form.projectId) {
      toast.error('Please fill all required fields');
      return;
    }
    const proj = projects.find(p => p.id === form.projectId);
    store.createFamily({
      projectId: form.projectId,
      headOfFamily: form.headOfFamily,
      village: form.village,
      district: form.district || proj?.district || '',
      state: form.state || proj?.state || '',
      members: parseInt(form.members) || 4,
      isDisplaced: form.isDisplaced,
      landholding: parseFloat(form.landholding) || 0,
      compensationEligibility: parseFloat(form.compensationEligibility) || 0,
      compensationStatus: 'Not Assessed' as CompensationStatus,
      rrStatus: 'Not Started' as RRStatus,
      housingAssistance: false,
      livelihoodAssistance: false,
      relocationCompleted: false,
      assistanceReceived: [],
      contactMasked: `+91 XX-XXXX-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    store.addAuditEvent({
      timestamp: new Date().toISOString(),
      userId: user?.id || '', userName: user?.name || '', userRole: user?.role || 'R&R Officer',
      action: 'Family Registered', entityType: 'AffectedFamily', entityId: 'new',
      entityName: form.headOfFamily, details: `New family registered: ${form.headOfFamily} from ${form.village}`,
    });
    toast.success(`Family of ${form.headOfFamily} registered successfully`);
    setForm(INIT_FORM);
    setShowAdd(false);
  };

  const handleUpdateRR = (id: string, status: RRStatus) => {
    store.updateFamily(id, { rrStatus: status });
    store.addAuditEvent({
      timestamp: new Date().toISOString(),
      userId: user?.id || '', userName: user?.name || '', userRole: user?.role || 'R&R Officer',
      action: 'R&R Status Updated', entityType: 'AffectedFamily', entityId: id,
      newValue: status, details: `R&R status updated to ${status}`,
    });
    toast.success(`R&R status updated to ${status}`);
  };

  const handleUpdateComp = (id: string, status: CompensationStatus) => {
    store.updateFamily(id, { compensationStatus: status });
    toast.success(`Compensation status updated to ${status}`);
  };

  const handleToggleAssistance = (family: AffectedFamily, field: 'housingAssistance' | 'livelihoodAssistance' | 'relocationCompleted') => {
    const update: Partial<AffectedFamily> = { [field]: !family[field] };
    store.updateFamily(family.id, update);
    toast.success('Assistance status updated');
  };

  const formatCurrency = (v: number) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString('en-IN')}`;

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <Users size={22} className="text-primary-600" />
            Affected Families Registry
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">
            {stats.total.toLocaleString()} families · {stats.members.toLocaleString()} members · RFCTLARR Act, 2013
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
            <AlertTriangle size={11} />
            Contact details masked for privacy
          </div>
          {permissions?.canManageRR && (
            <button
              onClick={() => { setForm(INIT_FORM); setShowAdd(true); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus size={16} />
              Register Family
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Families', value: stats.total.toLocaleString(), color: 'bg-white/80 border-surface-200/80 text-surface-800' },
          { label: 'Total Members', value: stats.members.toLocaleString(), color: 'bg-primary-500/10 border-primary-500/20 text-primary-800' },
          { label: 'Displaced', value: stats.displaced.toString(), color: 'bg-rose-500/10 border-rose-500/20 text-rose-800' },
          { label: 'Compensation Complete', value: stats.disbursed.toString(), color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800' },
          { label: 'R&R Complete', value: stats.rrDone.toString(), color: 'bg-violet-500/10 border-violet-500/20 text-violet-800' },
          { label: 'Housing Provided', value: stats.housing.toString(), color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-800' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`glass-kpi ${color}`}>
            <p className="text-[10px] font-semibold opacity-75 uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold mt-1 tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-3 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, village, ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-3 rounded-xl glass-input text-sm"
          />
        </div>
        <select value={stateFilter} onChange={e => { setStateFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-xl glass-input text-sm">
          <option value="">All States</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={displacedFilter} onChange={e => { setDisplacedFilter(e.target.value as any); setPage(1); }}
          className="h-9 px-3 rounded-xl glass-input text-sm">
          <option value="">All Families</option>
          <option value="displaced">Displaced Only</option>
          <option value="non-displaced">Non-displaced</option>
        </select>
        <select value={rrFilter} onChange={e => { setRrFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-xl glass-input text-sm">
          <option value="">All R&R Status</option>
          {['Not Started', 'In Progress', 'Partial', 'Completed', 'Pending Verification'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="glass-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="glass-table-header">
                {['ID', 'Head of Family', 'Location', 'Members', 'Displaced', 'Land (Ha)', 'Compensation', 'R&R Status', 'Assistance', 'Contact'].map(h => (
                  <th key={h} className="px-3.5 py-3 text-left text-xs font-semibold text-surface-700 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-surface-400 text-sm">No families found</td></tr>
              ) : paged.map(f => (
                <tr key={f.id} className="border-b border-surface-200/50 hover:bg-primary-500/5 transition-colors">
                  <td className="px-3.5 py-2.5 text-xs font-mono font-medium text-surface-600">{f.id}</td>
                  <td className="px-3.5 py-2.5">
                    <p className="text-xs font-semibold text-surface-900">{f.headOfFamily}</p>
                    <p className="text-[10px] text-surface-400 font-mono">{f.projectId}</p>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <p className="text-xs text-surface-800 font-medium">{f.village}</p>
                    <p className="text-[10px] text-surface-400">{f.district}, {f.state}</p>
                  </td>
                  <td className="px-3.5 py-2.5 text-xs text-surface-700 font-medium">{f.members}</td>
                  <td className="px-3.5 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${f.isDisplaced ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-surface-100 text-surface-600'}`}>
                      {f.isDisplaced ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-xs text-surface-700 font-medium">{f.landholding.toFixed(2)}</td>
                  <td className="px-3.5 py-2.5">
                    {permissions?.canManageCompensation ? (
                      <select
                        value={f.compensationStatus}
                        onChange={e => handleUpdateComp(f.id, e.target.value as CompensationStatus)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border-0 font-semibold focus:outline-none focus:ring-1 focus:ring-primary-400 cursor-pointer ${COMP_COLORS[f.compensationStatus]}`}
                      >
                        {['Not Assessed', 'Assessed', 'Approved', 'Disbursed', 'Partial', 'Disputed', 'Pending'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${COMP_COLORS[f.compensationStatus]}`}>
                        {f.compensationStatus}
                      </span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5">
                    {permissions?.canManageRR ? (
                      <select
                        value={f.rrStatus}
                        onChange={e => handleUpdateRR(f.id, e.target.value as RRStatus)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border-0 font-semibold focus:outline-none focus:ring-1 focus:ring-primary-400 cursor-pointer ${RR_COLORS[f.rrStatus]}`}
                      >
                        {(['Not Started', 'In Progress', 'Partial', 'Completed', 'Pending Verification'] as RRStatus[]).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${RR_COLORS[f.rrStatus]}`}>
                        {f.rrStatus}
                      </span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => permissions?.canManageRR && handleToggleAssistance(f, 'housingAssistance')}
                        title="Housing Assistance"
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold transition-colors ${f.housingAssistance ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-surface-100 text-surface-400 hover:bg-surface-200'}`}
                      >H</button>
                      <button
                        onClick={() => permissions?.canManageRR && handleToggleAssistance(f, 'livelihoodAssistance')}
                        title="Livelihood Assistance"
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold transition-colors ${f.livelihoodAssistance ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-surface-100 text-surface-400 hover:bg-surface-200'}`}
                      >L</button>
                      <button
                        onClick={() => permissions?.canManageRR && handleToggleAssistance(f, 'relocationCompleted')}
                        title="Relocation Completed"
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold transition-colors ${f.relocationCompleted ? 'bg-violet-100 text-violet-800 border border-violet-300' : 'bg-surface-100 text-surface-400 hover:bg-surface-200'}`}
                      >R</button>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 text-xs font-mono text-surface-500">{f.contactMasked}</td>
                </tr>
              ))}
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
                className="px-2.5 py-1 text-xs border border-surface-200/80 rounded-lg disabled:opacity-40 hover:bg-white/80 transition-colors">Prev</button>
              <span className="px-3 py-1 text-xs bg-primary-600 text-white rounded-lg font-semibold shadow-xs">{page}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2.5 py-1 text-xs border border-surface-200/80 rounded-lg disabled:opacity-40 hover:bg-white/80 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-surface-500 font-medium">
        <span><strong className="text-emerald-700">H</strong> = Housing Assistance</span>
        <span><strong className="text-blue-700">L</strong> = Livelihood Assistance</span>
        <span><strong className="text-violet-700">R</strong> = Relocation Completed</span>
        <span className="text-amber-700">Click assistance buttons to toggle (requires R&R Officer access)</span>
      </div>

      {/* Add Family Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowAdd(false)}>
          <div className="glass-modal w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-surface-200/70 mb-4">
              <h2 className="text-base font-bold text-surface-900">Register Affected Family</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-xl hover:bg-surface-100 text-surface-400 hover:text-surface-700 transition-colors"><X size={18} /></button>
            </div>
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Project *</label>
                <select
                  value={form.projectId}
                  onChange={e => {
                    const proj = projects.find(p => p.id === e.target.value);
                    setForm(f => ({ ...f, projectId: e.target.value, district: proj?.district || '', state: proj?.state || '' }));
                  }}
                  className="w-full h-10 px-3 rounded-xl glass-input text-sm"
                >
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">Head of Family *</label>
                  <input value={form.headOfFamily} onChange={e => setForm(f => ({ ...f, headOfFamily: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl glass-input text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">Village *</label>
                  <input value={form.village} onChange={e => setForm(f => ({ ...f, village: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl glass-input text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">Members</label>
                  <input type="number" value={form.members} onChange={e => setForm(f => ({ ...f, members: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl glass-input text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">Landholding (Ha)</label>
                  <input type="number" step="0.01" value={form.landholding} onChange={e => setForm(f => ({ ...f, landholding: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl glass-input text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">Comp. Eligibility (₹)</label>
                  <input type="number" value={form.compensationEligibility} onChange={e => setForm(f => ({ ...f, compensationEligibility: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl glass-input text-sm" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="isDisplaced" checked={form.isDisplaced} onChange={e => setForm(f => ({ ...f, isDisplaced: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 rounded border-surface-300" />
                  <label htmlFor="isDisplaced" className="text-sm font-medium text-surface-700">Displaced Family</label>
                </div>
              </div>
              <div className="bg-blue-50/70 border border-blue-200/50 rounded-xl p-3 text-xs text-blue-800 font-medium">
                This registers a synthetic demonstration family record. Contact details are auto-masked per privacy policy.
              </div>
            </div>
            <div className="flex gap-3 pt-5 mt-5 border-t border-surface-200/70">
              <button onClick={handleAddFamily} className="flex-1 h-10 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 shadow-sm transition-colors">
                Register Family
              </button>
              <button onClick={() => setShowAdd(false)} className="flex-1 h-10 glass-button-secondary text-sm font-semibold rounded-xl">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
