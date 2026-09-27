import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CheckCircle, Clock, AlertTriangle, Calendar, Plus, X, Target } from 'lucide-react';
import type { Milestone } from '../types';

const STATUS_COLOR: Record<string, string> = {
  'Completed': 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
  'In Progress': 'bg-blue-500/15 text-blue-800 border border-blue-500/30',
  'Overdue': 'bg-rose-500/15 text-rose-800 border border-rose-500/30',
  'Pending': 'bg-surface-100/80 text-surface-600 border border-surface-200/50',
  'Skipped': 'bg-surface-100/80 text-surface-400 border border-surface-200/50',
};

const STATUS_DOT: Record<string, string> = {
  'Completed': 'bg-emerald-500',
  'In Progress': 'bg-blue-500',
  'Overdue': 'bg-red-500',
  'Pending': 'bg-surface-300',
  'Skipped': 'bg-surface-200',
};

interface AddMilestoneForm {
  projectId: string;
  name: string;
  plannedDate: string;
  owner: string;
}

export default function MilestonesPage() {
  const store = useStore();
  const { user, permissions } = useAuth();
  const toast = useToast();

  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddMilestoneForm>({ projectId: '', name: '', plannedDate: '', owner: '' });

  const milestones = store.getMilestones();
  const projects = store.getProjects();

  const filtered = useMemo(() => {
    let items = milestones;
    if (projectFilter) items = items.filter(m => m.projectId === projectFilter);
    if (statusFilter) items = items.filter(m => m.status === statusFilter);
    return items;
  }, [milestones, projectFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: milestones.length,
    completed: milestones.filter(m => m.status === 'Completed').length,
    overdue: milestones.filter(m => m.status === 'Overdue').length,
    inProgress: milestones.filter(m => m.status === 'In Progress').length,
    pending: milestones.filter(m => m.status === 'Pending').length,
    avgDelay: (() => {
      const delayed = milestones.filter(m => m.delayDays > 0);
      return delayed.length > 0
        ? Math.round(delayed.reduce((s, m) => s + m.delayDays, 0) / delayed.length)
        : 0;
    })(),
  }), [milestones]);

  const adherencePct = stats.total > 0
    ? ((stats.completed / stats.total) * 100).toFixed(1)
    : '0';

  const grouped = useMemo(() => {
    const groups: Record<string, Milestone[]> = {};
    filtered.forEach(m => {
      const proj = projects.find(p => p.id === m.projectId);
      const key = proj?.name || m.projectId;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return Object.entries(groups).sort((a, b) => {
      const aOverdue = a[1].filter(m => m.status === 'Overdue').length;
      const bOverdue = b[1].filter(m => m.status === 'Overdue').length;
      return bOverdue - aOverdue;
    });
  }, [filtered, projects]);

  const handleComplete = (id: string) => {
    const ms = milestones.find(m => m.id === id);
    if (!ms || ms.status === 'Completed') return;
    store.updateMilestone(id, {
      status: 'Completed',
      actualDate: new Date().toISOString().split('T')[0],
      delayDays: 0,
    });
    store.addAuditEvent({
      timestamp: new Date().toISOString(),
      userId: user?.id || '', userName: user?.name || '', userRole: user?.role || 'State Authority',
      action: 'Milestone Completed', entityType: 'Milestone', entityId: id,
    });
    toast.success('Milestone marked as completed');
  };

  const handleStartProgress = (id: string) => {
    const ms = milestones.find(m => m.id === id);
    if (!ms || ms.status === 'In Progress' || ms.status === 'Completed') return;
    store.updateMilestone(id, { status: 'In Progress' });
    toast.info('Milestone set to In Progress');
  };

  const handleAddMilestone = () => {
    if (!form.projectId || !form.name || !form.plannedDate) {
      toast.error('Project, name, and planned date are required');
      return;
    }
    const proj = projects.find(p => p.id === form.projectId);
    const planned = new Date(form.plannedDate);
    const now = new Date();
    const delayDays = planned < now ? Math.floor((now.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    store.createMilestone({
      projectId: form.projectId,
      name: form.name,
      plannedDate: form.plannedDate,
      owner: form.owner || user?.name || proj?.responsibleAuthority || '',
      status: planned < now ? 'Overdue' : 'Pending',
      delayDays,
    });
    store.addAuditEvent({
      timestamp: new Date().toISOString(),
      userId: user?.id || '', userName: user?.name || '', userRole: user?.role || 'State Authority',
      action: 'Milestone Created', entityType: 'Milestone', entityId: 'new',
      details: `New milestone "${form.name}" added to project`,
    });
    toast.success(`Milestone "${form.name}" added`);
    setForm({ projectId: '', name: '', plannedDate: '', owner: '' });
    setShowAdd(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <Target size={22} className="text-primary-600" />
            Milestone & Timeline Monitoring
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">
            {stats.total} milestones across all projects
          </p>
        </div>
        {permissions?.canEditProject && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={16} /> Add Milestone
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'bg-white/80 border-surface-200/80 text-surface-800' },
          { label: 'Completed', value: stats.completed, color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800' },
          { label: 'In Progress', value: stats.inProgress, color: 'bg-blue-500/10 border-blue-500/20 text-blue-800' },
          { label: 'Overdue', value: stats.overdue, color: 'bg-rose-500/10 border-rose-500/20 text-rose-800' },
          { label: 'Pending', value: stats.pending, color: 'bg-surface-100/80 border-surface-200/80 text-surface-700' },
          { label: 'Avg Delay', value: `${stats.avgDelay}d`, color: 'bg-amber-500/10 border-amber-500/20 text-amber-800' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`glass-kpi ${color}`}>
            <p className="text-[10px] font-semibold opacity-75 uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold mt-1 tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* Overall adherence */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-surface-800">Timeline Adherence (Completion Rate)</span>
          <span className="text-sm font-bold text-primary-600">{adherencePct}%</span>
        </div>
        <div className="w-full h-3 bg-surface-200/60 rounded-full overflow-hidden p-0.5 border border-surface-200/50">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full transition-all duration-500 shadow-xs"
            style={{ width: `${adherencePct}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2.5">
          {Object.entries(STATUS_DOT).map(([status, dot]) => (
            <span key={status} className="flex items-center gap-1.5 text-[10px] font-medium text-surface-600">
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              {status} ({milestones.filter(m => m.status === status).length})
            </span>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
          className="h-9 px-3 rounded-xl glass-input text-sm max-w-xs">
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name.substring(0, 35)}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-xl glass-input text-sm">
          <option value="">All Status</option>
          {['Pending', 'In Progress', 'Completed', 'Overdue', 'Skipped'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Grouped Milestone Cards */}
      <div className="space-y-4">
        {grouped.length === 0 && (
          <p className="text-center text-surface-400 py-12">No milestones match the filters</p>
        )}
        {grouped.map(([projName, milestoneList]) => {
          const overdueCount = milestoneList.filter(m => m.status === 'Overdue').length;
          return (
            <div key={projName} className="glass-panel overflow-hidden">
              <div className={`px-4 py-3 border-b flex items-center justify-between ${overdueCount > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-surface-50/70 border-surface-200/60'}`}>
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 truncate max-w-xl">{projName}</h3>
                  <p className="text-[10px] text-surface-500 font-medium mt-0.5">
                    {milestoneList.filter(m => m.status === 'Completed').length}/{milestoneList.length} completed
                    {overdueCount > 0 && <span className="text-rose-600 font-semibold ml-2">• {overdueCount} overdue</span>}
                  </p>
                </div>
                {/* Mini progress */}
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-surface-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(milestoneList.filter(m => m.status === 'Completed').length / milestoneList.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-surface-600">
                    {Math.round((milestoneList.filter(m => m.status === 'Completed').length / milestoneList.length) * 100)}%
                  </span>
                </div>
              </div>

              <div className="p-3.5 space-y-2.5">
                {milestoneList.map((m, idx) => (
                  <div key={m.id} className="flex items-start gap-3">
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center pt-0.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                        m.status === 'Completed' ? 'bg-emerald-500 text-white' :
                        m.status === 'Overdue' ? 'bg-rose-500 text-white' :
                        m.status === 'In Progress' ? 'bg-blue-500 text-white' :
                        'bg-surface-200 text-surface-400'
                      }`}>
                        {m.status === 'Completed' ? <CheckCircle size={11} /> :
                         m.status === 'Overdue' ? <AlertTriangle size={11} /> :
                         m.status === 'In Progress' ? <Clock size={11} /> :
                         <span className="text-[8px] font-bold">{idx + 1}</span>}
                      </div>
                      {idx < milestoneList.length - 1 && (
                        <div className={`w-0.5 h-4 mt-1 ${m.status === 'Completed' ? 'bg-emerald-300' : 'bg-surface-200'}`} />
                      )}
                    </div>

                    {/* Milestone content */}
                    <div className={`flex-1 flex items-center justify-between gap-2 p-3 rounded-xl border min-w-0 transition-colors ${
                      m.status === 'Completed' ? 'bg-emerald-50/50 border-emerald-500/20' :
                      m.status === 'Overdue' ? 'bg-rose-50/50 border-rose-500/20' :
                      m.status === 'In Progress' ? 'bg-blue-50/50 border-blue-500/20' :
                      'bg-white/60 border-surface-200/60'
                    }`}>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold truncate ${m.status === 'Completed' ? 'text-emerald-900 line-through opacity-75' : 'text-surface-900'}`}>
                          {m.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-surface-500 flex items-center gap-1 font-medium">
                            <Calendar size={10} /> {m.plannedDate}
                          </span>
                          {m.actualDate && (
                            <span className="text-[10px] text-emerald-700 font-semibold">Done: {m.actualDate}</span>
                          )}
                          <span className="text-[10px] text-surface-400 font-medium">{m.owner}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {m.delayDays > 0 && (
                          <span className="text-[10px] text-rose-600 font-bold whitespace-nowrap bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">{m.delayDays}d late</span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${STATUS_COLOR[m.status]}`}>
                          {m.status}
                        </span>
                        {m.status !== 'Completed' && permissions?.canEditProject && (
                          <div className="flex gap-1.5">
                            {m.status === 'Pending' && (
                              <button
                                onClick={() => handleStartProgress(m.id)}
                                className="px-2.5 py-1 bg-blue-50 border border-blue-200/60 text-blue-700 text-[10px] rounded-lg hover:bg-blue-100 font-semibold transition-colors"
                              >Start</button>
                            )}
                            {(m.status === 'In Progress' || m.status === 'Overdue' || m.status === 'Pending') && (
                              <button
                                onClick={() => handleComplete(m.id)}
                                className="px-2.5 py-1 bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[10px] rounded-lg hover:bg-emerald-100 font-semibold transition-colors"
                              >Complete</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Milestone Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowAdd(false)}>
          <div className="glass-modal w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-surface-200/70 mb-4">
              <h2 className="text-base font-bold text-surface-900">Add Milestone</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-xl hover:bg-surface-100 text-surface-400 hover:text-surface-700 transition-colors"><X size={17} /></button>
            </div>
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Project *</label>
                <select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl glass-input text-sm">
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Milestone Name *</label>
                <input
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Award Declaration Complete"
                  className="w-full h-10 px-3 rounded-xl glass-input text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">Planned Date *</label>
                  <input type="date" value={form.plannedDate} onChange={e => setForm(f => ({ ...f, plannedDate: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl glass-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">Owner</label>
                  <input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                    placeholder={user?.name}
                    className="w-full h-10 px-3 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-5 mt-5 border-t border-surface-200/70">
              <button onClick={handleAddMilestone}
                className="flex-1 h-10 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 shadow-sm transition-colors">
                Add Milestone
              </button>
              <button onClick={() => setShowAdd(false)}
                className="flex-1 h-10 glass-button-secondary text-sm font-semibold rounded-xl">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
