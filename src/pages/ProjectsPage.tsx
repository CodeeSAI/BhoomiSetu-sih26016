import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Search, Filter, ChevronDown, ArrowUpDown, Eye, Edit3,
  Archive, MoreVertical, MapPin, Calendar, TrendingUp, ChevronLeft, ChevronRight,
  X
} from 'lucide-react';
import type { Project, ProjectType, ProjectStatus, Priority, RiskLevel, WorkflowStage } from '../types';

const STATUS_BADGE: Record<ProjectStatus, string> = {
  'On Track': 'bg-emerald-100 text-emerald-700',
  'Delayed': 'bg-amber-100 text-amber-700',
  'Critical': 'bg-red-100 text-red-700',
  'Completed': 'bg-blue-100 text-blue-700',
  'Under Review': 'bg-violet-100 text-violet-700',
  'Pending Approval': 'bg-purple-100 text-purple-700',
  'Archived': 'bg-surface-100 text-surface-600',
};

const RISK_BADGE: Record<RiskLevel, string> = {
  'Low': 'bg-emerald-100 text-emerald-700',
  'Medium': 'bg-amber-100 text-amber-700',
  'High': 'bg-orange-100 text-orange-700',
  'Critical': 'bg-red-100 text-red-700',
};

export default function ProjectsPage() {
  const store = useStore();
  const { user, permissions } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [stateFilter, setStateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortKey, setSortKey] = useState<keyof Project>('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const pageSize = 12;

  const projects = store.getProjects();
  const states = useMemo(() => [...new Set(projects.map(p => p.state))].sort(), [projects]);

  const filtered = useMemo(() => {
    let items = [...projects];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.state.toLowerCase().includes(q) || p.district.toLowerCase().includes(q));
    }
    if (statusFilter) items = items.filter(p => p.status === statusFilter);
    if (stateFilter) items = items.filter(p => p.state === stateFilter);
    if (typeFilter) items = items.filter(p => p.projectType === typeFilter);
    items.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return 0;
    });
    return items;
  }, [projects, search, statusFilter, stateFilter, typeFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: keyof Project) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900">Projects</h1>
          <p className="text-sm text-surface-500">{filtered.length} projects found</p>
        </div>
        {permissions?.canCreateProject && (
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input type="text" placeholder="Search projects..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-4 rounded-lg glass-input text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg glass-input text-xs text-surface-700">
          <option value="">All Status</option>
          {['On Track','Delayed','Critical','Completed','Under Review','Pending Approval'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={stateFilter} onChange={e => { setStateFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg glass-input text-xs text-surface-700">
          <option value="">All States</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg glass-input text-xs text-surface-700">
          <option value="">All Types</option>
          {['Highway','Railway','Industrial','Township','Dam/Irrigation','Airport','Defense','Smart City','Solar Park','Other'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="glass-table-header">
                {[
                  { key: 'id', label: 'ID' },
                  { key: 'name', label: 'Project Name' },
                  { key: 'state', label: 'State' },
                  { key: 'projectType', label: 'Type' },
                  { key: 'landProposed', label: 'Proposed (Ha)' },
                  { key: 'landAcquired', label: 'Acquired (Ha)' },
                  { key: 'currentStage', label: 'Stage' },
                  { key: 'status', label: 'Status' },
                  { key: 'riskLevel', label: 'Risk' },
                ].map(col => (
                  <th key={col.key} onClick={() => toggleSort(col.key as keyof Project)}
                    className="px-3 py-2.5 text-left text-xs font-semibold text-surface-700 cursor-pointer hover:bg-surface-200/50 whitespace-nowrap select-none">
                    <span className="inline-flex items-center gap-1">{col.label} <ArrowUpDown size={10} className="text-surface-400" /></span>
                  </th>
                ))}
                <th className="px-3 py-2.5 text-xs font-semibold text-surface-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200/70">
              {paged.map(proj => {
                const progressNum = proj.landProposed > 0 ? (proj.landAcquired / proj.landProposed) * 100 : 0;
                const progress = progressNum.toFixed(0);
                return (
                  <tr key={proj.id} className="border-b border-surface-200/50 hover:bg-blue-50/20 transition-all duration-150 group">
                    <td className="px-3.5 py-3 text-xs font-mono font-medium text-surface-500 whitespace-nowrap">{proj.id}</td>
                    <td className="px-3.5 py-3">
                      <button onClick={() => navigate(`/projects/${proj.id}`)} className="text-primary-700 hover:text-primary-900 font-bold text-xs text-left truncate max-w-[220px] block transition-colors cursor-pointer">
                        {proj.name}
                      </button>
                      <p className="text-[10px] text-surface-400 font-medium mt-0.5">{proj.district}, {proj.state}</p>
                    </td>
                    <td className="px-3.5 py-3 text-xs text-surface-700 font-medium whitespace-nowrap">{proj.state}</td>
                    <td className="px-3.5 py-3 text-xs text-surface-600 whitespace-nowrap">{proj.projectType}</td>
                    <td className="px-3.5 py-3 text-xs text-surface-800 font-semibold whitespace-nowrap">{proj.landProposed.toFixed(1)} Ha</td>
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-surface-200/80 rounded-full overflow-hidden p-0.5 border border-surface-200/60">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              progressNum >= 100 ? 'bg-gradient-to-r from-teal-500 to-emerald-500' :
                              progressNum > 50 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                              'bg-gradient-to-r from-amber-500 to-primary-500'
                            }`}
                            style={{ width: `${Math.min(100, progressNum)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-surface-700">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 text-[10px] font-medium text-surface-600 whitespace-nowrap max-w-[130px] truncate">{proj.currentStage}</td>
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${STATUS_BADGE[proj.status] || 'bg-surface-100 text-surface-700 border-surface-200'}`}>
                        {proj.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        proj.riskLevel === 'Low' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        proj.riskLevel === 'Medium' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        proj.riskLevel === 'High' ? 'bg-orange-50 text-orange-800 border-orange-200' :
                        'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {proj.riskLevel} Risk
                      </span>
                    </td>
                    <td className="px-3.5 py-3">
                      <button onClick={() => navigate(`/projects/${proj.id}`)}
                        className="p-1.5 rounded-xl hover:bg-primary-50 text-surface-400 hover:text-primary-700 transition-colors cursor-pointer"
                        title="View Project Workspace">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200">
          <p className="text-xs text-surface-500">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-surface-100 disabled:opacity-30 text-surface-600">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium ${p === page ? 'bg-primary-600 text-white' : 'hover:bg-surface-100 text-surface-600'}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-surface-100 disabled:opacity-30 text-surface-600">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const store = useStore();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', requiringBody: '', projectType: 'Highway' as ProjectType,
    state: 'Karnataka', district: '', description: '', landProposed: '',
    targetStartDate: '', targetCompletionDate: '', responsibleAuthority: '', priority: 'Normal' as Priority,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const states = ['Karnataka', 'Maharashtra', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Tamil Nadu', 'Telangana', 'Madhya Pradesh', 'Assam', 'Delhi NCR'];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Project name is required';
    if (!form.requiringBody.trim()) e.requiringBody = 'Requiring body is required';
    if (!form.district.trim()) e.district = 'District is required';
    if (!form.landProposed || Number(form.landProposed) <= 0) e.landProposed = 'Valid land area required';
    if (!form.targetCompletionDate) e.targetCompletionDate = 'Target date required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const project = store.createProject({
      name: form.name,
      requiringBody: form.requiringBody,
      projectType: form.projectType,
      state: form.state,
      district: form.district,
      description: form.description,
      landProposed: Number(form.landProposed),
      landAcquired: 0,
      landNotified: 0,
      currentStage: 'Proposal Draft',
      status: 'Under Review',
      priority: form.priority,
      riskLevel: 'Low',
      targetStartDate: form.targetStartDate || new Date().toISOString().split('T')[0],
      targetCompletionDate: form.targetCompletionDate,
      responsibleAuthority: form.responsibleAuthority || user?.name || '',
      createdBy: user?.name || '',
    });
    store.addAuditEvent({
      timestamp: new Date().toISOString(),
      userId: user?.id || '',
      userName: user?.name || '',
      userRole: user?.role || 'National Administrator',
      action: 'Project Created',
      entityType: 'Project',
      entityId: project.id,
      entityName: project.name,
      details: `New project "${project.name}" created in ${project.district}, ${project.state}`,
    });
    toast.success(`Project "${project.name}" created successfully`);
    onClose();
    navigate(`/projects/${project.id}`);
  };

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-medium text-surface-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );

  const inputClass = "w-full h-9 px-3 rounded-lg glass-input text-sm text-surface-900 focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-modal shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
          <h2 className="text-lg font-bold text-surface-900">Create New Project</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 cursor-pointer"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Project Name *" error={errors.name}>
              <input className={inputClass} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Requiring Body *" error={errors.requiringBody}>
              <input className={inputClass} value={form.requiringBody} onChange={e => setForm(f => ({ ...f, requiringBody: e.target.value }))} />
            </Field>
            <Field label="Project Type">
              <select className={inputClass} value={form.projectType} onChange={e => setForm(f => ({ ...f, projectType: e.target.value as ProjectType }))}>
                {['Highway','Railway','Industrial','Township','Dam/Irrigation','Airport','Defense','Smart City','Solar Park','Other'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select className={inputClass} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}>
                {['Low','Normal','High','Urgent'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="State">
              <select className={inputClass} value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="District *" error={errors.district}>
              <input className={inputClass} value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
            </Field>
            <Field label="Land Proposed (Hectares) *" error={errors.landProposed}>
              <input type="number" className={inputClass} value={form.landProposed} onChange={e => setForm(f => ({ ...f, landProposed: e.target.value }))} />
            </Field>
            <Field label="Target Completion *" error={errors.targetCompletionDate}>
              <input type="date" className={inputClass} value={form.targetCompletionDate} onChange={e => setForm(f => ({ ...f, targetCompletionDate: e.target.value }))} />
            </Field>
          </div>
          <Field label="Description">
            <textarea className="w-full px-3 py-2 rounded-lg bg-white border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 min-h-[60px]"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </Field>
          <Field label="Responsible Authority">
            <input className={inputClass} value={form.responsibleAuthority} onChange={e => setForm(f => ({ ...f, responsibleAuthority: e.target.value }))} />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-surface-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-surface-600 hover:bg-surface-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">Create Project</button>
        </div>
      </div>
    </div>
  );
}
