// ============================================================
// BhoomiSetu - Core Data Types
// National Land Acquisition & Management Intelligence Platform
// ============================================================

// --- Enums ---

export type ProjectStatus = 'On Track' | 'Delayed' | 'Critical' | 'Completed' | 'Under Review' | 'Pending Approval' | 'Archived';
export type ProjectType = 'Highway' | 'Railway' | 'Industrial' | 'Township' | 'Dam/Irrigation' | 'Airport' | 'Defense' | 'Smart City' | 'Solar Park' | 'Other';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type Priority = 'Low' | 'Normal' | 'High' | 'Urgent';

export type WorkflowStage =
  | 'Proposal Draft'
  | 'Submitted'
  | 'Digital Scrutiny'
  | 'Verification'
  | 'District Approval'
  | 'State Approval'
  | 'Central Approval'
  | 'Preliminary Notification'
  | 'Objection/Hearing'
  | 'Final Declaration'
  | 'Award'
  | 'Compensation Processing'
  | 'Compensation Disbursed'
  | 'Possession'
  | 'R&R'
  | 'Closed';

export const WORKFLOW_STAGES: WorkflowStage[] = [
  'Proposal Draft', 'Submitted', 'Digital Scrutiny', 'Verification',
  'District Approval', 'State Approval', 'Central Approval',
  'Preliminary Notification', 'Objection/Hearing', 'Final Declaration',
  'Award', 'Compensation Processing', 'Compensation Disbursed',
  'Possession', 'R&R', 'Closed'
];

export type LandType = 'Agricultural' | 'Residential' | 'Commercial' | 'Industrial' | 'Forest' | 'Government' | 'Wasteland' | 'Wetland';
export type AcquisitionStatus = 'Proposed' | 'Notified' | 'Under Acquisition' | 'Acquired' | 'Disputed' | 'Exempt';
export type CompensationStatus = 'Not Assessed' | 'Assessed' | 'Approved' | 'Disbursed' | 'Partial' | 'Disputed' | 'Pending';
export type PossessionStatus = 'Not Due' | 'Notice Issued' | 'Partial' | 'Completed' | 'Delayed' | 'Disputed';
export type RRStatus = 'Not Started' | 'In Progress' | 'Partial' | 'Completed' | 'Pending Verification';
export type AlertSeverity = 'Info' | 'Warning' | 'Critical' | 'Urgent';
export type AlertStatus = 'Active' | 'Acknowledged' | 'Resolved' | 'Snoozed';
export type DocumentCategory = 'Land Records' | 'Notifications' | 'Awards' | 'Compensation' | 'Legal' | 'Survey' | 'R&R' | 'Maps' | 'Other';
export type NotificationType = 'Preliminary (Section 11)' | 'Final (Section 19)' | 'Hearing Notice' | 'Award Notice' | 'Possession Notice' | 'R&R Notice' | 'General';

export type UserRole =
  | 'National Administrator'
  | 'Central Ministry Officer'
  | 'State Authority'
  | 'District Collector'
  | 'Land Acquisition Officer'
  | 'Project Implementing Agency'
  | 'Field Verification Officer'
  | 'R&R Officer'
  | 'Policy Analyst';

// --- Interfaces ---

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  state?: string;
  district?: string;
  department?: string;
  avatar?: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface Project {
  id: string;
  name: string;
  requiringBody: string;
  projectType: ProjectType;
  state: string;
  stateCode?: string;
  district: string;
  districtCode?: string;
  location?: string;
  latitude: number;
  longitude: number;
  description: string;
  landProposed: number; // hectares
  landAcquired: number;
  landNotified: number;
  currentStage: WorkflowStage;
  status: ProjectStatus;
  priority: Priority;
  riskLevel: RiskLevel;
  targetStartDate: string;
  targetCompletionDate: string;
  actualStartDate?: string;
  actualCompletionDate?: string;
  responsibleAuthority: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LandParcel {
  id: string; // parcelId
  ulpin: string; // 14-character alphanumeric Bhu-Aadhar standard
  projectId: string;
  state: string;
  stateCode: string;
  district: string;
  districtCode: string;
  village: string;
  surveyNumber: string;
  area: number; // hectares (standard parcelArea)
  parcelArea?: number; // alias
  landType: LandType;
  ownership: string; // standardized field
  ownershipStatus: string; // backwards compatibility
  ownerName: string;
  acquisitionStatus: AcquisitionStatus;
  compensationStatus: CompensationStatus;
  possessionStatus: PossessionStatus;
  verificationStatus: 'Pending' | 'Verified' | 'Rejected' | 'Re-verification';
  cadastralReference: string;
  workflowStage?: WorkflowStage;
  rrStatus?: RRStatus;
  latitude?: number;
  longitude?: number;
  coordinates?: [number, number][]; // Cadastral polygon boundary
  verifiedBy?: string;
  verifiedAt?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AffectedFamily {
  id: string;
  projectId: string;
  headOfFamily: string;
  village: string;
  district: string;
  state: string;
  members: number;
  isDisplaced: boolean;
  landholding: number; // hectares
  compensationEligibility: number;
  compensationStatus: CompensationStatus;
  rrStatus: RRStatus;
  housingAssistance: boolean;
  livelihoodAssistance: boolean;
  relocationCompleted: boolean;
  assistanceReceived: string[];
  contactMasked: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  projectId: string;
  notificationType: NotificationType;
  dateIssued: string;
  authority: string;
  publicationStatus: 'Draft' | 'Published' | 'Withdrawn';
  effectiveDate?: string;
  documentId?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Award {
  id: string;
  projectId: string;
  parcelId: string;
  beneficiary: string;
  awardDate: string;
  landArea: number;
  assessedAmount: number;
  awardAmount: number;
  status: 'Draft' | 'Issued' | 'Accepted' | 'Disputed' | 'Revised';
  createdAt: string;
  updatedAt: string;
}

export interface CompensationRecord {
  id: string;
  projectId: string;
  parcelId: string;
  familyId?: string;
  beneficiary: string;
  assessedAmount: number;
  approvedAmount: number;
  paidAmount: number;
  bankAccount: string;
  paymentStatus: 'Pending' | 'Approved' | 'Processing' | 'Disbursed' | 'Failed' | 'Disputed';
  awardId?: string;
  verificationState: 'Unverified' | 'Verified' | 'Flagged';
  disbursedDate?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PossessionRecord {
  id: string;
  projectId: string;
  parcelId: string;
  dueDate: string;
  noticeDate?: string;
  completedDate?: string;
  status: PossessionStatus;
  possessionOfficer?: string;
  handoverDate?: string;
  isPartial: boolean;
  remarks?: string;
  documentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  plannedDate: string;
  actualDate?: string;
  owner: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue' | 'Skipped';
  dependency?: string;
  delayDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  projectId?: string;
  parcelId?: string;
  name: string;
  category: DocumentCategory;
  version: number;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: number;
  mimeType: string;
  verificationState: 'Pending' | 'Verified' | 'Rejected';
  remarks?: string;
  tags: string[];
}

export interface Alert {
  id: string;
  projectId?: string;
  severity: AlertSeverity;
  title: string;
  reason: string;
  timestamp: string;
  responsibleOfficer?: string;
  recommendedAction: string;
  status: AlertStatus;
  resolvedAt?: string;
  resolvedBy?: string;
  snoozedUntil?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
}

export interface WorkflowTransition {
  id: string;
  projectId: string;
  fromStage: WorkflowStage;
  toStage: WorkflowStage;
  action: 'Submit' | 'Approve' | 'Reject' | 'Revise' | 'Escalate';
  performedBy: string;
  performedByRole: UserRole;
  timestamp: string;
  remarks?: string;
  rejectionReason?: string;
}

export interface Integration {
  id: string;
  name: string;
  type: string;
  endpoint: string;
  status: 'Connected' | 'Disconnected' | 'Error' | 'Sandbox';
  lastSync?: string;
  recordsSynced: number;
  errors: number;
  description: string;
}

export interface RiskAssessment {
  projectId: string;
  overallRisk: RiskLevel;
  timelineRisk: RiskLevel;
  financialRisk: RiskLevel;
  rrRisk: RiskLevel;
  documentationRisk: RiskLevel;
  factors: string[];
  recommendations: string[];
  calculatedAt: string;
}

// --- Permission System ---
export interface Permission {
  canViewNational: boolean;
  canViewState: boolean;
  canViewDistrict: boolean;
  canCreateProject: boolean;
  canEditProject: boolean;
  canApproveProject: boolean;
  canManageUsers: boolean;
  canManageIntegrations: boolean;
  canVerifyParcel: boolean;
  canGeoTag: boolean;
  canManageCompensation: boolean;
  canManageAwards: boolean;
  canManagePossession: boolean;
  canManageRR: boolean;
  canManageDocuments: boolean;
  canGenerateReports: boolean;
  canViewAudit: boolean;
  canManageAlerts: boolean;
  canExportData: boolean;
  canApproveWorkflow: boolean;
  canRejectWorkflow: boolean;
  approvalLevel: number; // 0=none, 1=district, 2=state, 3=central
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  'National Administrator': {
    canViewNational: true, canViewState: true, canViewDistrict: true,
    canCreateProject: true, canEditProject: true, canApproveProject: true,
    canManageUsers: true, canManageIntegrations: true, canVerifyParcel: true,
    canGeoTag: true, canManageCompensation: true, canManageAwards: true,
    canManagePossession: true, canManageRR: true, canManageDocuments: true,
    canGenerateReports: true, canViewAudit: true, canManageAlerts: true,
    canExportData: true, canApproveWorkflow: true, canRejectWorkflow: true,
    approvalLevel: 3,
  },
  'Central Ministry Officer': {
    canViewNational: true, canViewState: true, canViewDistrict: true,
    canCreateProject: true, canEditProject: true, canApproveProject: true,
    canManageUsers: false, canManageIntegrations: false, canVerifyParcel: false,
    canGeoTag: false, canManageCompensation: true, canManageAwards: true,
    canManagePossession: true, canManageRR: true, canManageDocuments: true,
    canGenerateReports: true, canViewAudit: true, canManageAlerts: true,
    canExportData: true, canApproveWorkflow: true, canRejectWorkflow: true,
    approvalLevel: 3,
  },
  'State Authority': {
    canViewNational: false, canViewState: true, canViewDistrict: true,
    canCreateProject: true, canEditProject: true, canApproveProject: true,
    canManageUsers: false, canManageIntegrations: false, canVerifyParcel: false,
    canGeoTag: false, canManageCompensation: true, canManageAwards: true,
    canManagePossession: true, canManageRR: true, canManageDocuments: true,
    canGenerateReports: true, canViewAudit: true, canManageAlerts: true,
    canExportData: true, canApproveWorkflow: true, canRejectWorkflow: true,
    approvalLevel: 2,
  },
  'District Collector': {
    canViewNational: false, canViewState: false, canViewDistrict: true,
    canCreateProject: true, canEditProject: true, canApproveProject: true,
    canManageUsers: false, canManageIntegrations: false, canVerifyParcel: true,
    canGeoTag: false, canManageCompensation: true, canManageAwards: true,
    canManagePossession: true, canManageRR: true, canManageDocuments: true,
    canGenerateReports: true, canViewAudit: true, canManageAlerts: true,
    canExportData: true, canApproveWorkflow: true, canRejectWorkflow: true,
    approvalLevel: 1,
  },
  'Land Acquisition Officer': {
    canViewNational: false, canViewState: false, canViewDistrict: true,
    canCreateProject: false, canEditProject: true, canApproveProject: false,
    canManageUsers: false, canManageIntegrations: false, canVerifyParcel: true,
    canGeoTag: true, canManageCompensation: true, canManageAwards: true,
    canManagePossession: true, canManageRR: false, canManageDocuments: true,
    canGenerateReports: true, canViewAudit: false, canManageAlerts: true,
    canExportData: true, canApproveWorkflow: false, canRejectWorkflow: false,
    approvalLevel: 0,
  },
  'Project Implementing Agency': {
    canViewNational: false, canViewState: false, canViewDistrict: true,
    canCreateProject: true, canEditProject: true, canApproveProject: false,
    canManageUsers: false, canManageIntegrations: false, canVerifyParcel: false,
    canGeoTag: false, canManageCompensation: false, canManageAwards: false,
    canManagePossession: false, canManageRR: false, canManageDocuments: true,
    canGenerateReports: true, canViewAudit: false, canManageAlerts: false,
    canExportData: true, canApproveWorkflow: false, canRejectWorkflow: false,
    approvalLevel: 0,
  },
  'Field Verification Officer': {
    canViewNational: false, canViewState: false, canViewDistrict: true,
    canCreateProject: false, canEditProject: false, canApproveProject: false,
    canManageUsers: false, canManageIntegrations: false, canVerifyParcel: true,
    canGeoTag: true, canManageCompensation: false, canManageAwards: false,
    canManagePossession: false, canManageRR: false, canManageDocuments: true,
    canGenerateReports: false, canViewAudit: false, canManageAlerts: false,
    canExportData: false, canApproveWorkflow: false, canRejectWorkflow: false,
    approvalLevel: 0,
  },
  'R&R Officer': {
    canViewNational: false, canViewState: false, canViewDistrict: true,
    canCreateProject: false, canEditProject: false, canApproveProject: false,
    canManageUsers: false, canManageIntegrations: false, canVerifyParcel: false,
    canGeoTag: false, canManageCompensation: false, canManageAwards: false,
    canManagePossession: false, canManageRR: true, canManageDocuments: true,
    canGenerateReports: true, canViewAudit: false, canManageAlerts: true,
    canExportData: true, canApproveWorkflow: false, canRejectWorkflow: false,
    approvalLevel: 0,
  },
  'Policy Analyst': {
    canViewNational: true, canViewState: true, canViewDistrict: true,
    canCreateProject: false, canEditProject: false, canApproveProject: false,
    canManageUsers: false, canManageIntegrations: false, canVerifyParcel: false,
    canGeoTag: false, canManageCompensation: false, canManageAwards: false,
    canManagePossession: false, canManageRR: false, canManageDocuments: false,
    canGenerateReports: true, canViewAudit: true, canManageAlerts: false,
    canExportData: true, canApproveWorkflow: false, canRejectWorkflow: false,
    approvalLevel: 0,
  },
};

// --- Navigation ---
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  requiredPermission?: keyof Permission;
  children?: NavItem[];
  badge?: number;
}
