import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { WORKFLOW_STAGES } from '../types';
import type { WorkflowStage } from '../types';
import {
  ArrowLeft, CheckCircle, Clock, AlertTriangle, MapPin, Users, Banknote,
  FileText, Award, KeyRound, Home, BarChart3, GitBranch, Shield, Calendar,
  ChevronRight, Play, XCircle, RotateCcw, MessageSquare
} from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  'On Track': 'bg-emerald-100 text-emerald-700',
  'Delayed': 'bg-amber-100 text-amber-700',
  'Critical': 'bg-red-100 text-red-700',
  'Completed': 'bg-blue-100 text-blue-700',
  'Under Review': 'bg-violet-100 text-violet-700',
  'Pending Approval': 'bg-purple-100 text-purple-700',
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const { user, permissions } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [actionRemarks, setActionRemarks] = useState('');
  const [showWorkflowAction, setShowWorkflowAction] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const project = id ? store.getProject(id) : undefined;
  const parcels = id ? store.getParcelsByProject(id) : [];
  const families = id ? store.getFamiliesByProject(id) : [];
  const awards = id ? store.getAwardsByProject(id) : [];
  const compensation = id ? store.getCompensationByProject(id) : [];
  const possession = id ? store.getPossessionByProject(id) : [];
  const milestones = id ? store.getMilestonesByProject(id) : [];
  const documents = id ? store.getDocumentsByProject(id) : [];
  const transitions = id ? store.getTransitionsByProject(id) : [];
  const notifications = id ? store.getNotificationsByProject(id) : [];

  if (!project) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold text-surface-900">Project not found</h2>
        <button onClick={() => navigate('/projects')} className="mt-4 text-sm text-primary-600 hover:text-primary-700">← Back to Projects</button>
      </div>
    );
  }

  const stageIdx = WORKFLOW_STAGES.indexOf(project.currentStage);
  const progress = project.landProposed > 0 ? ((project.landAcquired / project.landProposed) * 100) : 0;
  const totalCompAssessed = compensation.reduce((s, c) => s + c.assessedAmount, 0);
  const totalCompPaid = compensation.reduce((s, c) => s + c.paidAmount, 0);
  const overdueMilestones = milestones.filter(m => m.status === 'Overdue');
  const completedMilestones = milestones.filter(m => m.status === 'Completed');
  const displacedFamilies = families.filter(f => f.isDisplaced);
  const rrCompleted = families.filter(f => f.rrStatus === 'Completed');
  const possCompleted = possession.filter(p => p.status === 'Completed');

  // Risk Assessment
  const riskFactors: string[] = [];
  const riskRecommendations: string[] = [];
  if (overdueMilestones.length > 0) { riskFactors.push(`${overdueMilestones.length} milestones overdue`); riskRecommendations.push('Review and update overdue milestone timelines'); }
  if (compensation.filter(c => c.paymentStatus === 'Pending').length > 5) { riskFactors.push(`${compensation.filter(c => c.paymentStatus === 'Pending').length} compensation records pending`); riskRecommendations.push('Expedite pending compensation processing'); }
  if (progress < 30 && stageIdx > 8) { riskFactors.push('Low acquisition progress relative to workflow stage'); riskRecommendations.push('Escalate land acquisition bottlenecks'); }
  if (documents.filter(d => d.verificationState === 'Pending').length > 3) { riskFactors.push('Multiple documents pending verification'); riskRecommendations.push('Assign document verification tasks'); }

  const handleWorkflowAction = (action: 'Submit' | 'Approve' | 'Reject' | 'Revise') => {
    if (!user || !id || !project || isProcessing) return;

    // Immediately disable the button to prevent duplicate / double-click submissions
    setIsProcessing(true);

    try {
      const result = store.transitionProject(
        id,
        action,
        user.id,
        user.name,
        user.role,
        actionRemarks,
        undefined,
        project.currentStage // Validated against the project's CURRENT persisted stage
      );
      if (result.success) {
        toast.success(result.message);
        setShowWorkflowAction(false);
        setActionRemarks('');
      } else {
        toast.error(result.message);
      }
    } finally {
      // Keep disabled until state settles so the next stage requires a new explicit click
      setTimeout(() => {
        setIsProcessing(false);
      }, 700);
    }
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={14} /> },
    { id: 'workflow', label: 'Workflow', icon: <GitBranch size={14} /> },
    { id: 'parcels', label: `Land (${parcels.length})`, icon: <MapPin size={14} /> },
    { id: 'compensation', label: `Compensation (${compensation.length})`, icon: <Banknote size={14} /> },
    { id: 'families', label: `Families (${families.length})`, icon: <Users size={14} /> },
    { id: 'milestones', label: `Milestones (${milestones.length})`, icon: <Calendar size={14} /> },
    { id: 'documents', label: `Docs (${documents.length})`, icon: <FileText size={14} /> },
    { id: 'risk', label: 'Risk', icon: <Shield size={14} /> },
  ];

  const formatCurrency = (v: number) => v >= 10000000 ? `₹${(v / 10000000).toFixed(2)} Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(1)} L` : `₹${v.toLocaleString('en-IN')}`;

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('/projects')} className="mt-1 p-1.5 rounded-lg hover:bg-surface-100 text-surface-500">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-surface-900 truncate">{project.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[project.status] || 'bg-surface-100 text-surface-600'}`}>{project.status}</span>
            <button
              onClick={() => navigate('/parcels')}
              className="text-xs px-2.5 py-1 rounded bg-surface-100 hover:bg-surface-200 text-primary-700 font-medium flex items-center gap-1 transition-colors"
              title="View on India GIS Map"
            >
              <MapPin size={13} className="text-primary-600" /> View on GIS Map
            </button>
          </div>
          <p className="text-sm text-surface-500 mt-0.5 flex flex-wrap items-center gap-1.5">
            <span>{project.id}</span>
            <span>•</span>
            <span className="font-semibold text-surface-700">{project.district}, {project.state}</span>
            <span>•</span>
            <span>{project.projectType}</span>
            <span>•</span>
            <span>Stage: <strong className="text-surface-700">{project.currentStage}</strong></span>
            {typeof project.latitude === 'number' && typeof project.longitude === 'number' && (
              <>
                <span>•</span>
                <span className="font-mono text-xs text-primary-700 font-medium">
                  [{project.latitude.toFixed(4)}°N, {project.longitude.toFixed(4)}°E]
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="glass-kpi p-3.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
          <p className="text-[10px] text-surface-500 uppercase tracking-wider font-semibold">Land Progress</p>
          <p className="text-xl font-bold text-navy mt-1">{progress.toFixed(1)}%</p>
          <div className="w-full h-2 bg-surface-200/80 rounded-full mt-2 overflow-hidden p-0.5 border border-surface-200/60">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, progress)}%` }} />
          </div>
          <p className="text-[10px] text-surface-500 font-medium mt-1.5">{project.landAcquired.toFixed(1)} / {project.landProposed.toFixed(1)} Ha</p>
        </div>

        <div className="glass-kpi p-3.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-500" />
          <p className="text-[10px] text-surface-500 uppercase tracking-wider font-semibold">Parcels</p>
          <p className="text-xl font-bold text-navy mt-1">{parcels.length}</p>
          <p className="text-[10px] text-teal-700 font-semibold mt-1.5">{parcels.filter(p => p.verificationStatus === 'Verified').length} ground-verified</p>
        </div>

        <div className="glass-kpi p-3.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
          <p className="text-[10px] text-surface-500 uppercase tracking-wider font-semibold">Affected Families</p>
          <p className="text-xl font-bold text-navy mt-1">{families.length}</p>
          <p className="text-[10px] text-rose-700 font-semibold mt-1.5">{displacedFamilies.length} displaced families</p>
        </div>

        <div className="glass-kpi p-3.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <p className="text-[10px] text-surface-500 uppercase tracking-wider font-semibold">Compensation</p>
          <p className="text-xl font-bold text-navy mt-1">{formatCurrency(totalCompPaid)}</p>
          <p className="text-[10px] text-surface-500 font-medium mt-1.5">of {formatCurrency(totalCompAssessed)}</p>
        </div>

        <div className="glass-kpi p-3.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <p className="text-[10px] text-surface-500 uppercase tracking-wider font-semibold">Possession</p>
          <p className="text-xl font-bold text-navy mt-1">{possCompleted.length}/{possession.length}</p>
          <p className="text-[10px] text-surface-500 font-medium mt-1.5">{possession.length > 0 ? ((possCompleted.length / possession.length) * 100).toFixed(0) : 0}% handed over</p>
        </div>

        <div className="glass-kpi p-3.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
          <p className="text-[10px] text-surface-500 uppercase tracking-wider font-semibold">Milestones</p>
          <p className="text-xl font-bold text-navy mt-1">{completedMilestones.length}/{milestones.length}</p>
          {overdueMilestones.length > 0 ? (
            <p className="text-[10px] text-rose-700 font-bold mt-1.5">{overdueMilestones.length} overdue</p>
          ) : (
            <p className="text-[10px] text-emerald-700 font-semibold mt-1.5">On target schedule</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-panel overflow-hidden">
        <div className="flex overflow-x-auto border-b border-surface-200/80 bg-surface-50/50 px-2 pt-1 gap-1">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-primary-600 text-primary-700 bg-white shadow-xs rounded-t-xl'
                    : 'border-transparent text-surface-500 hover:text-surface-800 hover:bg-white/40 rounded-t-xl'
                }`}
              >
                <span className={isActive ? 'text-primary-600' : 'text-surface-400'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-surface-900">Project Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      ['Requiring Body', project.requiringBody],
                      ['Project Type', project.projectType],
                      ['Priority', project.priority],
                      ['Risk Level', project.riskLevel],
                      ['Responsible', project.responsibleAuthority],
                      ['Created By', project.createdBy],
                      ['Target Start', project.targetStartDate],
                      ['Target Completion', project.targetCompletionDate],
                    ].map(([label, val]) => (
                      <div key={label as string}>
                        <p className="text-surface-400">{label}</p>
                        <p className="text-surface-800 font-medium">{val as string}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-surface-900">Description</h3>
                  <p className="text-xs text-surface-600 leading-relaxed">{project.description}</p>
                  <h3 className="text-sm font-semibold text-surface-900 mt-4">Quick Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setActiveTab('workflow')} className="px-3 py-1.5 bg-primary-50 text-primary-700 text-xs rounded-lg hover:bg-primary-100 transition-colors">View Workflow</button>
                    <button onClick={() => navigate('/parcels')} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs rounded-lg hover:bg-emerald-100 transition-colors">View on Map</button>
                    <button onClick={() => setActiveTab('compensation')} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs rounded-lg hover:bg-amber-100 transition-colors">Compensation</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-surface-900">Workflow Progress</h3>
                {(permissions?.canApproveWorkflow || permissions?.canRejectWorkflow) && (
                  <div className="flex gap-2">
                    {stageIdx < WORKFLOW_STAGES.length - 1 && (
                      <>
                        <button
                          disabled={isProcessing}
                          onClick={() => handleWorkflowAction(stageIdx < 2 ? 'Submit' : 'Approve')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg transition-all ${
                            isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-700 active:scale-95'
                          }`}
                        >
                          <Play size={12} className={isProcessing ? 'animate-spin' : ''} />
                          {isProcessing ? 'Processing...' : (stageIdx < 2 ? 'Submit' : 'Approve')}
                        </button>
                        <button
                          disabled={isProcessing}
                          onClick={() => handleWorkflowAction('Reject')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg transition-all ${
                            isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700 active:scale-95'
                          }`}
                        >
                          <XCircle size={12} /> Reject
                        </button>
                        <button
                          disabled={isProcessing}
                          onClick={() => handleWorkflowAction('Revise')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs rounded-lg transition-all ${
                            isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-700 active:scale-95'
                          }`}
                        >
                          <RotateCcw size={12} /> Request Revision
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Workflow Timeline */}
              <div className="relative">
                {WORKFLOW_STAGES.map((stage, i) => {
                  const isCurrent = i === stageIdx;
                  const isCompleted = i < stageIdx;
                  const transition = transitions.find(t => t.toStage === stage);
                  return (
                    <div key={stage} className="flex items-start gap-3 mb-1 last:mb-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          isCompleted ? 'bg-emerald-500 text-white' :
                          isCurrent ? 'bg-primary-600 text-white ring-4 ring-primary-100' :
                          'bg-surface-200 text-surface-400'
                        }`}>
                          {isCompleted ? <CheckCircle size={14} /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                        </div>
                        {i < WORKFLOW_STAGES.length - 1 && (
                          <div className={`w-0.5 h-6 ${isCompleted ? 'bg-emerald-300' : 'bg-surface-200'}`} />
                        )}
                      </div>
                      <div className="pb-4 min-w-0 flex-1">
                        <p className={`text-xs font-medium ${isCurrent ? 'text-primary-700' : isCompleted ? 'text-emerald-700' : 'text-surface-500'}`}>
                          {stage}
                          {isCurrent && <span className="ml-2 px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 text-[10px]">Current</span>}
                        </p>
                        {transition && (
                          <p className="text-[10px] text-surface-400 mt-0.5">{transition.performedBy} • {new Date(transition.timestamp).toLocaleDateString('en-IN')}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Transition History */}
              <h3 className="text-sm font-semibold text-surface-900 mt-4">Transition History</h3>
              <div className="space-y-2">
                {transitions.slice(0, 10).map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-2.5 bg-surface-50 rounded-lg text-xs">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      t.action === 'Approve' || t.action === 'Submit' ? 'bg-emerald-100 text-emerald-600' :
                      t.action === 'Reject' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {t.action === 'Approve' || t.action === 'Submit' ? <CheckCircle size={12} /> : t.action === 'Reject' ? <XCircle size={12} /> : <RotateCcw size={12} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-surface-800 font-medium">{t.fromStage} → {t.toStage}</p>
                      <p className="text-surface-400">{t.performedBy} ({t.performedByRole}) • {new Date(t.timestamp).toLocaleString('en-IN')}</p>
                      {t.remarks && <p className="text-surface-500 mt-0.5">{t.remarks}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'parcels' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-surface-900">Land Parcels ({parcels.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface-50">
                      {['ID','Village','Survey No.','Area (Ha)','Type','Acquisition','Compensation','Verification'].map(h => (
                        <th key={h} className="px-2.5 py-2 text-left font-semibold text-surface-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parcels.map(p => (
                      <tr key={p.id} className="border-b border-surface-100 hover:bg-surface-50">
                        <td className="px-2.5 py-2 font-mono text-surface-500">{p.id}</td>
                        <td className="px-2.5 py-2 text-surface-700">{p.village}</td>
                        <td className="px-2.5 py-2 text-surface-600">{p.surveyNumber}</td>
                        <td className="px-2.5 py-2 text-surface-700 font-medium">{p.area.toFixed(2)}</td>
                        <td className="px-2.5 py-2 text-surface-600">{p.landType}</td>
                        <td className="px-2.5 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            p.acquisitionStatus === 'Acquired' ? 'bg-emerald-100 text-emerald-700' :
                            p.acquisitionStatus === 'Disputed' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>{p.acquisitionStatus}</span>
                        </td>
                        <td className="px-2.5 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            p.compensationStatus === 'Disbursed' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-surface-100 text-surface-600'
                          }`}>{p.compensationStatus}</span>
                        </td>
                        <td className="px-2.5 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            p.verificationStatus === 'Verified' ? 'bg-emerald-100 text-emerald-700' :
                            p.verificationStatus === 'Rejected' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>{p.verificationStatus}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'compensation' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-surface-900">Compensation Records</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <div className="bg-blue-50 rounded-lg p-3"><p className="text-[10px] text-blue-600">Assessed</p><p className="text-sm font-bold text-blue-800">{formatCurrency(totalCompAssessed)}</p></div>
                <div className="bg-emerald-50 rounded-lg p-3"><p className="text-[10px] text-emerald-600">Paid</p><p className="text-sm font-bold text-emerald-800">{formatCurrency(totalCompPaid)}</p></div>
                <div className="bg-amber-50 rounded-lg p-3"><p className="text-[10px] text-amber-600">Pending</p><p className="text-sm font-bold text-amber-800">{formatCurrency(totalCompAssessed - totalCompPaid)}</p></div>
                <div className="bg-red-50 rounded-lg p-3"><p className="text-[10px] text-red-600">Disputed</p><p className="text-sm font-bold text-red-800">{compensation.filter(c => c.paymentStatus === 'Disputed').length}</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface-50">
                      {['ID','Beneficiary','Assessed','Approved','Paid','Status','Verification'].map(h => (
                        <th key={h} className="px-2.5 py-2 text-left font-semibold text-surface-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compensation.map(c => (
                      <tr key={c.id} className="border-b border-surface-100 hover:bg-surface-50">
                        <td className="px-2.5 py-2 font-mono text-surface-500">{c.id}</td>
                        <td className="px-2.5 py-2 text-surface-700 font-medium">{c.beneficiary}</td>
                        <td className="px-2.5 py-2 text-surface-600">{formatCurrency(c.assessedAmount)}</td>
                        <td className="px-2.5 py-2 text-surface-600">{formatCurrency(c.approvedAmount)}</td>
                        <td className="px-2.5 py-2 text-surface-700 font-medium">{formatCurrency(c.paidAmount)}</td>
                        <td className="px-2.5 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            c.paymentStatus === 'Disbursed' ? 'bg-emerald-100 text-emerald-700' :
                            c.paymentStatus === 'Disputed' || c.paymentStatus === 'Failed' ? 'bg-red-100 text-red-700' :
                            c.paymentStatus === 'Processing' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>{c.paymentStatus}</span>
                        </td>
                        <td className="px-2.5 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            c.verificationState === 'Verified' ? 'bg-emerald-100 text-emerald-700' :
                            c.verificationState === 'Flagged' ? 'bg-red-100 text-red-700' :
                            'bg-surface-100 text-surface-600'
                          }`}>{c.verificationState}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'families' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-surface-900">Affected Families ({families.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface-50">
                      {['ID','Head of Family','Village','Members','Displaced','Landholding','Compensation','R&R Status'].map(h => (
                        <th key={h} className="px-2.5 py-2 text-left font-semibold text-surface-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {families.map(f => (
                      <tr key={f.id} className="border-b border-surface-100 hover:bg-surface-50">
                        <td className="px-2.5 py-2 font-mono text-surface-500">{f.id}</td>
                        <td className="px-2.5 py-2 text-surface-700 font-medium">{f.headOfFamily}</td>
                        <td className="px-2.5 py-2 text-surface-600">{f.village}</td>
                        <td className="px-2.5 py-2 text-surface-700">{f.members}</td>
                        <td className="px-2.5 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${f.isDisplaced ? 'bg-red-100 text-red-700' : 'bg-surface-100 text-surface-600'}`}>
                            {f.isDisplaced ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-2.5 py-2 text-surface-600">{f.landholding.toFixed(2)} Ha</td>
                        <td className="px-2.5 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            f.compensationStatus === 'Disbursed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>{f.compensationStatus}</span>
                        </td>
                        <td className="px-2.5 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            f.rrStatus === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                            f.rrStatus === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-surface-100 text-surface-600'
                          }`}>{f.rrStatus}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-surface-900">Project Milestones</h3>
              <div className="space-y-2">
                {milestones.map(m => (
                  <div key={m.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                    m.status === 'Completed' ? 'bg-emerald-50 border-emerald-200' :
                    m.status === 'Overdue' ? 'bg-red-50 border-red-200' :
                    m.status === 'In Progress' ? 'bg-blue-50 border-blue-200' :
                    'bg-surface-50 border-surface-200'
                  }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      m.status === 'Completed' ? 'bg-emerald-500 text-white' :
                      m.status === 'Overdue' ? 'bg-red-500 text-white' :
                      m.status === 'In Progress' ? 'bg-blue-500 text-white' :
                      'bg-surface-300 text-white'
                    }`}>
                      {m.status === 'Completed' ? <CheckCircle size={14} /> : m.status === 'Overdue' ? <AlertTriangle size={14} /> : <Clock size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-surface-800">{m.name}</p>
                      <p className="text-[10px] text-surface-500">{m.owner} • Planned: {m.plannedDate}{m.actualDate ? ` • Actual: ${m.actualDate}` : ''}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        m.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        m.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                        m.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-surface-100 text-surface-600'
                      }`}>{m.status}</span>
                      {m.delayDays > 0 && <p className="text-[10px] text-red-500 mt-0.5">{m.delayDays} days delayed</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-surface-900">Documents ({documents.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {documents.map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg border border-surface-200">
                    <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-surface-800 truncate">{d.name}</p>
                      <p className="text-[10px] text-surface-400">{d.category} • v{d.version} • {(d.fileSize / 1024).toFixed(0)} KB</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      d.verificationState === 'Verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>{d.verificationState}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'risk' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-surface-900">Risk Intelligence</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Overall', level: project.riskLevel },
                  { label: 'Timeline', level: overdueMilestones.length > 2 ? 'High' as const : overdueMilestones.length > 0 ? 'Medium' as const : 'Low' as const },
                  { label: 'Financial', level: (totalCompAssessed - totalCompPaid > totalCompAssessed * 0.5) ? 'High' as const : 'Medium' as const },
                  { label: 'R&R', level: displacedFamilies.length > rrCompleted.length * 2 ? 'High' as const : 'Low' as const },
                ].map(r => (
                  <div key={r.label} className={`rounded-lg p-3 ${
                    r.level === 'Critical' ? 'bg-red-50 border border-red-200' :
                    r.level === 'High' ? 'bg-orange-50 border border-orange-200' :
                    r.level === 'Medium' ? 'bg-amber-50 border border-amber-200' :
                    'bg-emerald-50 border border-emerald-200'
                  }`}>
                    <p className="text-[10px] text-surface-500">{r.label} Risk</p>
                    <p className={`text-sm font-bold mt-1 ${
                      r.level === 'Critical' ? 'text-red-700' :
                      r.level === 'High' ? 'text-orange-700' :
                      r.level === 'Medium' ? 'text-amber-700' : 'text-emerald-700'
                    }`}>{r.level}</p>
                  </div>
                ))}
              </div>
              {riskFactors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-amber-800 mb-2">Risk Factors</h4>
                  <ul className="space-y-1">
                    {riskFactors.map((f, i) => (
                      <li key={i} className="text-xs text-amber-700 flex items-start gap-2">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {riskRecommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-blue-800 mb-2">Recommended Actions</h4>
                  <ul className="space-y-1">
                    {riskRecommendations.map((r, i) => (
                      <li key={i} className="text-xs text-blue-700 flex items-start gap-2">
                        <CheckCircle size={12} className="mt-0.5 shrink-0" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-[10px] text-surface-400 italic">
                Risk assessment is computed from measurable project factors (overdue milestones, compensation backlog, acquisition progress, document completeness). No external AI model is used. Architecture supports future LLM integration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
