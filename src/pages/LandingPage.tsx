// ============================================================
// BhoomiSetu — Public Landing Page
// National Land Acquisition & Management Intelligence Platform
// ============================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MapPin, Shield, ArrowRight, Layers, FileCheck, Banknote,
  Users, CheckCircle2, ChevronRight, Landmark, Lock, Globe,
  FileSpreadsheet, Activity, Building2
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-surface-50 text-surface-900 selection:bg-primary-500 selection:text-white">
      {/* Top Bar with National Branding */}
      <header className="glass-header sticky top-0 z-50 px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron via-saffron-light to-amber-600 flex items-center justify-center shadow-md shadow-saffron/20">
            <MapPin size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-navy tracking-tight">BhoomiSetu</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-saffron/10 text-saffron border border-saffron/20">
                भूमिसेतु
              </span>
            </div>
            <p className="text-[10px] text-surface-500 font-medium tracking-wider uppercase">
              Govt. of India • DoLR / RFCTLARR 2013
            </p>
          </div>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full glass-badge text-[11px] text-amber-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Demonstration Environment • Synthetic Data
          </div>

          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:shadow"
            >
              Enter Dashboard <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:shadow"
            >
              Sign In <ArrowRight size={14} />
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-16 w-full">
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-xs font-medium text-primary-800 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary-600 animate-ping" />
            Smart India Hackathon 2024–2026 • Problem Statement SIH26016
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-navy tracking-tight leading-tight">
            Unified National Land Acquisition & Management Platform
          </h1>

          <p className="text-base sm:text-lg text-surface-600 leading-relaxed max-w-2xl mx-auto">
            Digitizing the end-to-end statutory land lifecycle across 10 demonstration states:
            from Preliminary Notification to Bhu-Aadhar ULPIN geo-tagging, award declarations, DBT compensation, and R&R entitlement monitoring.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 rounded-xl bg-navy hover:bg-navy-light text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-navy/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Lock size={16} className="text-saffron-light" />
              Sign In to Platform
            </button>

            <button
              onClick={() => navigate('/login')}
              className="px-5 py-3 rounded-xl glass-button-secondary font-medium text-sm flex items-center gap-2 hover:bg-white transition-all"
            >
              View Demo Accounts <ChevronRight size={16} />
            </button>
          </div>

          {/* Demonstration Notice */}
          <p className="text-[11px] text-surface-500 pt-1">
            Standard authentication required. Demo credentials available on the login portal.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-14">
          <div className="glass-card p-5 space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600">
              <Layers size={18} />
            </div>
            <h2 className="text-sm font-bold text-navy">Cadastral GIS & ULPIN</h2>
            <p className="text-xs text-surface-600 leading-relaxed">
              Real boundary geometries for 10 states, 14-digit Bhu-Aadhar indexing, and precise polygon overlays.
            </p>
          </div>

          <div className="glass-card p-5 space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-saffron/10 border border-saffron/20 flex items-center justify-center text-saffron">
              <FileCheck size={18} />
            </div>
            <h2 className="text-sm font-bold text-navy">RFCTLARR 2013 Workflow</h2>
            <p className="text-xs text-surface-600 leading-relaxed">
              16-stage statutory approval pipeline with digital scrutiny, collector sanctions, and strict single-action locks.
            </p>
          </div>

          <div className="glass-card p-5 space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Banknote size={18} />
            </div>
            <h2 className="text-sm font-bold text-navy">Direct Benefit Transfer</h2>
            <p className="text-xs text-surface-600 leading-relaxed">
              Automated Solatium calculations, market valuation multipliers, and bank account escrow validation.
            </p>
          </div>

          <div className="glass-card p-5 space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
              <Users size={18} />
            </div>
            <h2 className="text-sm font-bold text-navy">R&R & Affected Families</h2>
            <p className="text-xs text-surface-600 leading-relaxed">
              Comprehensive family displacement audits, resettlement colony allotment, and livelihood entitlement tracking.
            </p>
          </div>
        </div>

        {/* High-level Metrics Sheen */}
        <div className="glass-panel p-6 mt-8 flex flex-wrap items-center justify-around gap-6 text-center">
          <div>
            <p className="text-2xl font-black text-navy">10 States</p>
            <p className="text-xs text-surface-500 font-medium">Authentic Territorial Boundaries</p>
          </div>
          <div className="hidden sm:block h-8 w-px bg-surface-200" />
          <div>
            <p className="text-2xl font-black text-navy">30 Projects</p>
            <p className="text-xs text-surface-500 font-medium">Demonstration Infrastructure</p>
          </div>
          <div className="hidden sm:block h-8 w-px bg-surface-200" />
          <div>
            <p className="text-2xl font-black text-navy">150+ Parcels</p>
            <p className="text-xs text-surface-500 font-medium">100% Geo-Validated Containment</p>
          </div>
          <div className="hidden sm:block h-8 w-px bg-surface-200" />
          <div>
            <p className="text-2xl font-black text-navy">9 User Roles</p>
            <p className="text-xs text-surface-500 font-medium">Strict RBAC Authorization</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-200 bg-white/70 py-6 px-4 text-center text-xs text-surface-500">
        <p>BhoomiSetu • National Land Management & Acquisition Intelligence Platform</p>
        <p className="text-[11px] text-surface-400 mt-1">
          Developed for Smart India Hackathon SIH26016 • Demonstration Environment with Synthetic Geospatial Data
        </p>
      </footer>
    </div>
  );
}
