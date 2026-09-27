import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Bell, Plus, Search, X, Edit3, Eye } from 'lucide-react';
import type { NotificationType } from '../types';

export default function NotificationsPage() {
  const store = useStore();
  const { user, permissions } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const notifications = store.getNotifications();
  const projects = store.getProjects();

  const filtered = useMemo(() => {
    let items = notifications;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(n => n.id.toLowerCase().includes(q) || projects.find(p => p.id === n.projectId)?.name.toLowerCase().includes(q));
    }
    if (typeFilter) items = items.filter(n => n.notificationType === typeFilter);
    return items;
  }, [notifications, search, typeFilter, projects]);

  const handlePublish = (id: string) => {
    const notif = notifications.find(n => n.id === id);
    if (!notif || notif.publicationStatus === 'Published') return;
    store.updateNotification(id, { publicationStatus: 'Published' });
    store.addAuditEvent({
      timestamp: new Date().toISOString(),
      userId: user?.id || '', userName: user?.name || '', userRole: user?.role || 'State Authority',
      action: 'Notification Published', entityType: 'Notification', entityId: id,
    });
    toast.success('Notification published');
  };

  const handleCreate = (form: any) => {
    store.createNotification({
      projectId: form.projectId,
      notificationType: form.notificationType,
      dateIssued: new Date().toISOString().split('T')[0],
      authority: user?.name || '',
      publicationStatus: 'Draft',
      effectiveDate: form.effectiveDate,
      remarks: form.remarks,
    });
    toast.success('Notification created');
    setShowCreate(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <Bell size={22} className="text-primary-600" />
            Statutory Gazette Notifications
          </h1>
          <p className="text-xs text-surface-500 mt-1">Section 11 preliminary notifications and Section 19 declarations ({filtered.length} notices)</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus size={14} /> Create Notification
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="glass-input w-full h-9 pl-9 pr-3 text-xs"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="glass-input h-9 px-3 text-xs"
        >
          <option value="">All Types</option>
          {['Preliminary (Section 11)','Final (Section 19)','Hearing Notice','Award Notice','Possession Notice','R&R Notice'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="glass-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="glass-table-header">
                {['ID','Project','Statutory Type','Date Issued','Competent Authority','Status','Actions'].map(h => (
                  <th key={h} className="px-3.5 py-3 text-left font-bold text-surface-700 uppercase tracking-wider text-[11px] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200/50">
              {filtered.slice(0, 30).map(n => {
                const proj = projects.find(p => p.id === n.projectId);
                return (
                  <tr key={n.id} className="hover:bg-white/60 transition-colors">
                    <td className="px-3.5 py-3 font-mono text-surface-500 font-semibold">{n.id}</td>
                    <td className="px-3.5 py-3 text-surface-900 font-semibold max-w-[240px] truncate">{proj?.name || n.projectId}</td>
                    <td className="px-3.5 py-3 text-surface-700 font-medium">{n.notificationType}</td>
                    <td className="px-3.5 py-3 text-surface-600 font-mono">{n.dateIssued}</td>
                    <td className="px-3.5 py-3 text-surface-700">{n.authority}</td>
                    <td className="px-3.5 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        n.publicationStatus === 'Published' ? 'bg-cyan-500/15 text-cyan-800 border border-cyan-500/30' :
                        n.publicationStatus === 'Draft' ? 'bg-amber-500/15 text-amber-800 border border-amber-500/30' :
                        'bg-surface-100 text-surface-600 border border-surface-200/60'
                      }`}>{n.publicationStatus}</span>
                    </td>
                    <td className="px-3.5 py-3">
                      {n.publicationStatus === 'Draft' && (
                        <button
                          onClick={() => handlePublish(n.id)}
                          className="px-2.5 py-1 bg-primary-100 text-primary-800 text-[10px] font-bold rounded-lg hover:bg-primary-200 transition-colors border border-primary-200/60"
                        >
                          Publish Gazette
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="glass-modal w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200/50 bg-white/40">
              <h3 className="text-sm font-bold text-surface-900">Issue Statutory Notification</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-white/60"><X size={16} /></button>
            </div>
            <CreateNotifForm projects={projects} onSubmit={handleCreate} />
          </div>
        </div>
      )}
    </div>
  );
}

function CreateNotifForm({ projects, onSubmit }: { projects: any[]; onSubmit: (f: any) => void }) {
  const [form, setForm] = useState({ projectId: projects[0]?.id || '', notificationType: 'Preliminary (Section 11)' as NotificationType, effectiveDate: '', remarks: '' });
  return (
    <div className="p-5 space-y-3.5 text-xs">
      <div>
        <label className="block text-xs font-semibold text-surface-700 mb-1">Target Project *</label>
        <select className="glass-input w-full h-9 px-3 text-xs" value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-surface-700 mb-1">Statutory Notification Type *</label>
        <select className="glass-input w-full h-9 px-3 text-xs" value={form.notificationType} onChange={e => setForm(f => ({ ...f, notificationType: e.target.value as NotificationType }))}>
          {['Preliminary (Section 11)','Final (Section 19)','Hearing Notice','Award Notice','Possession Notice','R&R Notice'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-surface-700 mb-1">Effective Date *</label>
        <input type="date" className="glass-input w-full h-9 px-3 text-xs" value={form.effectiveDate} onChange={e => setForm(f => ({ ...f, effectiveDate: e.target.value }))} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-surface-700 mb-1">Remarks / Gazette Dispatch Reference</label>
        <textarea
          className="glass-input w-full p-2.5 text-xs min-h-[60px]"
          value={form.remarks}
          onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
          placeholder="Gazette notification order number and dispatch notes..."
        />
      </div>
      <button
        onClick={() => onSubmit(form)}
        className="w-full py-2.5 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
      >
        Issue Notification
      </button>
    </div>
  );
}
