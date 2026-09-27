import React from 'react';

export type SemanticStatus =
  | 'Completed'
  | 'Acquired'
  | 'On Track'
  | 'Pending'
  | 'Under Review'
  | 'Delayed'
  | 'Critical'
  | 'Disputed'
  | 'Proposed'
  | 'Notified'
  | 'Draft'
  | 'Published'
  | 'Approved'
  | 'Disbursed'
  | 'Partial'
  | 'Verified'
  | 'Active'
  | 'Acknowledged'
  | 'Resolved'
  | string;

interface StatusBadgeProps {
  status: SemanticStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export function getStatusStyle(status: string): { badgeClass: string; dotClass: string } {
  const normalized = status.toLowerCase().trim();

  // Completed / Acquired -> Emerald
  if (['completed', 'acquired', 'disbursed', 'resolved', 'done'].includes(normalized)) {
    return {
      badgeClass: 'status-badge-emerald text-emerald-800 bg-emerald-500/10 border-emerald-500/25',
      dotClass: 'bg-emerald-500',
    };
  }

  // On Track -> Teal
  if (['on track', 'active', 'healthy', 'verified'].includes(normalized)) {
    return {
      badgeClass: 'status-badge-teal text-teal-800 bg-teal-500/10 border-teal-500/25',
      dotClass: 'bg-teal-500',
    };
  }

  // Pending / Assessed -> Violet
  if (['pending', 'assessed', 'issued', 'in progress'].includes(normalized)) {
    return {
      badgeClass: 'status-badge-violet text-violet-800 bg-violet-500/10 border-violet-500/25',
      dotClass: 'bg-violet-500',
    };
  }

  // Under Review -> Indigo
  if (['under review', 'acknowledged', 'scrutiny'].includes(normalized)) {
    return {
      badgeClass: 'status-badge-indigo text-indigo-800 bg-indigo-500/10 border-indigo-500/25',
      dotClass: 'bg-indigo-500',
    };
  }

  // Delayed / Partial -> Amber
  if (['delayed', 'warning', 'partial', 'pending verification'].includes(normalized)) {
    return {
      badgeClass: 'status-badge-amber text-amber-800 bg-amber-500/10 border-amber-500/25',
      dotClass: 'bg-amber-500',
    };
  }

  // Critical -> Coral / Red
  if (['critical', 'urgent', 'overdue', 'failed'].includes(normalized)) {
    return {
      badgeClass: 'status-badge-coral text-coral-800 bg-coral-500/10 border-coral-500/25',
      dotClass: 'bg-coral-500',
    };
  }

  // Disputed / Rejected -> Rose
  if (['disputed', 'rejected', 'cancelled'].includes(normalized)) {
    return {
      badgeClass: 'status-badge-rose text-rose-800 bg-rose-500/10 border-rose-500/25',
      dotClass: 'bg-rose-500',
    };
  }

  // Proposed / Approved -> Blue
  if (['proposed', 'approved', 'draft'].includes(normalized)) {
    return {
      badgeClass: 'status-badge-blue text-blue-800 bg-blue-500/10 border-blue-500/25',
      dotClass: 'bg-blue-500',
    };
  }

  // Notified -> Cyan
  if (['notified', 'published', 'notice issued'].includes(normalized)) {
    return {
      badgeClass: 'status-badge-cyan text-cyan-800 bg-cyan-500/10 border-cyan-500/25',
      dotClass: 'bg-cyan-500',
    };
  }

  // Fallback Neutral
  return {
    badgeClass: 'text-surface-700 bg-surface-100 border-surface-200/80',
    dotClass: 'bg-surface-400',
  };
}

export default function StatusBadge({
  status,
  size = 'md',
  showDot = true,
  className = '',
}: StatusBadgeProps) {
  const { badgeClass, dotClass } = getStatusStyle(status);

  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0.5 gap-1',
    md: 'text-[10px] px-2 py-0.5 gap-1.5',
    lg: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border transition-all ${sizeClasses[size]} ${badgeClass} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass} ${
            ['critical', 'urgent', 'active'].includes(status.toLowerCase()) ? 'animate-pulse' : ''
          }`}
        />
      )}
      <span>{status}</span>
    </span>
  );
}
