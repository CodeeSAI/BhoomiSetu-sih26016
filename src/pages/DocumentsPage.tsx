import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FileText, Search, Upload, Trash2, Check, X } from 'lucide-react';
import type { DocumentCategory } from '../types';

export default function DocumentsPage() {
  const store = useStore();
  const { user, permissions } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const documents = store.getDocuments();

  const filtered = useMemo(() => {
    let items = documents;
    if (search) { const q = search.toLowerCase(); items = items.filter(d => d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)); }
    if (catFilter) items = items.filter(d => d.category === catFilter);
    return items;
  }, [documents, search, catFilter]);

  const categories: DocumentCategory[] = ['Land Records','Notifications','Awards','Compensation','Legal','Survey','R&R','Maps','Other'];
  
  const CAT_STYLES: Record<string, { iconBg: string, iconColor: string, badge: string }> = {
    'Land Records': { iconBg: 'bg-teal-500/15 border-teal-500/30', iconColor: 'text-teal-600', badge: 'bg-teal-500/10 text-teal-800 border-teal-500/30' },
    'Notifications': { iconBg: 'bg-blue-500/15 border-blue-500/30', iconColor: 'text-blue-600', badge: 'bg-blue-500/10 text-blue-800 border-blue-500/30' },
    'Awards': { iconBg: 'bg-violet-500/15 border-violet-500/30', iconColor: 'text-violet-600', badge: 'bg-violet-500/10 text-violet-800 border-violet-500/30' },
    'Compensation': { iconBg: 'bg-emerald-500/15 border-emerald-500/30', iconColor: 'text-emerald-600', badge: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30' },
    'Legal': { iconBg: 'bg-rose-500/15 border-rose-500/30', iconColor: 'text-rose-600', badge: 'bg-rose-500/10 text-rose-800 border-rose-500/30' },
    'Survey': { iconBg: 'bg-cyan-500/15 border-cyan-500/30', iconColor: 'text-cyan-600', badge: 'bg-cyan-500/10 text-cyan-800 border-cyan-500/30' },
    'R&R': { iconBg: 'bg-indigo-500/15 border-indigo-500/30', iconColor: 'text-indigo-600', badge: 'bg-indigo-500/10 text-indigo-800 border-indigo-500/30' },
    'Maps': { iconBg: 'bg-teal-500/15 border-teal-500/30', iconColor: 'text-teal-600', badge: 'bg-teal-500/10 text-teal-800 border-teal-500/30' },
  };

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach(d => { counts[d.category] = (counts[d.category] || 0) + 1; });
    return counts;
  }, [documents]);

  const handleVerify = (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (!doc || doc.verificationState === 'Verified') return;
    store.updateDocument(id, { verificationState: 'Verified' });
    store.addAuditEvent({ timestamp: new Date().toISOString(), userId: user?.id || '', userName: user?.name || '', userRole: user?.role || 'State Authority', action: 'Document Verified', entityType: 'Document', entityId: id });
    toast.success('Document verified');
  };

  const handleDelete = (id: string) => {
    store.deleteDocument(id);
    store.addAuditEvent({ timestamp: new Date().toISOString(), userId: user?.id || '', userName: user?.name || '', userRole: user?.role || 'State Authority', action: 'Document Deleted', entityType: 'Document', entityId: id });
    toast.success('Document deleted');
  };

  const handleUpload = (name: string, category: DocumentCategory, projectId: string) => {
    store.createDocument({
      name, category, projectId: projectId || undefined,
      version: 1, uploadedBy: user?.name || '', uploadedAt: new Date().toISOString(),
      fileSize: Math.floor(Math.random() * 5000000), mimeType: 'application/pdf',
      verificationState: 'Pending', remarks: '', tags: [category],
    });
    store.addAuditEvent({ timestamp: new Date().toISOString(), userId: user?.id || '', userName: user?.name || '', userRole: user?.role || 'State Authority', action: 'Document Uploaded', entityType: 'Document', entityId: 'new', details: `Uploaded: ${name}` });
    toast.success('Document uploaded');
    setShowUpload(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <FileText size={22} className="text-primary-600" />
            Digital Document Repository
          </h1>
          <p className="text-xs text-surface-500 mt-1">Section 11/19 notifications, awards, claims and geo-tagged site proofs</p>
        </div>
        {permissions?.canManageDocuments && (
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Upload size={14} /> Upload Document
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => setCatFilter('')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            !catFilter
              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-sm ring-2 ring-primary-500/20'
              : 'glass-card text-surface-600 hover:text-surface-900 hover:bg-white/80'
          }`}
        >
          All ({documents.length})
        </button>
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              catFilter === c
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-sm ring-2 ring-primary-500/20'
                : 'glass-card text-surface-600 hover:text-surface-900 hover:bg-white/80'
            }`}
          >
            {c} ({catCounts[c] || 0})
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
        <input
          type="text"
          placeholder="Search documents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="glass-input w-full h-9 pl-9 pr-3 text-xs"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.slice(0, 30).map(d => {
          const style = CAT_STYLES[d.category] || { iconBg: 'bg-primary-500/15 border-primary-500/30', iconColor: 'text-primary-600', badge: 'bg-primary-500/10 text-primary-800 border-primary-500/30' };

          return (
            <div key={d.id} className="glass-panel p-4 hover:border-primary-400/40 hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${style.iconBg}`}>
                  <FileText size={18} className={style.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-surface-900 truncate">{d.name}</p>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-200/80 text-surface-700 shrink-0">
                      v{d.version}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${style.badge}`}>
                      {d.category}
                    </span>
                    <span className="text-[10px] text-surface-400 font-mono">
                      {(d.fileSize / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <p className="text-[10px] text-surface-400 mt-1">{d.uploadedBy} • {new Date(d.uploadedAt).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-200/40">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  d.verificationState === 'Verified' ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30' :
                  d.verificationState === 'Rejected' ? 'bg-rose-500/15 text-rose-800 border border-rose-500/30' :
                  'bg-amber-500/15 text-amber-800 border border-amber-500/30'
                }`}>{d.verificationState}</span>
                <div className="flex gap-1.5">
                  {d.verificationState !== 'Verified' && permissions?.canManageDocuments && (
                    <button onClick={() => handleVerify(d.id)} className="p-1.5 rounded-lg hover:bg-emerald-100/70 text-emerald-700 transition-colors" title="Verify Document"><Check size={13} /></button>
                  )}
                  {permissions?.canManageDocuments && (
                    <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-red-100/70 text-red-600 transition-colors" title="Delete Document"><Trash2 size={13} /></button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showUpload && <UploadModal projects={store.getProjects()} categories={categories} onUpload={handleUpload} onClose={() => setShowUpload(false)} />}
    </div>
  );
}

function UploadModal({ projects, categories, onUpload, onClose }: { projects: any[]; categories: string[]; onUpload: (n: string, c: any, p: string) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [cat, setCat] = useState(categories[0]);
  const [proj, setProj] = useState(projects[0]?.id || '');
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-modal w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200/50 bg-white/40">
          <h3 className="text-sm font-bold text-surface-900">Upload Statutory Document</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-white/60"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3 text-xs">
          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">Document Name *</label>
            <input className="glass-input w-full h-9 px-3 text-xs" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Section 11 Preliminary Notification" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">Category</label>
            <select className="glass-input w-full h-9 px-3 text-xs" value={cat} onChange={e => setCat(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">Associated Project</label>
            <select className="glass-input w-full h-9 px-3 text-xs" value={proj} onChange={e => setProj(e.target.value)}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="border-2 border-dashed border-primary-300/60 rounded-xl p-6 text-center glass-card">
            <Upload size={24} className="mx-auto text-primary-500 mb-2" />
            <p className="text-xs font-semibold text-surface-700">Digital document metadata will be recorded</p>
            <p className="text-[10px] text-surface-500 mt-1">DPDP Act compliant metadata with SHA-256 fingerprint support</p>
          </div>
          <button
            onClick={() => name && onUpload(name, cat, proj)}
            disabled={!name}
            className="w-full py-2.5 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-40"
          >
            Upload Document
          </button>
        </div>
      </div>
    </div>
  );
}
