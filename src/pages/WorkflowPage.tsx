// ============================================================
// BhoomiSetu - Acquisition Workflow Governance (Section G)
// Multi-level statutory approvals with role-based governance & audit
// ============================================================
import React, { useMemo, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch, Play, XCircle, RotateCcw, CheckCircle, Clock, ArrowRight,
  Filter, Shield, AlertTriangle, FileText, UserCheck, X
} from 'lucide-react';
import { WORKFLOW_STAGES, type WorkflowStage, type Project } from '../types';

interface ActionModalState {
  project: Project;
  action: 'Submit' | 'Approve' | 'Reject' | 'Revise';
  nextStage: WorkflowStage;
}

export default function WorkflowPage() {
  const store = useStore();
  const { user, permissions } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [stageFilter, setStageFilter] = useState('');
  const [processingProjects, setProcessingProjects] = useState<Record<string, boolean>>({});
  const [actionModal, setActionModal] = useState<ActionModalState | null>(null);
  const [transitionRemarks, setTransitionRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const projects = store.getProjects();

  const filtered = useMemo(() => {
    let items = projects.filter(p => p.currentStage !== 'Closed');
    if (stageFilter) items = items.filter(p => p.currentStage === stageFilter);
    return items;
  }, [projects, stageFilter]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => { counts[p.currentStage] = (counts[p.currentStage] || 0) + 1; });
    return counts;
  }, [projects]);

  const openActionModal = (proj: Project, action: 'Submit' | 'Approve' | 'Reject' | 'Revise') => {
    const currentIdx = WORKFLOW_STAGES.indexOf(proj.currentStage);
    let nextStage: WorkflowStage = proj.currentStage;
    if (action === 'Approve' || action === 'Submit') {
      nextStage = WORKFLOW_STAGES[Math.min(WORKFLOW_STAGES.length - 1, currentIdx + 1)];
    } else if (action === 'Reject') {
      nextStage = WORKFLOW_STAGES[Math.max(0, currentIdx - 1)];
    } else {
      nextStage = WORKFLOW_STAGES[Math.max(0, currentIdx - 2)];
    }

    setTransitionRemarks('');
    setRejectionReason('');
    setActionModal({ project: proj, action, nextStage });
  };

  const handleExecuteTransition = () => {
    if (!actionModal || !user) return;
    const { project, action } = actionModal;

    if (action === 'Reject' && !rejectionReason.trim()) {
      toast.error('Statutory rejection reason is required.');
      return;
    }

    if (processingProjects[project.id]) return;

    // Concurrency lock in UI
    setProcessingProjects(prev => ({ ...prev, [project.id]: true }));

    try {
      const result = store.transitionProject(
        project.id,
        action,
        user.id,
        user.name,
        user.role,
        transitionRemarks || undefined,
        rejectionReason || undefined,
        project.currentStage // Expected current stage validation
      );

      if (result.success) {
        toast.success(result.message);
        setActionModal(null);
      } else {
        toast.error(result.message);
      }
    } finally {
      setTimeout(() => {
        setProcessingProjects(prev => {
          const next = { ...prev };
          delete next[project.id];
          return next;
        });
      }, 700);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <GitBranch className="text-primary-600" size={22} />
            Statutory Acquisition Workflow Governance
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            Section G: Role-based stage gates with single-click transition protection and audit trails
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg glass-card text-surface-700 border border-white/60">
            Active User: <strong className="text-primary-950">{user?.name}</strong> ({user?.role})
          </span>
        </div>
      </div>

      {/* Stage Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          onClick={() => setStageFilter('')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            !stageFilter
              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-sm ring-2 ring-primary-500/20'
              : 'glass-card text-surface-600 hover:text-surface-900 hover:bg-white/80'
          }`}
        >
          All Stages ({projects.filter(p => p.currentStage !== 'Closed').length})
        </button>
        {WORKFLOW_STAGES.filter(s => s !== 'Closed').map(stage => (
          <button
            key={stage}
            onClick={() => setStageFilter(stage)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              stageFilter === stage
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-sm ring-2 ring-primary-500/20'
                : 'glass-card text-surface-600 hover:text-surface-900 hover:bg-white/80'
            }`}
          >
            {stage.length > 15 ? stage.substring(0, 13) + '..' : stage} ({stageCounts[stage] || 0})
          </button>
        ))}
      </div>

      {/* Project Cards List */}
      <div className="space-y-3">
        {filtered.map(proj => {
          const stageIdx = WORKFLOW_STAGES.indexOf(proj.currentStage);
          const progress = Math.round((stageIdx / (WORKFLOW_STAGES.length - 1)) * 100);
          const isBusy = Boolean(processingProjects[proj.id]);

          // Authority Check
          const isDistrictStage = proj.currentStage === 'District Approval';
          const isStateStage = proj.currentStage === 'State Approval';
          const isCentralStage = proj.currentStage === 'Central Approval';

          const hasStageAuthority =
            (!isDistrictStage && !isStateStage && !isCentralStage) ||
            (isDistrictStage && (permissions?.approvalLevel || 0) >= 1) ||
            (isStateStage && (permissions?.approvalLevel || 0) >= 2) ||
            (isCentralStage && (permissions?.approvalLevel || 0) >= 3);

          return (
            <div
              key={proj.id}
              className="glass-panel p-4 hover:border-primary-400/40 hover:shadow-md transition-all space-y-3"
            >
              {/* Stage Stepper Visual Pipeline */}
              <div className="pt-1 overflow-x-auto scrollbar-thin pb-1">
                <div className="flex items-center gap-1.5 min-w-[700px]">
                  {WORKFLOW_STAGES.filter(s => s !== 'Closed').map((stg, idx) => {
                    const isCompleted = idx < stageIdx;
                    const isCurrent = idx === stageIdx;
                    const isProblem = isCurrent && (proj.status === 'Delayed' || proj.status === 'Critical');

                    return (
                      <div
                        key={stg}
                        className={`flex-1 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border transition-all ${
                          isProblem
                            ? 'bg-amber-500/15 text-amber-900 border-amber-500/40 font-bold shadow-xs'
                            : isCurrent
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                            : isCompleted
                            ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30 font-medium'
                            : 'bg-surface-100/60 text-surface-400 border-surface-200/40'
                        }`}
                        title={`Stage ${idx + 1}: ${stg}`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold ${
                            isProblem
                              ? 'bg-amber-600 text-white'
                              : isCurrent
                              ? 'bg-white text-blue-700'
                              : isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-surface-300 text-surface-600'
                          }`}
                        >
                          {isCompleted ? '✓' : idx + 1}
                        </span>
                        <span className="truncate">{stg}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-surface-200/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/projects/${proj.id}`)}
                      className="text-sm font-bold text-primary-700 hover:text-primary-800 transition-colors truncate"
                    >
                      {proj.name}
                    </button>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                        proj.status === 'On Track' ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-300/50' :
                        proj.status === 'Delayed' ? 'bg-amber-100/90 text-amber-800 border border-amber-300/50' :
                        proj.status === 'Critical' ? 'bg-red-100/90 text-red-800 border border-red-300/50' :
                        'bg-surface-100/80 text-surface-700'
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>

                  <p className="text-xs text-surface-500 mt-0.5 font-medium">
                    {proj.id} • {proj.district}, {proj.state} • {proj.projectType} • Land: {proj.landProposed} Ha
                  </p>
                </div>

                {/* Actions */}
                {permissions?.canApproveWorkflow && stageIdx < WORKFLOW_STAGES.length - 1 && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={isBusy || !hasStageAuthority}
                      onClick={() => openActionModal(proj, stageIdx < 2 ? 'Submit' : 'Approve')}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm ${
                        isBusy || !hasStageAuthority
                          ? 'opacity-50 cursor-not-allowed'
                          : 'active:scale-95 shadow-emerald-900/15'
                      }`}
                      title={!hasStageAuthority ? 'Your user role does not hold clearance authority for this statutory stage.' : undefined}
                    >
                      <Play size={11} className={isBusy ? 'animate-spin' : ''} />
                      {stageIdx < 2 ? 'Submit' : 'Approve Stage'}
                    </button>

                    <button
                      disabled={isBusy}
                      onClick={() => openActionModal(proj, 'Reject')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50/90 text-rose-700 border border-rose-200/80 text-xs font-semibold rounded-xl transition-all hover:bg-rose-100/80 active:scale-95 ${
                        isBusy ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <XCircle size={12} /> Reject
                    </button>

                    <button
                      disabled={isBusy}
                      onClick={() => openActionModal(proj, 'Revise')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 glass-card text-surface-700 hover:text-surface-900 hover:bg-white text-xs font-semibold rounded-xl transition-all active:scale-95 ${
                        isBusy ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title="Request Revision from Requiring Agency"
                    >
                      <RotateCcw size={12} /> Revise
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Statutory Transition Confirmation Modal (Section G Requirement) */}
      {actionModal && (
        <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-modal w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200/50 bg-white/40">
              <div>
                <span className="text-[10px] uppercase font-bold text-surface-500 tracking-wider">Workflow Action Confirmation</span>
                <h3 className="text-sm font-bold text-surface-900 mt-0.5">
                  {actionModal.action}: {actionModal.project.name}
                </h3>
              </div>
              <button onClick={() => setActionModal(null)} className="p-1 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-white/60">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Stage Transition Visual */}
              <div className="glass-card p-3 rounded-xl border border-white/60 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-surface-500 uppercase font-semibold">Current Stage</p>
                  <p className="font-bold text-surface-800 text-xs mt-0.5">{actionModal.project.currentStage}</p>
                </div>
                <ArrowRight size={16} className="text-primary-600" />
                <div className="text-right">
                  <p className="text-[10px] text-surface-500 uppercase font-semibold">Target Stage</p>
                  <p className="font-bold text-primary-700 text-xs mt-0.5">{actionModal.nextStage}</p>
                </div>
              </div>

              {/* Acting Authority Information */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50/80 text-blue-900 border border-blue-200/60">
                <UserCheck size={16} className="text-blue-600 shrink-0" />
                <div className="text-[11px]">
                  <span>Acting Authority: <strong>{user?.name}</strong></span>
                  <p className="text-blue-700 font-medium">Authorized Role: {user?.role}</p>
                </div>
              </div>

              {/* Mandatory Rejection Reason if Reject */}
              {actionModal.action === 'Reject' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-red-700">
                    Statutory Rejection Reason * (Mandatory for Audit Trail)
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Specify grounds of objection, defect in notice, or non-compliance with RFCTLARR..."
                    className="w-full p-2.5 rounded-xl border border-red-200 bg-white/90 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/30 font-sans"
                  />
                </div>
              )}

              {/* Transition Remarks */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-surface-700">
                  {actionModal.action === 'Revise' ? 'Revision Instructions *' : 'Approval Remarks / Order Reference'}
                </label>
                <textarea
                  rows={2}
                  value={transitionRemarks}
                  onChange={e => setTransitionRemarks(e.target.value)}
                  placeholder="Enter endorsement notes, gazette dispatch reference, or revision instructions..."
                  className="glass-input w-full p-2.5 text-xs font-sans"
                />
              </div>
            </div>

            <div className="flex gap-2 px-5 py-3 border-t border-surface-200/50 bg-white/30">
              <button
                onClick={() => setActionModal(null)}
                className="flex-1 py-2 text-xs font-semibold text-surface-600 hover:bg-surface-200/60 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteTransition}
                disabled={Boolean(processingProjects[actionModal.project.id])}
                className={`flex-1 py-2 text-xs font-semibold text-white rounded-xl transition-all shadow-sm ${
                  actionModal.action === 'Reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                Confirm {actionModal.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
