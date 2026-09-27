// ============================================================
// BhoomiSetu - Governance & Compliance Center (Section L)
// Full technical mapping of SIH26016 problem requirements
// ============================================================
import React, { useState } from 'react';
import {
  Shield, CheckCircle2, Clock, AlertTriangle, FileCheck, Lock,
  Eye, Server, Database, Globe, Users, ArrowUpRight, Scale
} from 'lucide-react';

type RequirementStatus = 'Implemented' | 'Partially Implemented' | 'Integration Required';

interface RequirementItem {
  id: string;
  category: string;
  title: string;
  module: string;
  status: RequirementStatus;
  technicalDescription: string;
  sihMapping: string;
}

const SIH_REQUIREMENTS: RequirementItem[] = [
  {
    id: 'REQ-01',
    category: '1. SIH26016 Requirement Coverage',
    title: 'Proposal Submission & Scrutiny Engine',
    module: '/projects & /workflow',
    status: 'Implemented',
    technicalDescription: 'Multi-stage proposal intake with requiring body scrutiny, digital verification, and district clearance gates.',
    sihMapping: 'Section 4(1) RFCTLARR Proposal Intake & Digital Scrutiny'
  },
  {
    id: 'REQ-02',
    category: '1. SIH26016 Requirement Coverage',
    title: 'ULPIN / Bhu-Aadhar 14-Digit Land Registry',
    module: '/parcels & standardSchema.ts',
    status: 'Implemented',
    technicalDescription: 'First-class parcel identifier standard based on ECEF geo-coordinates, with search and boundary linkage.',
    sihMapping: 'National Bhu-Aadhar (ULPIN) Standard by DoLR'
  },
  {
    id: 'REQ-03',
    category: '1. SIH26016 Requirement Coverage',
    title: 'Cadastral GIS Vector Mapping & Geo-tagging',
    module: '/parcels (Leaflet + Cadastral Adapter)',
    status: 'Implemented',
    technicalDescription: 'Multi-layer GIS viewer with project centroids, parcel points, vector cadastral boundary polygons, and live HUD coordinates.',
    sihMapping: 'Cadastral Geo-Spatial Integration & NIC Bharat Maps'
  },
  {
    id: 'REQ-04',
    category: '1. SIH26016 Requirement Coverage',
    title: 'Statutory Gazette Notifications (Sec 11 & Sec 19)',
    module: '/notifications',
    status: 'Implemented',
    technicalDescription: 'Statutory publication workflow with draft-to-published immutability and digital gazette reference tracking.',
    sihMapping: 'Section 11 Preliminary & Section 19 Final Declaration'
  },
  {
    id: 'REQ-05',
    category: '1. SIH26016 Requirement Coverage',
    title: 'Award Determination & 100% Solatium Assessment',
    module: '/awards',
    status: 'Implemented',
    technicalDescription: 'Section 26-30 RFCTLARR compensation assessment with 100% solatium, market value multiplier, and asset valuation.',
    sihMapping: 'Section 23/30 Award Determination under RFCTLARR 2013'
  },
  {
    id: 'REQ-06',
    category: '1. SIH26016 Requirement Coverage',
    title: 'Direct Benefit Transfer (DBT) & Escrow Tracking',
    module: '/compensation',
    status: 'Implemented',
    technicalDescription: 'Disbursement tracking with bank account masking, UTR reference tracking, and treasury reconciliation.',
    sihMapping: 'Section 77 Compensation Deposit & Direct Bank Transfer'
  },
  {
    id: 'REQ-07',
    category: '1. SIH26016 Requirement Coverage',
    title: 'Land Possession & Encumbrance Handover',
    module: '/possession',
    status: 'Implemented',
    technicalDescription: 'Section 38/40 possession notice issuance, physical handover certification, and encumbrance-free record tracking.',
    sihMapping: 'Section 38 Possession Handover to Requiring Body'
  },
  {
    id: 'REQ-08',
    category: '1. SIH26016 Requirement Coverage',
    title: 'Rehabilitation & Resettlement (R&R) Monitoring',
    module: '/rr & /families',
    status: 'Implemented',
    technicalDescription: 'Tracking of displaced vs affected families, housing assistance, skill development, and infrastructure provision.',
    sihMapping: 'Second & Third Schedules of RFCTLARR Act 2013'
  },
  {
    id: 'REQ-09',
    category: '1. SIH26016 Requirement Coverage',
    title: 'Mobile Field Verification & Offline Geo-Tagging',
    module: '/field-mode',
    status: 'Implemented',
    technicalDescription: 'Dedicated mobile-responsive field inspection interface with GPS coordinate locking, evidence capture, and verification checklist.',
    sihMapping: 'Ground-truthing, Joint Measurement Survey (JMS)'
  },
  {
    id: 'REQ-10',
    category: '2. API Interoperability',
    title: 'DILRMP State Land Records Adapter',
    module: 'src/services/adapters/dilrmpAdapter.ts',
    status: 'Partially Implemented',
    technicalDescription: 'Standardized adapter contract supporting RoR query, khatiyan verification. Configured in Official Sandbox mode.',
    sihMapping: 'Digital India Land Records Modernization Programme (DILRMP)'
  },
  {
    id: 'REQ-11',
    category: '2. API Interoperability',
    title: 'National API Setu Gateway Connector',
    module: 'src/services/adapters/apiSetuAdapter.ts',
    status: 'Integration Required',
    technicalDescription: 'OAuth2 schema connector configuration screen ready. Marked "Credential Required" awaiting MeitY API Setu keys.',
    sihMapping: 'MeitY National API Setu Interoperability Framework'
  },
  {
    id: 'REQ-12',
    category: '2. API Interoperability',
    title: 'PFMS & Treasury Financial Gateway',
    module: 'src/services/adapters/financialAdapter.ts',
    status: 'Partially Implemented',
    technicalDescription: 'Direct Benefit Transfer disbursement verification engine with NPCI/Aadhaar Bridge sandbox schema validation.',
    sihMapping: 'Ministry of Finance PFMS DBT & e-Kuber Interface'
  },
  {
    id: 'REQ-13',
    category: '3. Data Governance',
    title: 'Unified National Land Schema Standard',
    module: 'src/types/standardSchema.ts',
    status: 'Implemented',
    technicalDescription: 'Standardized schema matching stateCode, districtCode, surveyNumber, ULPIN, and parcelArea across all states.',
    sihMapping: 'National Spatial Data Infrastructure (NSDI) Schema'
  },
  {
    id: 'REQ-14',
    category: '3. Data Governance',
    title: 'Data Import Center (CSV/JSON Ingestion)',
    module: '/import & dataStore.importData()',
    status: 'Implemented',
    technicalDescription: 'Bulk ingestion engine with template generation, schema validation, duplicate detection, and import auditing.',
    sihMapping: 'Legacy Data Migration & Inter-Agency Ingest'
  },
  {
    id: 'REQ-15',
    category: '4. Accessibility',
    title: 'GIGW 3.0 & WCAG 2.1 AA Compliance',
    module: 'index.css & accessibility tokens',
    status: 'Implemented',
    technicalDescription: 'Semantic H1 page structures, keyboard accessibility, visible focus indicators, multi-modal status badges, and contrast settings.',
    sihMapping: 'Guidelines for Indian Government Websites (GIGW 3.0)'
  },
  {
    id: 'REQ-16',
    category: '5. Cybersecurity Controls',
    title: 'Zero Credential Leakage & Client Isolation',
    module: '.env.example & services architecture',
    status: 'Implemented',
    technicalDescription: 'No private keys or protected tokens in frontend bundles. Protected API calls routed via server-side gateway pattern.',
    sihMapping: 'CERT-In Web Application Security Guidelines'
  },
  {
    id: 'REQ-17',
    category: '5. Cybersecurity Controls',
    title: 'Role-Based Access Control (RBAC) with 9 Roles',
    module: 'AuthContext & types/index.ts',
    status: 'Implemented',
    technicalDescription: 'Hierarchical authorization from National Administrator down to Field Verification Officer with granular stage gates.',
    sihMapping: 'Least-Privilege Principle & Departmental Hierarchy'
  },
  {
    id: 'REQ-18',
    category: '6. Audit & Accountability',
    title: 'Immutable State-Changing Audit Trail',
    module: '/audit & dataStore.addAuditEvent()',
    status: 'Implemented',
    technicalDescription: 'Captures actor, role, timestamp, entity, state before/after, and reason. UI provides strictly read-only historical inspection.',
    sihMapping: 'Statutory Accountability & CVC Anti-Corruption Oversight'
  },
  {
    id: 'REQ-19',
    category: '7. Privacy/Data Protection',
    title: 'PII & Financial Data Masking (DPDP Act 2023)',
    module: 'Compensation, Families, Settings',
    status: 'Implemented',
    technicalDescription: 'Bank account masking (••••4589), mobile contact masking, role-restricted beneficiary viewing, and privacy notice.',
    sihMapping: 'Digital Personal Data Protection (DPDP) Act 2023'
  },
  {
    id: 'REQ-20',
    category: '8. Production Readiness',
    title: 'Production Migration & Enterprise Architecture',
    module: 'src/services & dataStore.ts',
    status: 'Partially Implemented',
    technicalDescription: 'Repository Pattern ready for PostgreSQL/PostGIS and FastAPI/Spring Boot enterprise backends. Full build succeeds.',
    sihMapping: 'National Rollout Architecture'
  }
];

export default function GovernancePage() {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const categories = ['All', ...new Set(SIH_REQUIREMENTS.map(r => r.category))];

  const filteredRequirements = SIH_REQUIREMENTS.filter(r => {
    if (filterCategory !== 'All' && r.category !== filterCategory) return false;
    if (filterStatus !== 'All' && r.status !== filterStatus) return false;
    return true;
  });

  const counts = {
    total: SIH_REQUIREMENTS.length,
    implemented: SIH_REQUIREMENTS.filter(r => r.status === 'Implemented').length,
    partiallyImplemented: SIH_REQUIREMENTS.filter(r => r.status === 'Partially Implemented').length,
    integrationRequired: SIH_REQUIREMENTS.filter(r => r.status === 'Integration Required').length,
  };

  const statusPill = (status: RequirementStatus) => {
    switch (status) {
      case 'Implemented':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-800 border border-emerald-500/30">
            <CheckCircle2 size={12} className="text-emerald-600" /> Implemented
          </span>
        );
      case 'Partially Implemented':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-800 border border-cyan-500/30">
            <Clock size={12} className="text-cyan-600" /> Sandbox Ready
          </span>
        );
      case 'Integration Required':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-800 border border-amber-500/30">
            <AlertTriangle size={12} className="text-amber-600" /> Integration Required
          </span>
        );
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <Shield className="text-primary-600" size={24} />
            Governance, Compliance & Technical Architecture
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            SIH26016 Problem Statement Requirement Traceability Matrix & Standards Alignment
          </p>
        </div>

        {/* Status Metrics */}
        <div className="flex items-center gap-2">
          <div className="glass-card bg-emerald-50/80 border border-emerald-200/60 px-3.5 py-2 rounded-xl text-center">
            <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Implemented</p>
            <p className="text-base font-bold text-emerald-950 font-mono mt-0.5">{counts.implemented}</p>
          </div>
          <div className="glass-card bg-blue-50/80 border border-blue-200/60 px-3.5 py-2 rounded-xl text-center">
            <p className="text-[10px] text-blue-800 font-bold uppercase tracking-wider">Sandbox Ready</p>
            <p className="text-base font-bold text-blue-950 font-mono mt-0.5">{counts.partiallyImplemented}</p>
          </div>
          <div className="glass-card bg-amber-50/80 border border-amber-200/60 px-3.5 py-2 rounded-xl text-center">
            <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Integration Req.</p>
            <p className="text-base font-bold text-amber-950 font-mono mt-0.5">{counts.integrationRequired}</p>
          </div>
        </div>
      </div>

      {/* Honest Compliance Notice (Section L requirement: Never claim external certification) */}
      <div className="bg-slate-900/90 text-white rounded-2xl p-4.5 text-xs space-y-2 border border-slate-700/60 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <Scale size={16} /> Technical Readiness Declaration & Regulatory Statement
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px] font-medium">
          This matrix documents technical compliance with the RFCTLARR Act 2013 and SIH26016 problem specifications. BhoomiSetu represents an architecture-ready national land acquisition platform. In accordance with government procurement standards, this prototype <strong>does not claim third-party certifications</strong> (e.g. STQC / MeitY Empanelment) without accredited institutional audits.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto max-w-full scrollbar-thin">
          <span className="text-xs font-bold text-surface-700 shrink-0">Section:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                filterCategory === cat
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-sm ring-2 ring-primary-500/20'
                  : 'glass-card text-surface-600 hover:text-surface-900 hover:bg-white/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-surface-700">Status:</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="glass-input h-8 px-3 text-xs"
          >
            <option value="All">All Statuses</option>
            <option value="Implemented">Implemented</option>
            <option value="Partially Implemented">Partially Implemented</option>
            <option value="Integration Required">Integration Required</option>
          </select>
        </div>
      </div>

      {/* Requirements Table */}
      <div className="glass-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="glass-table-header">
                <th className="p-3.5 w-20 font-bold text-surface-700 uppercase tracking-wider text-[11px]">Req. ID</th>
                <th className="p-3.5 w-56 font-bold text-surface-700 uppercase tracking-wider text-[11px]">Specification & Feature</th>
                <th className="p-3.5 w-40 font-bold text-surface-700 uppercase tracking-wider text-[11px]">BhoomiSetu Module</th>
                <th className="p-3.5 w-40 font-bold text-surface-700 uppercase tracking-wider text-[11px]">Status</th>
                <th className="p-3.5 font-bold text-surface-700 uppercase tracking-wider text-[11px]">Technical Implementation Details</th>
                <th className="p-3.5 w-52 font-bold text-surface-700 uppercase tracking-wider text-[11px]">Statutory / SIH Mapping</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200/50">
              {filteredRequirements.map(item => (
                <tr key={item.id} className="hover:bg-white/60 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-primary-700 text-[11px]">
                    {item.id}
                  </td>
                  <td className="p-3.5">
                    <p className="font-bold text-surface-900">{item.title}</p>
                    <p className="text-[10px] text-surface-400 mt-0.5">{item.category}</p>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-primary-800 font-semibold">
                    {item.module}
                  </td>
                  <td className="p-3.5">
                    {statusPill(item.status)}
                  </td>
                  <td className="p-3.5 text-surface-700 leading-relaxed text-[11px]">
                    {item.technicalDescription}
                  </td>
                  <td className="p-3.5 text-[11px] text-surface-600 font-medium">
                    {item.sihMapping}
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
