// ============================================================
// BhoomiSetu - System Settings & GovTech Preferences
// Privacy-by-design & GIGW 3.0 / WCAG 2.1 AA Accessibility (Sections H & I)
// ============================================================
import React, { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Settings, Database, RefreshCw, Download, Trash2, Shield, Info, Bell,
  Moon, Globe, Save, Lock, EyeOff, Accessibility, Type, Contrast, ZapOff, Check
} from 'lucide-react';

export default function SettingsPage() {
  const store = useStore();
  const { user } = useAuth();
  const toast = useToast();

  const [confirmReset, setConfirmReset] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [language, setLanguage] = useState('en');
  const [saved, setSaved] = useState(false);

  // Accessibility Settings (Section I)
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>(() => {
    return (localStorage.getItem('bhoomi_font_size') as any) || 'normal';
  });
  const [contrastMode, setContrastMode] = useState<'standard' | 'high-contrast'>(() => {
    return (localStorage.getItem('bhoomi_contrast') as any) || 'standard';
  });
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    return localStorage.getItem('bhoomi_reduced_motion') === 'true';
  });

  // Apply Accessibility Preferences to DOM
  useEffect(() => {
    const root = document.documentElement;
    // Font scale
    root.classList.remove('text-scale-large', 'text-scale-xlarge');
    if (fontSize === 'large') root.classList.add('text-scale-large');
    if (fontSize === 'xlarge') root.classList.add('text-scale-xlarge');
    localStorage.setItem('bhoomi_font_size', fontSize);

    // Contrast
    root.classList.remove('theme-high-contrast');
    if (contrastMode === 'high-contrast') root.classList.add('theme-high-contrast');
    localStorage.setItem('bhoomi_contrast', contrastMode);

    // Reduced motion
    root.classList.remove('motion-reduced');
    if (reducedMotion) root.classList.add('motion-reduced');
    localStorage.setItem('bhoomi_reduced_motion', String(reducedMotion));
  }, [fontSize, contrastMode, reducedMotion]);

  const handleResetData = () => {
    store.resetData();
    setConfirmReset(false);
    toast.success('Demo data has been reset to default state');
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleExportAll = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      exportedBy: user?.name,
      note: 'BhoomiSetu SIH26016 — Synthetic demonstration data only. Not real government data.',
      projects: store.getProjects(),
      parcels: store.getParcels(),
      families: store.getFamilies(),
      compensation: store.getCompensation(),
      awards: store.getAwards(),
      notifications: store.getNotifications(),
      milestones: store.getMilestones(),
      possession: store.getPossession(),
      alerts: store.getAlerts(),
      documents: store.getDocuments(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bhoomisetu_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const handleSavePreferences = () => {
    setSaved(true);
    toast.success('Accessibility and user preferences saved');
    setTimeout(() => setSaved(false), 2000);
  };

  const kpis = store.getKPIs();

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-5">
        <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
          <Settings size={22} className="text-primary-600" />
          System Settings & Platform Governance
        </h1>
        <p className="text-xs text-surface-500 mt-1">
          Accessibility controls (GIGW 3.0 / WCAG 2.1 AA), privacy architecture, and data management
        </p>
      </div>

      {/* System Information Card */}
      <div className="glass-panel bg-gradient-to-br from-navy/95 via-navy-light/95 to-primary-950/95 p-6 text-white border-white/20 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-saffron text-navy font-mono">SIH26016</span>
              <p className="font-bold text-lg text-white">BhoomiSetu (भूमिसेतु)</p>
            </div>
            <p className="text-surface-300 text-xs mt-1">National Land Acquisition & Management Intelligence Platform</p>
            <p className="text-surface-400 text-[11px] mt-0.5">Ministry of Rural Development / Department of Land Resources</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[10px] text-surface-400 uppercase tracking-wider font-semibold">Build Standard</p>
            <p className="font-mono font-bold text-saffron text-sm mt-0.5">v2.6.1 — Hardened Release</p>
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-3 text-center">
          <div className="glass-card bg-white/5 border border-white/10 p-2.5 rounded-xl">
            <p className="text-lg font-bold font-mono text-white">{kpis.totalProjects}</p>
            <p className="text-[11px] text-surface-300">Projects</p>
          </div>
          <div className="glass-card bg-white/5 border border-white/10 p-2.5 rounded-xl">
            <p className="text-lg font-bold font-mono text-white">{kpis.totalParcels.toLocaleString()}</p>
            <p className="text-[11px] text-surface-300">Parcels</p>
          </div>
          <div className="glass-card bg-white/5 border border-white/10 p-2.5 rounded-xl">
            <p className="text-lg font-bold font-mono text-white">{kpis.affectedFamilies.toLocaleString()}</p>
            <p className="text-[11px] text-surface-300">Families</p>
          </div>
        </div>
      </div>

      {/* Section I: Accessibility & GovTech UX (GIGW 3.0 / WCAG 2.1 AA) */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-surface-200/50 pb-3">
          <div className="flex items-center gap-2">
            <Accessibility size={18} className="text-primary-600" />
            <h2 className="text-sm font-bold text-surface-900">Accessibility Settings (GIGW 3.0 / WCAG 2.1 AA)</h2>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold border border-emerald-200/60">
            GovTech Standards Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Font Size Scaling */}
          <div className="glass-card p-3.5 rounded-xl border border-white/60 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-surface-800">
              <Type size={14} className="text-primary-600" />
              <span>Text Scaling</span>
            </div>
            <p className="text-[11px] text-surface-500 font-medium">Scale interface typography for low-vision readers.</p>
            <div className="flex gap-1.5 pt-1">
              {(['normal', 'large', 'xlarge'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`flex-1 py-1.5 px-2 rounded-xl font-semibold text-[11px] transition-all capitalize ${
                    fontSize === size
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'glass-button-secondary text-surface-700'
                  }`}
                >
                  {size === 'normal' ? '100%' : size === 'large' ? '110%' : '125%'}
                </button>
              ))}
            </div>
          </div>

          {/* Contrast Mode */}
          <div className="glass-card p-3.5 rounded-xl border border-white/60 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-surface-800">
              <Contrast size={14} className="text-primary-600" />
              <span>Contrast Ratio</span>
            </div>
            <p className="text-[11px] text-surface-500 font-medium">Enhanced 7:1 ratio for high-visibility compliance.</p>
            <div className="flex gap-1.5 pt-1">
              <button
                onClick={() => setContrastMode('standard')}
                className={`flex-1 py-1.5 px-2 rounded-xl font-semibold text-[11px] transition-all ${
                  contrastMode === 'standard'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'glass-button-secondary text-surface-700'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setContrastMode('high-contrast')}
                className={`flex-1 py-1.5 px-2 rounded-xl font-semibold text-[11px] transition-all ${
                  contrastMode === 'high-contrast'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'glass-button-secondary text-surface-700'
                }`}
              >
                High Contrast
              </button>
            </div>
          </div>

          {/* Reduced Motion */}
          <div className="glass-card p-3.5 rounded-xl border border-white/60 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-surface-800">
              <ZapOff size={14} className="text-primary-600" />
              <span>Reduced Motion</span>
            </div>
            <p className="text-[11px] text-surface-500 font-medium">Eliminates transition effects for vestibular safety.</p>
            <div className="flex gap-1.5 pt-1">
              <button
                onClick={() => setReducedMotion(false)}
                className={`flex-1 py-1.5 px-2 rounded-xl font-semibold text-[11px] transition-all ${
                  !reducedMotion
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'glass-button-secondary text-surface-700'
                }`}
              >
                On
              </button>
              <button
                onClick={() => setReducedMotion(true)}
                className={`flex-1 py-1.5 px-2 rounded-xl font-semibold text-[11px] transition-all ${
                  reducedMotion
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'glass-button-secondary text-surface-700'
                }`}
              >
                Reduced
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section H: Privacy & Data Handling Architecture */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-surface-200/50 pb-3">
          <Lock size={18} className="text-primary-600" />
          <h2 className="text-sm font-bold text-surface-900">Privacy & Data Handling Architecture (DPDP Act 2023)</h2>
        </div>

        <div className="space-y-3 text-xs text-surface-700 leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="glass-card p-3.5 rounded-xl border border-white/60 space-y-1">
              <p className="font-bold text-surface-900 flex items-center gap-1.5">
                <EyeOff size={13} className="text-emerald-600" /> Personal Data Minimization
              </p>
              <p className="text-[11px] text-surface-500 font-medium">
                Landowner phone numbers and Aadhaar references are masked (e.g. <code>+91 XXXXX 48120</code>). Full PII is restricted to authorized Land Acquisition Officers.
              </p>
            </div>

            <div className="glass-card p-3.5 rounded-xl border border-white/60 space-y-1">
              <p className="font-bold text-surface-900 flex items-center gap-1.5">
                <Shield size={13} className="text-emerald-600" /> Financial Data Protection
              </p>
              <p className="text-[11px] text-surface-500 font-medium">
                Bank account numbers in compensation records are automatically masked (e.g. <code>SBIN••••4589</code>) to prevent unauthorized extraction during audits.
              </p>
            </div>
          </div>

          {/* Prototype Deployment Statement (Mandatory Requirement H) */}
          <div className="glass-card bg-blue-50/70 border border-blue-200/60 text-blue-900 rounded-xl p-4 space-y-1">
            <p className="font-bold text-xs text-blue-950">
              National Prototype Deployment Declaration:
            </p>
            <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
              "Production deployment requires server-side authorization, secure infrastructure and approved government identity/API integrations."
            </p>
            <p className="text-[10px] text-blue-700 mt-1">
              Protected credentials (OAuth2 secrets, private mTLS certificates) must reside inside government server-side API gateways and are never distributed in frontend client bundles.
            </p>
          </div>
        </div>
      </div>

      {/* User Preferences & Data Management */}
      <div className="glass-panel p-5 space-y-4">
        <h2 className="text-sm font-bold text-surface-900 flex items-center gap-2 border-b border-surface-200/50 pb-3">
          <Database size={16} className="text-primary-600" />
          Data Management & Snapshot Export
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-4 rounded-xl border border-white/60 flex flex-col justify-between space-y-3">
            <div>
              <p className="text-xs font-bold text-surface-900">Export Complete Platform Snapshot</p>
              <p className="text-[11px] text-surface-500 font-medium mt-0.5">
                Download JSON dump of projects, parcels, awards, compensation, and families for offline audit.
              </p>
            </div>
            <button
              onClick={handleExportAll}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors shadow-sm"
            >
              <Download size={14} /> Export All Dataset JSON
            </button>
          </div>

          <div className="glass-card bg-amber-50/60 p-4 rounded-xl border border-amber-200/60 flex flex-col justify-between space-y-3">
            <div>
              <p className="text-xs font-bold text-amber-950">Reset Demonstration State</p>
              <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                Restores the local persistent storage to clean synthetic SIH demonstration records.
              </p>
            </div>
            <button
              onClick={() => setConfirmReset(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors shadow-sm"
            >
              <RefreshCw size={14} /> Reset Demonstration Store
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Reset Modal */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="glass-modal w-full max-w-sm p-5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100/80 flex items-center justify-center shrink-0 border border-red-200">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-surface-900">Reset Demo Data?</h3>
                <p className="text-xs text-surface-500">Restores default synthetic demonstration data</p>
              </div>
            </div>
            <p className="text-xs text-surface-600 mb-4 leading-relaxed font-medium">
              All ongoing proposal reviews, field verification notes, and compensation disbursements will be restored to their factory state.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-2 glass-button-secondary text-surface-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                className="flex-1 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 shadow-sm"
              >
                Yes, Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
