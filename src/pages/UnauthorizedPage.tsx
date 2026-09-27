// ============================================================
// BhoomiSetu — Unauthorized Access Page
// RBAC Security Boundary Notice
// ============================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="glass-panel p-8 max-w-md w-full text-center shadow-xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert size={28} />
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-navy">Access Restricted</h1>
          <p className="text-xs text-surface-500">
            RBAC Authorization Policy Violation (403 Forbidden)
          </p>
        </div>

        <div className="p-3 rounded-lg bg-surface-100/80 border border-surface-200 text-xs text-surface-700 text-left space-y-1 font-mono">
          <div><span className="text-surface-400">Authenticated:</span> {user?.name || 'Unknown User'}</div>
          <div><span className="text-surface-400">Assigned Role:</span> {user?.role || 'None'}</div>
          <div><span className="text-surface-400">Clearance:</span> Insufficient privileges for this statutory operation.</div>
        </div>

        <p className="text-xs text-surface-600 leading-relaxed">
          Your current account does not have permission to access this administrative resource. Contact your National Administrator or Department Head to request role elevation.
        </p>

        <div className="pt-2 flex items-center justify-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg glass-button-secondary text-xs font-medium flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Home size={14} /> Return to Command Center
          </button>
        </div>
      </div>
    </div>
  );
}
