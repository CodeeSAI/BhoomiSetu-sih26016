import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AlertTriangle, Check, Clock, Eye, Search, Bell } from 'lucide-react';

export default function AlertsPage() {
  const store = useStore();
  const { user, permissions } = useAuth();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState('Active');
  const [severityFilter, setSeverityFilter] = useState('');
  const alerts = store.getAlerts();
  const projects = store.getProjects();

  const filtered = useMemo(() => {
    let items = alerts;
    if (statusFilter) items = items.filter(a => a.status === statusFilter);
    if (severityFilter) items = items.filter(a => a.severity === severityFilter);
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [alerts, statusFilter, severityFilter]);

  const handleAcknowledge = (id: string) => {
    const a = alerts.find(x => x.id === id);
    if (!a || a.status !== 'Active') return;
    store.updateAlert(id, { status: 'Acknowledged' });
    toast.info('Alert acknowledged');
  };

  const handleResolve = (id: string) => {
    const a = alerts.find(x => x.id === id);
    if (!a || a.status === 'Resolved') return;
    store.updateAlert(id, { status: 'Resolved', resolvedAt: new Date().toISOString(), resolvedBy: user?.name || '' });
    store.addAuditEvent({ timestamp: new Date().toISOString(), userId: user?.id || '', userName: user?.name || '', userRole: user?.role || 'State Authority', action: 'Alert Resolved', entityType: 'Alert', entityId: id });
    toast.success('Alert resolved');
  };

  const handleSnooze = (id: string) => {
    const a = alerts.find(x => x.id === id);
    if (!a || a.status === 'Resolved') return;
    const d = new Date(); d.setHours(d.getHours() + 24);
    store.updateAlert(id, { status: 'Snoozed', snoozedUntil: d.toISOString() });
    toast.info('Alert snoozed for 24 hours');
  };

  const sevColors: Record<string, string> = {
    Critical: 'bg-rose-500/15 text-rose-800 border-rose-500/30',
    Urgent: 'bg-coral-500/15 text-red-800 border-red-500/30',
    Warning: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
    Info: 'bg-blue-500/15 text-blue-800 border-blue-500/30'
  };
  const sevIcons: Record<string, string> = { Critical: 'text-rose-600', Urgent: 'text-red-500', Warning: 'text-amber-500', Info: 'text-blue-500' };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <Bell size={22} className="text-primary-600" />
            Alerts & Statutory Action Items
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            Automated compliance monitors, milestone flags, and statutory deadline alerts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-kpi border-l-4 border-l-rose-500"><p className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">Critical/Urgent</p><p className="text-xl font-bold mt-1 text-rose-900">{alerts.filter(a => (a.severity === 'Critical' || a.severity === 'Urgent') && a.status === 'Active').length}</p></div>
        <div className="glass-kpi border-l-4 border-l-amber-500"><p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Active Warnings</p><p className="text-xl font-bold mt-1 text-amber-900">{alerts.filter(a => a.severity === 'Warning' && a.status === 'Active').length}</p></div>
        <div className="glass-kpi border-l-4 border-l-indigo-500"><p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700">Acknowledged</p><p className="text-xl font-bold mt-1 text-indigo-900">{alerts.filter(a => a.status === 'Acknowledged').length}</p></div>
        <div className="glass-kpi border-l-4 border-l-emerald-500"><p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Resolved</p><p className="text-xl font-bold mt-1 text-emerald-900">{alerts.filter(a => a.status === 'Resolved').length}</p></div>
      </div>
      <div className="flex gap-2">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 rounded-xl glass-input text-xs">
          <option value="">All Status</option>{['Active','Acknowledged','Resolved','Snoozed'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="h-9 px-3 rounded-xl glass-input text-xs">
          <option value="">All Severity</option>{['Critical','Urgent','Warning','Info'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="space-y-3">
        {filtered.map(alert => {
          const proj = projects.find(p => p.id === alert.projectId);
          return (
            <div key={alert.id} className={`glass-panel p-4 transition-all duration-200 ${
              alert.severity === 'Critical' || alert.severity === 'Urgent' ? 'border-rose-500/30 bg-rose-500/5' :
              alert.severity === 'Warning' ? 'border-amber-500/30 bg-amber-500/5' : 'border-surface-200/70'
            }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className={`mt-0.5 shrink-0 ${sevIcons[alert.severity]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-surface-900">{alert.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${sevColors[alert.severity]}`}>{alert.severity}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                      alert.status === 'Active' ? 'bg-rose-500/15 text-rose-800 border-rose-500/30' :
                      alert.status === 'Acknowledged' ? 'bg-indigo-500/15 text-indigo-800 border-indigo-500/30' :
                      alert.status === 'Resolved' ? 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30' :
                      'bg-surface-100 text-surface-600 border-surface-200'
                    }`}>{alert.status}</span>
                  </div>
                  <p className="text-xs text-surface-700 font-medium mt-1">{alert.reason}</p>
                  {proj && <p className="text-[10px] text-surface-500 font-medium mt-0.5">Project: {proj.name}</p>}
                  {alert.responsibleOfficer && <p className="text-[10px] text-surface-500 font-medium">Assigned: {alert.responsibleOfficer}</p>}
                  <div className="bg-blue-50/70 border border-blue-200/50 rounded-lg p-2.5 mt-2.5"><p className="text-[10px] text-blue-800 font-medium">Recommended: {alert.recommendedAction}</p></div>
                  <p className="text-[10px] text-surface-400 mt-1.5">{new Date(alert.timestamp).toLocaleString('en-IN')}</p>
                </div>
                {alert.status === 'Active' && (
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => handleAcknowledge(alert.id)} className="px-2.5 py-1 bg-blue-50 border border-blue-200/60 text-blue-700 text-[10px] rounded-lg hover:bg-blue-100 font-semibold transition-colors flex items-center gap-1" title="Acknowledge"><Eye size={11} /> Ack</button>
                    <button onClick={() => handleResolve(alert.id)} className="px-2.5 py-1 bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[10px] rounded-lg hover:bg-emerald-100 font-semibold transition-colors flex items-center gap-1" title="Resolve"><Check size={11} /> Resolve</button>
                    <button onClick={() => handleSnooze(alert.id)} className="px-2.5 py-1 glass-button-secondary text-[10px] rounded-lg font-semibold flex items-center gap-1" title="Snooze"><Clock size={11} /> Snooze</button>
                  </div>
                )}
                {alert.status === 'Acknowledged' && (
                  <button onClick={() => handleResolve(alert.id)} className="px-3 py-1 bg-emerald-600 text-white text-[10px] rounded-lg hover:bg-emerald-700 font-semibold shadow-xs shrink-0 transition-colors">Resolve</button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-sm text-surface-400 py-10">No alerts matching filters</p>}
      </div>
    </div>
  );
}
