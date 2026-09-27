// ============================================================
// BhoomiSetu - Data Store (Repository Pattern)
// Uses in-memory store with localStorage persistence
// Architected for future PostgreSQL/Supabase migration
// ============================================================
import type {
  Project, LandParcel, AffectedFamily, Notification, Award,
  CompensationRecord, PossessionRecord, Milestone, Document, Alert,
  AuditEvent, WorkflowTransition, Integration, User, WorkflowStage,
  UserRole
} from '../types';
import { WORKFLOW_STAGES } from '../types';
import { generateAllDemoData, type DemoData } from '../data/demoData';
import { v4 as uuidv4 } from 'uuid';

import { standardizeParcel } from '../types/standardSchema';
import { DISTRICT_COORDINATES } from '../utils/geoValidation';

const STORAGE_KEY = 'bhoomisetu_data_v2';

class DataStore {
  private data: DemoData;
  private listeners: Set<() => void> = new Set();

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.data = JSON.parse(saved);
        // Ensure projects have authoritative coordinates & location fields
        if (Array.isArray(this.data.projects)) {
          this.data.projects = this.data.projects.map(p => {
            const geo = DISTRICT_COORDINATES[p.district];
            return {
              ...p,
              latitude: typeof p.latitude === 'number' ? p.latitude : (geo ? geo.lat : 20.5937),
              longitude: typeof p.longitude === 'number' ? p.longitude : (geo ? geo.lng : 78.9629),
              stateCode: p.stateCode ?? (geo ? geo.stateCode : 'IN'),
              districtCode: p.districtCode ?? (geo ? geo.districtCode : '0000'),
              location: p.location ?? `${p.district}, ${p.state}`,
            };
          });
        }
        // Ensure parcels conform to standardized schema with valid ULPINs
        if (Array.isArray(this.data.parcels)) {
          this.data.parcels = this.data.parcels.map(p => (!p.ulpin || !p.stateCode) ? standardizeParcel(p) : p);
        }
      } catch {
        this.data = generateAllDemoData();
        this.persist();
      }
    } else {
      this.data = generateAllDemoData();
      this.persist();
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Storage limit reached, continuing with in-memory data');
    }
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn());
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  resetData() {
    this.data = generateAllDemoData();
    this.persist();
  }

  // --- Projects ---
  getProjects(): Project[] { return this.data.projects; }
  
  getProject(id: string): Project | undefined {
    return this.data.projects.find(p => p.id === id);
  }

  createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'latitude' | 'longitude'> & { latitude?: number; longitude?: number }): Project {
    const geo = DISTRICT_COORDINATES[project.district];
    const newProject: Project = {
      ...project,
      stateCode: project.stateCode || (geo ? geo.stateCode : undefined),
      districtCode: project.districtCode || (geo ? geo.districtCode : undefined),
      location: project.location || `${project.district}, ${project.state}`,
      latitude: typeof project.latitude === 'number' ? project.latitude : (geo ? geo.lat : 20.5937),
      longitude: typeof project.longitude === 'number' ? project.longitude : (geo ? geo.lng : 78.9629),
      id: `PRJ-${String(Date.now()).slice(-5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.projects = [newProject, ...this.data.projects];
    this.persist();
    return newProject;
  }

  updateProject(id: string, updates: Partial<Project>): Project | undefined {
    const idx = this.data.projects.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.data.projects[idx] = { ...this.data.projects[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.projects[idx];
  }

  // --- Parcels ---
  getParcels(): LandParcel[] { return this.data.parcels; }
  getParcelsByProject(projectId: string): LandParcel[] {
    return this.data.parcels.filter(p => p.projectId === projectId);
  }
  getParcel(id: string): LandParcel | undefined {
    return this.data.parcels.find(p => p.id === id);
  }
  createParcel(parcel: Partial<LandParcel> & { projectId: string; surveyNumber: string }): LandParcel {
    const proj = this.getProject(parcel.projectId);
    const geo = proj ? DISTRICT_COORDINATES[proj.district] : undefined;
    const lat = typeof parcel.latitude === 'number' ? parcel.latitude : (proj ? proj.latitude : (geo ? geo.lat : 20.5937));
    const lng = typeof parcel.longitude === 'number' ? parcel.longitude : (proj ? proj.longitude : (geo ? geo.lng : 78.9629));
    const state = parcel.state || (proj ? proj.state : 'Maharashtra');
    const district = parcel.district || (proj ? proj.district : 'Pune');
    const stateCode = parcel.stateCode || (proj ? (proj.stateCode || 'MH') : 'MH');
    const districtCode = parcel.districtCode || (proj ? (proj.districtCode || '2704') : '2704');

    const newParcel = standardizeParcel({
      ...parcel,
      state,
      district,
      stateCode,
      districtCode,
      latitude: lat,
      longitude: lng,
      id: parcel.id || `PRC-${String(Date.now()).slice(-5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    this.data.parcels = [newParcel, ...this.data.parcels];
    this.persist();
    return newParcel;
  }
  updateParcel(id: string, updates: Partial<LandParcel>): LandParcel | undefined {
    const idx = this.data.parcels.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.data.parcels[idx] = { ...this.data.parcels[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.parcels[idx];
  }

  // --- Families ---
  getFamilies(): AffectedFamily[] { return this.data.families; }
  getFamiliesByProject(projectId: string): AffectedFamily[] {
    return this.data.families.filter(f => f.projectId === projectId);
  }
  getFamily(id: string): AffectedFamily | undefined {
    return this.data.families.find(f => f.id === id);
  }
  updateFamily(id: string, updates: Partial<AffectedFamily>): AffectedFamily | undefined {
    const idx = this.data.families.findIndex(f => f.id === id);
    if (idx === -1) return undefined;
    const current = this.data.families[idx];
    const isUnchanged = Object.entries(updates).every(([k, v]) => (current as any)[k] === v);
    if (isUnchanged) return current;
    this.data.families[idx] = { ...this.data.families[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.families[idx];
  }

  createFamily(family: Omit<AffectedFamily, 'id' | 'createdAt' | 'updatedAt'>): AffectedFamily {
    const newFamily: AffectedFamily = {
      ...family,
      id: `FAM-${String(Date.now()).slice(-5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.families = [newFamily, ...this.data.families];
    this.persist();
    return newFamily;
  }

  // --- Notifications ---
  getNotifications(): Notification[] { return this.data.notifications; }
  getNotificationsByProject(projectId: string): Notification[] {
    return this.data.notifications.filter(n => n.projectId === projectId);
  }
  createNotification(notif: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Notification {
    const newNotif: Notification = {
      ...notif,
      id: `NTF-${String(Date.now()).slice(-5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.notifications = [newNotif, ...this.data.notifications];
    this.persist();
    return newNotif;
  }
  updateNotification(id: string, updates: Partial<Notification>): Notification | undefined {
    const idx = this.data.notifications.findIndex(n => n.id === id);
    if (idx === -1) return undefined;
    const current = this.data.notifications[idx];
    const isUnchanged = Object.entries(updates).every(([k, v]) => (current as any)[k] === v);
    if (isUnchanged) return current;
    this.data.notifications[idx] = { ...this.data.notifications[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.notifications[idx];
  }

  // --- Awards ---
  getAwards(): Award[] { return this.data.awards; }
  getAwardsByProject(projectId: string): Award[] {
    return this.data.awards.filter(a => a.projectId === projectId);
  }
  createAward(award: Omit<Award, 'id' | 'createdAt' | 'updatedAt'>): Award {
    const newAward: Award = {
      ...award,
      id: `AWD-${String(Date.now()).slice(-5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.awards = [newAward, ...this.data.awards];
    this.persist();
    return newAward;
  }
  updateAward(id: string, updates: Partial<Award>): Award | undefined {
    const idx = this.data.awards.findIndex(a => a.id === id);
    if (idx === -1) return undefined;
    const current = this.data.awards[idx];
    const isUnchanged = Object.entries(updates).every(([k, v]) => (current as any)[k] === v);
    if (isUnchanged) return current;
    this.data.awards[idx] = { ...this.data.awards[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.awards[idx];
  }

  // --- Compensation ---
  getCompensation(): CompensationRecord[] { return this.data.compensation; }
  getCompensationByProject(projectId: string): CompensationRecord[] {
    return this.data.compensation.filter(c => c.projectId === projectId);
  }
  updateCompensation(id: string, updates: Partial<CompensationRecord>): CompensationRecord | undefined {
    const idx = this.data.compensation.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    const current = this.data.compensation[idx];
    const isUnchanged = Object.entries(updates).every(([k, v]) => (current as any)[k] === v);
    if (isUnchanged) return current;
    this.data.compensation[idx] = { ...this.data.compensation[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.compensation[idx];
  }

  createCompensation(comp: Omit<CompensationRecord, 'id' | 'createdAt' | 'updatedAt'>): CompensationRecord {
    const newComp: CompensationRecord = {
      ...comp,
      id: `CMP-${String(Date.now()).slice(-5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.compensation = [newComp, ...this.data.compensation];
    this.persist();
    return newComp;
  }

  // --- Possession ---
  getPossession(): PossessionRecord[] { return this.data.possession; }
  getPossessionByProject(projectId: string): PossessionRecord[] {
    return this.data.possession.filter(p => p.projectId === projectId);
  }
  updatePossession(id: string, updates: Partial<PossessionRecord>): PossessionRecord | undefined {
    const idx = this.data.possession.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    const current = this.data.possession[idx];
    const isUnchanged = Object.entries(updates).every(([k, v]) => (current as any)[k] === v);
    if (isUnchanged) return current;
    this.data.possession[idx] = { ...this.data.possession[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.possession[idx];
  }

  // --- Milestones ---
  getMilestones(): Milestone[] { return this.data.milestones; }
  getMilestonesByProject(projectId: string): Milestone[] {
    return this.data.milestones.filter(m => m.projectId === projectId);
  }
  updateMilestone(id: string, updates: Partial<Milestone>): Milestone | undefined {
    const idx = this.data.milestones.findIndex(m => m.id === id);
    if (idx === -1) return undefined;
    const current = this.data.milestones[idx];
    const isUnchanged = Object.entries(updates).every(([k, v]) => (current as any)[k] === v);
    if (isUnchanged) return current;
    this.data.milestones[idx] = { ...this.data.milestones[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.milestones[idx];
  }

  createMilestone(milestone: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>): Milestone {
    const newMilestone: Milestone = {
      ...milestone,
      id: `MLS-${String(Date.now()).slice(-5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.milestones = [newMilestone, ...this.data.milestones];
    this.persist();
    return newMilestone;
  }

  // --- Documents ---
  getDocuments(): Document[] { return this.data.documents; }
  getDocumentsByProject(projectId: string): Document[] {
    return this.data.documents.filter(d => d.projectId === projectId);
  }
  createDocument(doc: Omit<Document, 'id'>): Document {
    const newDoc: Document = { ...doc, id: `DOC-${String(Date.now()).slice(-5)}` };
    this.data.documents = [newDoc, ...this.data.documents];
    this.persist();
    return newDoc;
  }
  updateDocument(id: string, updates: Partial<Document>): Document | undefined {
    const idx = this.data.documents.findIndex(d => d.id === id);
    if (idx === -1) return undefined;
    const current = this.data.documents[idx];
    const isUnchanged = Object.entries(updates).every(([k, v]) => (current as any)[k] === v);
    if (isUnchanged) return current;
    this.data.documents[idx] = { ...this.data.documents[idx], ...updates };
    this.persist();
    return this.data.documents[idx];
  }
  deleteDocument(id: string): boolean {
    const len = this.data.documents.length;
    this.data.documents = this.data.documents.filter(d => d.id !== id);
    if (this.data.documents.length < len) { this.persist(); return true; }
    return false;
  }

  // --- Alerts ---
  getAlerts(): Alert[] { return this.data.alerts; }
  updateAlert(id: string, updates: Partial<Alert>): Alert | undefined {
    const idx = this.data.alerts.findIndex(a => a.id === id);
    if (idx === -1) return undefined;
    const current = this.data.alerts[idx];
    const isUnchanged = Object.entries(updates).every(([k, v]) => (current as any)[k] === v);
    if (isUnchanged) return current;
    this.data.alerts[idx] = { ...this.data.alerts[idx], ...updates };
    this.persist();
    return this.data.alerts[idx];
  }

  // --- Audit ---
  getAuditEvents(): AuditEvent[] { return this.data.auditEvents; }
  addAuditEvent(event: Omit<AuditEvent, 'id'>): AuditEvent {
    // Deduplication check: ignore duplicate rapid audit logs (< 1500ms) for identical entity & action
    const last = this.data.auditEvents[0];
    if (
      last &&
      last.entityId === event.entityId &&
      last.action === event.action &&
      last.entityType === event.entityType &&
      Math.abs(new Date(event.timestamp).getTime() - new Date(last.timestamp).getTime()) < 1500
    ) {
      return last;
    }
    const newEvent: AuditEvent = { ...event, id: `AUD-${String(Date.now()).slice(-5)}-${Math.random().toString(36).slice(2,5)}` };
    this.data.auditEvents = [newEvent, ...this.data.auditEvents];
    this.persist();
    return newEvent;
  }

  // --- Workflow Transitions ---
  getTransitions(): WorkflowTransition[] { return this.data.transitions; }
  getTransitionsByProject(projectId: string): WorkflowTransition[] {
    return this.data.transitions.filter(t => t.projectId === projectId);
  }
  addTransition(transition: Omit<WorkflowTransition, 'id'>): WorkflowTransition {
    const newTransition: WorkflowTransition = {
      ...transition,
      id: `WFT-${String(Date.now()).slice(-5)}`,
    };
    this.data.transitions = [newTransition, ...this.data.transitions];
    this.persist();
    return newTransition;
  }

  // Workflow state transition with concurrency lock, debounce protection and stage validation
  private transitionLocks: Set<string> = new Set();
  private lastTransitionTimes: Map<string, number> = new Map();

  transitionProject(
    projectId: string,
    action: 'Submit' | 'Approve' | 'Reject' | 'Revise',
    userId: string,
    userName: string,
    userRole: UserRole,
    remarks?: string,
    rejectionReason?: string,
    expectedStage?: WorkflowStage
  ): { success: boolean; message: string } {
    // 1. In-flight lock: reject immediate concurrent submissions
    if (this.transitionLocks.has(projectId)) {
      return { success: false, message: 'Workflow transition is currently in progress. Please wait.' };
    }

    // 2. Debounce window: ignore rapid duplicate clicks within 800ms
    const now = Date.now();
    const lastTime = this.lastTransitionTimes.get(projectId) || 0;
    if (now - lastTime < 800) {
      return { success: false, message: 'Duplicate action ignored. Please wait a moment.' };
    }

    const project = this.getProject(projectId);
    if (!project) return { success: false, message: 'Project not found' };

    // 3. Strict current stage validation: ensure the action is executed against the persisted stage
    if (expectedStage && project.currentStage !== expectedStage) {
      return {
        success: false,
        message: `Stale workflow action: Project is at "${project.currentStage}", not "${expectedStage}". Please refresh.`
      };
    }

    const currentIdx = WORKFLOW_STAGES.indexOf(project.currentStage);
    if (currentIdx === -1) {
      return { success: false, message: `Invalid workflow stage: "${project.currentStage}"` };
    }

    // 4. Role-based stage authorization checks (Section G)
    if (action === 'Approve') {
      const stage = project.currentStage;
      if (stage === 'District Approval' && !['District Collector', 'State Authority', 'Central Ministry Officer', 'National Administrator'].includes(userRole)) {
        return { success: false, message: `Unauthorized: "District Approval" requires District Collector or higher authority.` };
      }
      if (stage === 'State Approval' && !['State Authority', 'Central Ministry Officer', 'National Administrator'].includes(userRole)) {
        return { success: false, message: `Unauthorized: "State Approval" requires State Authority or Central/National officer.` };
      }
      if (stage === 'Central Approval' && !['Central Ministry Officer', 'National Administrator'].includes(userRole)) {
        return { success: false, message: `Unauthorized: "Central Approval" requires Central Ministry Officer or National Administrator.` };
      }
    }

    let newStage: WorkflowStage;

    if (action === 'Approve' || action === 'Submit') {
      if (currentIdx >= WORKFLOW_STAGES.length - 1) {
        return { success: false, message: 'Project is already at final stage' };
      }
      // Strictly exactly ONE stage forward
      newStage = WORKFLOW_STAGES[currentIdx + 1];
    } else if (action === 'Reject') {
      newStage = WORKFLOW_STAGES[Math.max(0, currentIdx - 1)];
    } else { // Revise
      newStage = WORKFLOW_STAGES[Math.max(0, currentIdx - 2)];
    }

    // Acquire lock and record timestamp
    this.transitionLocks.add(projectId);
    this.lastTransitionTimes.set(projectId, now);

    try {
      this.addTransition({
        projectId,
        fromStage: project.currentStage,
        toStage: newStage,
        action,
        performedBy: userName,
        performedByRole: userRole,
        timestamp: new Date().toISOString(),
        remarks,
        rejectionReason,
      });

      const newStatus = action === 'Reject' ? 'Under Review' as const :
        newStage === 'Closed' ? 'Completed' as const : project.status;

      this.updateProject(projectId, { currentStage: newStage, status: newStatus });

      this.addAuditEvent({
        timestamp: new Date().toISOString(),
        userId,
        userName,
        userRole,
        action: `Workflow ${action}: ${project.currentStage} → ${newStage}`,
        entityType: 'Project',
        entityId: projectId,
        entityName: project.name,
        oldValue: project.currentStage,
        newValue: newStage,
        details: remarks || rejectionReason || `${action} action performed`,
      });

      return { success: true, message: `Project successfully moved to "${newStage}"` };
    } finally {
      // Release lock after short delay so UI state settles
      setTimeout(() => {
        this.transitionLocks.delete(projectId);
      }, 500);
    }
  }

  // --- Integrations ---
  getIntegrations(): Integration[] { return this.data.integrations; }
  updateIntegration(id: string, updates: Partial<Integration>): Integration | undefined {
    const idx = this.data.integrations.findIndex(i => i.id === id);
    if (idx === -1) return undefined;
    this.data.integrations[idx] = { ...this.data.integrations[idx], ...updates };
    this.persist();
    return this.data.integrations[idx];
  }

  // --- Batch Data Import Engine (Section E) ---
  importData(
    entityType: 'projects' | 'parcels' | 'awards' | 'compensation' | 'families' | 'milestones',
    records: any[],
    user: { id: string; name: string; role: UserRole }
  ): { imported: number; duplicates: number; rejected: number; errors: string[] } {
    let imported = 0;
    let duplicates = 0;
    let rejected = 0;
    const errors: string[] = [];

    const now = new Date().toISOString();

    if (entityType === 'parcels') {
      const existingUlpin = new Set(this.data.parcels.map(p => p.ulpin?.toLowerCase()));
      const existingSurvey = new Set(this.data.parcels.map(p => `${p.projectId}-${p.surveyNumber}`.toLowerCase()));
      const newParcels: LandParcel[] = [];

      for (let i = 0; i < records.length; i++) {
        const raw = records[i];
        if (!raw.projectId && !raw.surveyNumber) {
          rejected++;
          errors.push(`Row ${i + 1}: Missing projectId or surveyNumber.`);
          continue;
        }
        const standardized = standardizeParcel(raw);
        if (standardized.ulpin && existingUlpin.has(standardized.ulpin.toLowerCase())) {
          duplicates++;
          continue;
        }
        const surveyKey = `${standardized.projectId}-${standardized.surveyNumber}`.toLowerCase();
        if (existingSurvey.has(surveyKey)) {
          duplicates++;
          continue;
        }
        existingUlpin.add(standardized.ulpin.toLowerCase());
        existingSurvey.add(surveyKey);
        newParcels.push(standardized);
        imported++;
      }
      this.data.parcels = [...newParcels, ...this.data.parcels];
    } else if (entityType === 'projects') {
      const existingNames = new Set(this.data.projects.map(p => p.name.toLowerCase().trim()));
      const newProjects: Project[] = [];

      for (let i = 0; i < records.length; i++) {
        const raw = records[i];
        if (!raw.name) {
          rejected++;
          errors.push(`Row ${i + 1}: Project name is required.`);
          continue;
        }
        if (existingNames.has(raw.name.toLowerCase().trim())) {
          duplicates++;
          continue;
        }
        const pState = raw.state || 'Maharashtra';
        const pDistrict = raw.district || 'Pune';
        const geo = DISTRICT_COORDINATES[pDistrict] || { lat: 18.5204, lng: 73.8567, stateCode: 'MH', districtCode: '2704' };

        newProjects.push({
          id: raw.id || `PRJ-${String(Date.now() + i).slice(-5)}`,
          name: raw.name,
          requiringBody: raw.requiringBody || 'National Infrastructure Agency',
          projectType: raw.projectType || 'Highway',
          state: pState,
          district: pDistrict,
          stateCode: raw.stateCode || geo.stateCode,
          districtCode: raw.districtCode || geo.districtCode,
          location: raw.location || `${pDistrict}, ${pState}`,
          latitude: typeof raw.latitude === 'number' ? raw.latitude : geo.lat,
          longitude: typeof raw.longitude === 'number' ? raw.longitude : geo.lng,
          description: raw.description || 'Imported via Data Import Center',
          landProposed: Number(raw.landProposed || 100),
          landAcquired: Number(raw.landAcquired || 0),
          landNotified: Number(raw.landNotified || 0),
          currentStage: raw.currentStage || 'Proposal Draft',
          status: raw.status || 'On Track',
          priority: raw.priority || 'Normal',
          riskLevel: raw.riskLevel || 'Low',
          targetStartDate: raw.targetStartDate || now.split('T')[0],
          targetCompletionDate: raw.targetCompletionDate || '2028-12-31',
          responsibleAuthority: raw.responsibleAuthority || user.name,
          createdBy: user.name,
          createdAt: now,
          updatedAt: now,
        });
        imported++;
      }
      this.data.projects = [...newProjects, ...this.data.projects];
    } else if (entityType === 'awards') {
      const newAwards: Award[] = [];
      for (let i = 0; i < records.length; i++) {
        const raw = records[i];
        if (!raw.beneficiary || !raw.projectId) {
          rejected++;
          errors.push(`Row ${i + 1}: Missing beneficiary or projectId.`);
          continue;
        }
        newAwards.push({
          id: raw.id || `AWD-${String(Date.now() + i).slice(-5)}`,
          projectId: raw.projectId,
          parcelId: raw.parcelId || `PRC-${String(Date.now() + i).slice(-5)}`,
          beneficiary: raw.beneficiary,
          awardDate: raw.awardDate || now.split('T')[0],
          landArea: Number(raw.landArea || 1.5),
          assessedAmount: Number(raw.assessedAmount || 500000),
          awardAmount: Number(raw.awardAmount || raw.assessedAmount || 500000),
          status: raw.status || 'Issued',
          createdAt: now,
          updatedAt: now,
        });
        imported++;
      }
      this.data.awards = [...newAwards, ...this.data.awards];
    } else if (entityType === 'compensation') {
      const newComp: CompensationRecord[] = [];
      for (let i = 0; i < records.length; i++) {
        const raw = records[i];
        if (!raw.beneficiary || !raw.projectId) {
          rejected++;
          errors.push(`Row ${i + 1}: Missing beneficiary or projectId.`);
          continue;
        }
        newComp.push({
          id: raw.id || `CMP-${String(Date.now() + i).slice(-5)}`,
          projectId: raw.projectId,
          parcelId: raw.parcelId || `PRC-${String(Date.now() + i).slice(-5)}`,
          beneficiary: raw.beneficiary,
          assessedAmount: Number(raw.assessedAmount || 450000),
          approvedAmount: Number(raw.approvedAmount || raw.assessedAmount || 450000),
          paidAmount: Number(raw.paidAmount || 0),
          bankAccount: raw.bankAccount || `SBIN000${Math.floor(1000 + Math.random() * 9000)}`,
          paymentStatus: raw.paymentStatus || 'Pending',
          verificationState: raw.verificationState || 'Verified',
          createdAt: now,
          updatedAt: now,
        });
        imported++;
      }
      this.data.compensation = [...newComp, ...this.data.compensation];
    } else if (entityType === 'families') {
      const newFamilies: AffectedFamily[] = [];
      for (let i = 0; i < records.length; i++) {
        const raw = records[i];
        if (!raw.headOfFamily || !raw.projectId) {
          rejected++;
          errors.push(`Row ${i + 1}: Missing headOfFamily or projectId.`);
          continue;
        }
        newFamilies.push({
          id: raw.id || `FAM-${String(Date.now() + i).slice(-5)}`,
          projectId: raw.projectId,
          headOfFamily: raw.headOfFamily,
          village: raw.village || 'Revenue Village',
          district: raw.district || 'Pune',
          state: raw.state || 'Maharashtra',
          members: Number(raw.members || 4),
          isDisplaced: Boolean(raw.isDisplaced),
          landholding: Number(raw.landholding || 1.2),
          compensationEligibility: Number(raw.compensationEligibility || 500000),
          compensationStatus: raw.compensationStatus || 'Assessed',
          rrStatus: raw.rrStatus || 'In Progress',
          housingAssistance: Boolean(raw.housingAssistance),
          livelihoodAssistance: Boolean(raw.livelihoodAssistance),
          relocationCompleted: Boolean(raw.relocationCompleted),
          assistanceReceived: [],
          contactMasked: raw.contactMasked || `+91 XXXXX ${Math.floor(10000 + Math.random() * 90000)}`,
          createdAt: now,
          updatedAt: now,
        });
        imported++;
      }
      this.data.families = [...newFamilies, ...this.data.families];
    } else if (entityType === 'milestones') {
      const newMilestones: Milestone[] = [];
      for (let i = 0; i < records.length; i++) {
        const raw = records[i];
        if (!raw.name || !raw.projectId) {
          rejected++;
          errors.push(`Row ${i + 1}: Missing milestone name or projectId.`);
          continue;
        }
        newMilestones.push({
          id: raw.id || `MLS-${String(Date.now() + i).slice(-5)}`,
          projectId: raw.projectId,
          name: raw.name,
          plannedDate: raw.plannedDate || now.split('T')[0],
          owner: raw.owner || user.name,
          status: raw.status || 'Pending',
          delayDays: Number(raw.delayDays || 0),
          createdAt: now,
          updatedAt: now,
        });
        imported++;
      }
      this.data.milestones = [...newMilestones, ...this.data.milestones];
    }

    if (imported > 0) {
      this.persist();
      this.addAuditEvent({
        timestamp: now,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: `Batch Data Import: ${entityType.toUpperCase()}`,
        entityType: 'DataImport',
        entityId: `IMP-${Date.now()}`,
        details: `Imported ${imported} records (${duplicates} duplicates skipped, ${rejected} rejected).`,
      });
    }

    return { imported, duplicates, rejected, errors };
  }

  // --- Users ---
  getUsers(): User[] { return this.data.users; }
  getUser(id: string): User | undefined { return this.data.users.find(u => u.id === id); }
  updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.persist();
    return this.data.users[idx];
  }

  // --- Computed KPIs ---
  getKPIs(filters?: { state?: string; district?: string; projectType?: string; status?: string }) {
    let projects = this.data.projects;
    let parcels = this.data.parcels;
    let families = this.data.families;
    let compensation = this.data.compensation;
    let possession = this.data.possession;
    let milestones = this.data.milestones;
    let awards = this.data.awards;
    let alerts = this.data.alerts;

    if (filters) {
      if (filters.state) {
        projects = projects.filter(p => p.state === filters.state);
        const pids = new Set(projects.map(p => p.id));
        parcels = parcels.filter(p => pids.has(p.projectId));
        families = families.filter(f => pids.has(f.projectId));
        compensation = compensation.filter(c => pids.has(c.projectId));
        possession = possession.filter(p => pids.has(p.projectId));
        milestones = milestones.filter(m => pids.has(m.projectId));
        awards = awards.filter(a => pids.has(a.projectId));
        alerts = alerts.filter(a => !a.projectId || pids.has(a.projectId));
      }
      if (filters.district) {
        projects = projects.filter(p => p.district === filters.district);
        const pids = new Set(projects.map(p => p.id));
        parcels = parcels.filter(p => pids.has(p.projectId));
        families = families.filter(f => pids.has(f.projectId));
        compensation = compensation.filter(c => pids.has(c.projectId));
        possession = possession.filter(p => pids.has(p.projectId));
        milestones = milestones.filter(m => pids.has(m.projectId));
        awards = awards.filter(a => pids.has(a.projectId));
        alerts = alerts.filter(a => !a.projectId || pids.has(a.projectId));
      }
      if (filters.projectType) {
        projects = projects.filter(p => p.projectType === filters.projectType);
      }
      if (filters.status) {
        projects = projects.filter(p => p.status === filters.status);
      }
    }

    const totalLandProposed = projects.reduce((s, p) => s + p.landProposed, 0);
    const totalLandAcquired = projects.reduce((s, p) => s + p.landAcquired, 0);
    const totalLandNotified = projects.reduce((s, p) => s + p.landNotified, 0);
    const totalCompAssessed = compensation.reduce((s, c) => s + c.assessedAmount, 0);
    const totalCompPaid = compensation.reduce((s, c) => s + c.paidAmount, 0);
    const totalCompApproved = compensation.reduce((s, c) => s + c.approvedAmount, 0);

    return {
      totalProjects: projects.length,
      projectsOnTrack: projects.filter(p => p.status === 'On Track').length,
      delayedProjects: projects.filter(p => p.status === 'Delayed').length,
      criticalProjects: projects.filter(p => p.status === 'Critical').length,
      completedProjects: projects.filter(p => p.status === 'Completed').length,
      landProposed: totalLandProposed,
      landAcquired: totalLandAcquired,
      acquisitionPercent: totalLandProposed > 0 ? parseFloat(((totalLandAcquired / totalLandProposed) * 100).toFixed(1)) : 0,
      landNotified: totalLandNotified,
      compensationAssessed: totalCompAssessed,
      compensationPaid: totalCompPaid,
      compensationApproved: totalCompApproved,
      outstandingCompensation: totalCompApproved - totalCompPaid,
      affectedFamilies: families.length,
      displacedFamilies: families.filter(f => f.isDisplaced).length,
      rrCompletion: families.length > 0 ? parseFloat(((families.filter(f => f.rrStatus === 'Completed').length / families.length) * 100).toFixed(1)) : 0,
      possessionCompletion: possession.length > 0 ? parseFloat(((possession.filter(p => p.status === 'Completed').length / possession.length) * 100).toFixed(1)) : 0,
      pendingApprovals: projects.filter(p => ['Pending Approval', 'Under Review'].includes(p.status) || ['Submitted', 'Digital Scrutiny', 'Verification', 'District Approval', 'State Approval', 'Central Approval'].includes(p.currentStage)).length,
      activeAlerts: alerts.filter(a => a.status === 'Active').length,
      totalParcels: parcels.length,
      verifiedParcels: parcels.filter(p => p.verificationStatus === 'Verified').length,
      totalAwards: awards.length,
      overdueMilestones: milestones.filter(m => m.status === 'Overdue').length,
    };
  }
}

// Singleton
export const dataStore = new DataStore();
