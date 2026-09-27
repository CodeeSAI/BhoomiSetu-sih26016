import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Home, Users, Search, BarChart3, CheckCircle } from 'lucide-react';

export default function RRPage() {
  const store = useStore();
  const { user, permissions } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const families = store.getFamilies();
  const displaced = families.filter(f => f.isDisplaced);

  const filtered = useMemo(() => {
    let items = families;
    if (search) { const q = search.toLowerCase(); items = items.filter(f => f.headOfFamily.toLowerCase().includes(q) || f.id.toLowerCase().includes(q)); }
    if (statusFilter) items = items.filter(f => f.rrStatus === statusFilter);
    return items;
  }, [families, search, statusFilter]);

  const stats = useMemo(() => ({
    total: families.length,
    displaced: displaced.length,
    rrCompleted: families.filter(f => f.rrStatus === 'Completed').length,
    housing: families.filter(f => f.housingAssistance).length,
    livelihood: families.filter(f => f.livelihoodAssistance).length,
    relocated: families.filter(f => f.relocationCompleted).length,
  }), [families, displaced]);

  const handleUpdateRR = (id: string, status: string) => {
    const fam = families.find(f => f.id === id);
    if (!fam || fam.rrStatus === status) return;
    store.updateFamily(id, { rrStatus: status as any });
    store.addAuditEvent({ timestamp: new Date().toISOString(), userId: user?.id || '', userName: user?.name || '', userRole: user?.role || 'R&R Officer', action: 'R&R Status Changed', entityType: 'Family', entityId: id, newValue: status });
    toast.success(`R&R status updated to ${status}`);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <Home size={22} className="text-primary-600" />
            Rehabilitation & Resettlement (R&R)
          </h1>
          <p className="text-xs text-surface-500 mt-1">Schedules II & III compliance, displacement mitigation and entitlement tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="glass-kpi border-l-4 border-l-indigo-500">
          <p className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">Total Families</p>
          <p className="text-lg font-bold text-surface-900 mt-1">{stats.total}</p>
        </div>
        <div className="glass-kpi border-l-4 border-l-rose-500">
          <p className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">Displaced</p>
          <p className="text-lg font-bold text-surface-900 mt-1">{stats.displaced}</p>
        </div>
        <div className="glass-kpi border-l-4 border-l-teal-500">
          <p className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">R&R Completed</p>
          <p className="text-lg font-bold text-surface-900 mt-1">{stats.rrCompleted}</p>
        </div>
        <div className="glass-kpi border-l-4 border-l-violet-500">
          <p className="text-[10px] uppercase font-bold text-violet-700 tracking-wider">Housing Given</p>
          <p className="text-lg font-bold text-surface-900 mt-1">{stats.housing}</p>
        </div>
        <div className="glass-kpi border-l-4 border-l-indigo-600">
          <p className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider">Livelihood</p>
          <p className="text-lg font-bold text-surface-900 mt-1">{stats.livelihood}</p>
        </div>
        <div className="glass-kpi border-l-4 border-l-teal-600">
          <p className="text-[10px] uppercase font-bold text-teal-800 tracking-wider">Relocated</p>
          <p className="text-lg font-bold text-surface-900 mt-1">{stats.relocated}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-surface-700 uppercase tracking-wider">R&R Completion Progress</span>
          <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50/80 px-2.5 py-0.5 rounded-lg border border-teal-200/50">
            {stats.total > 0 ? ((stats.rrCompleted / stats.total) * 100).toFixed(1) : 0}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-surface-200/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 via-indigo-500 to-violet-500 rounded-full transition-all"
            style={{ width: `${stats.total > 0 ? (stats.rrCompleted / stats.total) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search families..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="glass-input w-full h-9 pl-9 pr-3 text-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="glass-input h-9 px-3 text-xs"
        >
          <option value="">All R&R Status</option>
          {['Not Started','In Progress','Partial','Completed','Pending Verification'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="glass-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="glass-table-header">
                {['ID','Family Head','Village','Members','Displaced','Housing','Livelihood','R&R Status','Actions'].map(h => (
                  <th key={h} className="px-3.5 py-3 text-left font-bold text-surface-700 uppercase tracking-wider text-[11px] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200/50">
              {filtered.slice(0, 30).map(f => (
                <tr key={f.id} className="hover:bg-white/60 transition-colors">
                  <td className="px-3.5 py-3 font-mono text-surface-500 font-semibold">{f.id}</td>
                  <td className="px-3.5 py-3 text-surface-900 font-semibold">{f.headOfFamily}</td>
                  <td className="px-3.5 py-3 text-surface-700">{f.village}, {f.district}</td>
                  <td className="px-3.5 py-3 text-surface-700 font-medium">{f.members}</td>
                  <td className="px-3.5 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${f.isDisplaced ? 'bg-rose-500/15 text-rose-800 border border-rose-500/30' : 'bg-surface-100 text-surface-600'}`}>
                      {f.isDisplaced ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-3.5 py-3">{f.housingAssistance ? <CheckCircle size={15} className="text-teal-600" /> : <span className="text-surface-300">—</span>}</td>
                  <td className="px-3.5 py-3">{f.livelihoodAssistance ? <CheckCircle size={15} className="text-indigo-600" /> : <span className="text-surface-300">—</span>}</td>
                  <td className="px-3.5 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      f.rrStatus === 'Completed' ? 'bg-teal-500/15 text-teal-800 border border-teal-500/30' :
                      f.rrStatus === 'In Progress' ? 'bg-violet-500/15 text-violet-800 border border-violet-500/30' :
                      f.rrStatus === 'Partial' ? 'bg-indigo-500/15 text-indigo-800 border border-indigo-500/30' :
                      'bg-surface-100 text-surface-700 border border-surface-200/50'
                    }`}>
                      {f.rrStatus}
                    </span>
                  </td>
                  <td className="px-3.5 py-3">
                    {permissions?.canManageRR && f.rrStatus !== 'Completed' && (
                      <select
                        onChange={e => handleUpdateRR(f.id, e.target.value)}
                        value=""
                        className="glass-input h-7 px-2 text-[10px] font-medium"
                      >
                        <option value="" disabled>Update</option>
                        {['In Progress','Partial','Completed','Pending Verification'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
