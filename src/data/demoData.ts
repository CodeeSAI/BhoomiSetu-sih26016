// ============================================================
// BhoomiSetu - Synthetic Demo Data Generator
// All data is synthetic and for demonstration purposes only
// ============================================================
import type {
  Project, LandParcel, AffectedFamily, Notification, Award,
  CompensationRecord, PossessionRecord, Milestone, Document, Alert,
  AuditEvent, WorkflowTransition, Integration, User, WorkflowStage,
  ProjectType, ProjectStatus, RiskLevel, LandType, AcquisitionStatus,
  CompensationStatus, PossessionStatus, RRStatus, AlertSeverity,
  DocumentCategory, NotificationType, UserRole, Priority
} from '../types';

// --- Helpers ---
let counter = 1000;
const id = (prefix: string) => `${prefix}-${String(++counter).padStart(5, '0')}`;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number, dec = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(dec));
const dateStr = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const pastDate = (monthsAgo: number = 24) => {
  const d = new Date();
  d.setMonth(d.getMonth() - randInt(1, monthsAgo));
  d.setDate(randInt(1, 28));
  return d.toISOString().split('T')[0];
};
const futureDate = (monthsAhead: number = 24) => {
  const d = new Date();
  d.setMonth(d.getMonth() + randInt(1, monthsAhead));
  d.setDate(randInt(1, 28));
  return d.toISOString().split('T')[0];
};
const recentDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - randInt(0, 30));
  return d.toISOString();
};

const STATES_DISTRICTS: Record<string, string[]> = {
  'Karnataka': ['Bengaluru Urban', 'Mysuru', 'Dharwad', 'Mangalore'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Rajkot', 'Vadodara'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Bikaner'],
  'Uttar Pradesh': ['Lucknow', 'Noida', 'Varanasi', 'Agra'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem'],
  'Telangana': ['Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior'],
  'Assam': ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat'],
  'Delhi NCR': ['New Delhi', 'Central Delhi', 'South Delhi', 'East Delhi'],
};

const STATES = Object.keys(STATES_DISTRICTS);
const VILLAGES = ['Chandpur', 'Ramgarh', 'Sultanpur', 'Govindpur', 'Lakshmipur', 'Bhagwanpur', 'Durgapur', 'Krishnanagar', 'Shivpur', 'Maheshpur', 'Narayanpur', 'Jagannathpur', 'Balrampur', 'Haridwar Colony', 'Keshavpur'];

import { DISTRICT_COORDINATES } from '../utils/geoValidation';
import { standardizeParcel, STATE_CODE_MAP, DISTRICT_CODE_MAP } from '../types/standardSchema';

export interface MasterProjectSpec {
  name: string;
  state: string;
  district: string;
  projectType: ProjectType;
  requiringBody: string;
}

export const MASTER_PROJECT_SPECS: MasterProjectSpec[] = [
  // 1. Karnataka
  {
    name: 'Bengaluru Peripheral Ring Road',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    projectType: 'Highway',
    requiringBody: 'National Highways Authority of India',
  },
  {
    name: 'Mysuru Heritage Tourism Corridor',
    state: 'Karnataka',
    district: 'Mysuru',
    projectType: 'Township',
    requiringBody: 'State Public Works Department',
  },
  {
    name: 'Dharwad Industrial & Agro-Tech Hub',
    state: 'Karnataka',
    district: 'Dharwad',
    projectType: 'Industrial',
    requiringBody: 'State Industrial Development Corporation',
  },

  // 2. Maharashtra
  {
    name: 'Mumbai-Ahmedabad Bullet Train Corridor (MH Section)',
    state: 'Maharashtra',
    district: 'Mumbai',
    projectType: 'Railway',
    requiringBody: 'Ministry of Railways',
  },
  {
    name: 'Pune IT & Electronics Township SEZ',
    state: 'Maharashtra',
    district: 'Pune',
    projectType: 'Industrial',
    requiringBody: 'State Industrial Development Corporation',
  },
  {
    name: 'Nagpur-Mumbai Samruddhi Expressway Link',
    state: 'Maharashtra',
    district: 'Nagpur',
    projectType: 'Highway',
    requiringBody: 'National Highways Authority of India',
  },

  // 3. Gujarat
  {
    name: 'Gujarat Solar Mega Park Phase-IV',
    state: 'Gujarat',
    district: 'Ahmedabad',
    projectType: 'Solar Park',
    requiringBody: 'Solar Energy Corporation',
  },
  {
    name: 'Surat Diamond Industrial Park Phase-II',
    state: 'Gujarat',
    district: 'Surat',
    projectType: 'Industrial',
    requiringBody: 'State Industrial Development Corporation',
  },
  {
    name: 'Vadodara Multimodal Logistics Hub',
    state: 'Gujarat',
    district: 'Vadodara',
    projectType: 'Railway',
    requiringBody: 'Ministry of Railways',
  },

  // 4. Rajasthan
  {
    name: 'Jaipur Smart City Metro Phase-II',
    state: 'Rajasthan',
    district: 'Jaipur',
    projectType: 'Smart City',
    requiringBody: 'Smart City Mission',
  },
  {
    name: 'Jodhpur Solar Energy Park (Marwar)',
    state: 'Rajasthan',
    district: 'Jodhpur',
    projectType: 'Solar Park',
    requiringBody: 'Solar Energy Corporation',
  },
  {
    name: 'Bikaner Border Strategic Highway Link',
    state: 'Rajasthan',
    district: 'Bikaner',
    projectType: 'Defense',
    requiringBody: 'Ministry of Defense',
  },

  // 5. Uttar Pradesh
  {
    name: 'Lucknow Metro Phase-III Transit Corridor',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    projectType: 'Railway',
    requiringBody: 'Ministry of Railways',
  },
  {
    name: 'Noida International Airport Special Economic Zone',
    state: 'Uttar Pradesh',
    district: 'Noida',
    projectType: 'Airport',
    requiringBody: 'Airport Authority of India',
  },
  {
    name: 'Varanasi River Front & Ghat Development',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    projectType: 'Township',
    requiringBody: 'State Public Works Department',
  },

  // 6. Tamil Nadu
  {
    name: 'Chennai Port Access Expressway Corridor',
    state: 'Tamil Nadu',
    district: 'Chennai',
    projectType: 'Highway',
    requiringBody: 'National Highways Authority of India',
  },
  {
    name: 'Coimbatore IT Special Economic Zone',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    projectType: 'Industrial',
    requiringBody: 'State Industrial Development Corporation',
  },
  {
    name: 'Madurai Smart Infrastructure & Logistics Link',
    state: 'Tamil Nadu',
    district: 'Madurai',
    projectType: 'Smart City',
    requiringBody: 'Smart City Mission',
  },

  // 7. Telangana
  {
    name: 'Hyderabad Outer Ring Road Multi-Modal Link',
    state: 'Telangana',
    district: 'Hyderabad',
    projectType: 'Highway',
    requiringBody: 'National Highways Authority of India',
  },
  {
    name: 'Warangal Railway Junction Modernization',
    state: 'Telangana',
    district: 'Warangal',
    projectType: 'Railway',
    requiringBody: 'Ministry of Railways',
  },
  {
    name: 'Telangana Irrigation Canal Network (Kaleshwaram)',
    state: 'Telangana',
    district: 'Karimnagar',
    projectType: 'Dam/Irrigation',
    requiringBody: 'Ministry of Water Resources',
  },

  // 8. Madhya Pradesh
  {
    name: 'Bhopal Dam Rehabilitation & Watershed Zone',
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    projectType: 'Dam/Irrigation',
    requiringBody: 'Ministry of Water Resources',
  },
  {
    name: 'Indore Super Corridor Phase-II Tech Zone',
    state: 'Madhya Pradesh',
    district: 'Indore',
    projectType: 'Smart City',
    requiringBody: 'Smart City Mission',
  },
  {
    name: 'Jabalpur Defense Hardware Manufacturing Cluster',
    state: 'Madhya Pradesh',
    district: 'Jabalpur',
    projectType: 'Defense',
    requiringBody: 'Ministry of Defense',
  },

  // 9. Assam
  {
    name: 'Guwahati Riverfront Smart City Project',
    state: 'Assam',
    district: 'Guwahati',
    projectType: 'Smart City',
    requiringBody: 'Smart City Mission',
  },
  {
    name: 'Assam Flood Control Embankment & Bund Network',
    state: 'Assam',
    district: 'Dibrugarh',
    projectType: 'Dam/Irrigation',
    requiringBody: 'Ministry of Water Resources',
  },
  {
    name: 'Jorhat Agro-Industrial Corridor Expansion',
    state: 'Assam',
    district: 'Jorhat',
    projectType: 'Industrial',
    requiringBody: 'State Industrial Development Corporation',
  },

  // 10. Delhi NCR
  {
    name: 'Delhi NCR Expressway Link & Peripheral Bypass',
    state: 'Delhi NCR',
    district: 'New Delhi',
    projectType: 'Highway',
    requiringBody: 'National Highways Authority of India',
  },
  {
    name: 'Central Delhi Urban Redevelopment Corridor',
    state: 'Delhi NCR',
    district: 'Central Delhi',
    projectType: 'Township',
    requiringBody: 'State Public Works Department',
  },
  {
    name: 'South Delhi Eco-Park & High-Speed Transit Node',
    state: 'Delhi NCR',
    district: 'South Delhi',
    projectType: 'Railway',
    requiringBody: 'Ministry of Railways',
  },
];

export const PROJECT_NAMES = MASTER_PROJECT_SPECS.map(p => p.name);

const REQUIRING_BODIES = [
  'Ministry of Road Transport & Highways', 'Ministry of Railways',
  'National Highways Authority of India', 'State Public Works Department',
  'Smart City Mission', 'Ministry of Defense', 'Solar Energy Corporation',
  'State Industrial Development Corporation', 'Ministry of Water Resources',
  'Airport Authority of India',
];

const OFFICERS = [
  'Rajesh Kumar Singh', 'Priya Sharma', 'Anil Verma', 'Sanjay Patel',
  'Meena Kumari', 'Vikram Reddy', 'Anita Desai', 'Suresh Nair',
  'Pooja Mehta', 'Karthik Raman', 'Deepak Joshi', 'Lakshmi Iyer',
  'Ramesh Gupta', 'Sneha Patil', 'Amit Tiwari', 'Kavita Rao',
];

const PROJECT_TYPES: ProjectType[] = ['Highway', 'Railway', 'Industrial', 'Township', 'Dam/Irrigation', 'Airport', 'Defense', 'Smart City', 'Solar Park', 'Other'];
const STATUSES: ProjectStatus[] = ['On Track', 'Delayed', 'Critical', 'Completed', 'Under Review', 'Pending Approval'];
const RISK_LEVELS: RiskLevel[] = ['Low', 'Medium', 'High', 'Critical'];
const PRIORITIES: Priority[] = ['Low', 'Normal', 'High', 'Urgent'];
const LAND_TYPES: LandType[] = ['Agricultural', 'Residential', 'Commercial', 'Industrial', 'Forest', 'Government', 'Wasteland'];
const ACQ_STATUSES: AcquisitionStatus[] = ['Proposed', 'Notified', 'Under Acquisition', 'Acquired', 'Disputed'];
const COMP_STATUSES: CompensationStatus[] = ['Not Assessed', 'Assessed', 'Approved', 'Disbursed', 'Partial', 'Disputed', 'Pending'];
const POSS_STATUSES: PossessionStatus[] = ['Not Due', 'Notice Issued', 'Partial', 'Completed', 'Delayed'];
const RR_STATUSES: RRStatus[] = ['Not Started', 'In Progress', 'Partial', 'Completed', 'Pending Verification'];
const WORKFLOW_STAGES_LIST: WorkflowStage[] = [
  'Proposal Draft', 'Submitted', 'Digital Scrutiny', 'Verification',
  'District Approval', 'State Approval', 'Central Approval',
  'Preliminary Notification', 'Objection/Hearing', 'Final Declaration',
  'Award', 'Compensation Processing', 'Compensation Disbursed',
  'Possession', 'R&R', 'Closed'
];

// State center coordinates for India map fallback
export const STATE_COORDS: Record<string, [number, number]> = {
  'Karnataka': [15.3173, 75.7139],
  'Maharashtra': [19.7515, 75.7139],
  'Gujarat': [22.2587, 71.1924],
  'Rajasthan': [27.0238, 74.2179],
  'Uttar Pradesh': [26.8467, 80.9462],
  'Tamil Nadu': [11.1271, 78.6569],
  'Telangana': [18.1124, 79.0193],
  'Madhya Pradesh': [22.9734, 78.6569],
  'Assam': [26.2006, 92.9376],
  'Delhi NCR': [28.7041, 77.1025],
};

// --- Generate Projects ---
export function generateProjects(): Project[] {
  const projects: Project[] = [];
  MASTER_PROJECT_SPECS.forEach((spec, i) => {
    const geo = DISTRICT_COORDINATES[spec.district] || {
      lat: 20.5937,
      lng: 78.9629,
      state: spec.state,
      stateCode: 'IN',
      districtCode: '0000',
    };

    const stageIdx = (i * 3 + 2) % 16;
    const stage = WORKFLOW_STAGES_LIST[stageIdx];
    const landProposed = randFloat(40, 600);
    const progressRatio = Math.min(stageIdx / 15, 1);
    const landAcquired = parseFloat((landProposed * progressRatio * randFloat(0.7, 1.0)).toFixed(2));
    const landNotified = parseFloat((Math.min(landProposed, landAcquired + randFloat(5, 50))).toFixed(2));

    let status: ProjectStatus;
    if (stageIdx >= 15) status = 'Completed';
    else if (stageIdx < 2) status = 'Under Review';
    else if (stageIdx % 5 === 0) status = 'Delayed';
    else if (stageIdx === 14) status = 'Critical';
    else status = 'On Track';

    projects.push({
      id: `PRJ-${String(1001 + i).padStart(5, '0')}`,
      name: spec.name,
      requiringBody: spec.requiringBody,
      projectType: spec.projectType,
      state: spec.state,
      stateCode: geo.stateCode,
      district: spec.district,
      districtCode: geo.districtCode,
      location: `${spec.district}, ${spec.state}`,
      latitude: geo.lat,
      longitude: geo.lng,
      description: `${spec.name} - Demonstration land acquisition project for ${spec.projectType.toLowerCase()} development in ${spec.district}, ${spec.state}. Supporting planned national infrastructure connectivity under BhoomiSetu demo framework.`,
      landProposed,
      landAcquired,
      landNotified,
      currentStage: stage,
      status,
      priority: stageIdx > 12 ? 'Urgent' : stageIdx > 6 ? 'High' : 'Normal',
      riskLevel: status === 'Critical' ? 'Critical' : status === 'Delayed' ? 'High' : 'Low',
      targetStartDate: pastDate(18),
      targetCompletionDate: futureDate(18),
      actualStartDate: stageIdx > 1 ? pastDate(12) : undefined,
      responsibleAuthority: pick(OFFICERS),
      createdBy: pick(OFFICERS),
      createdAt: pastDate(24),
      updatedAt: recentDate(),
    });
  });
  return projects;
}

// --- Generate Land Parcels ---
export function generateParcels(projects: Project[]): LandParcel[] {
  const parcels: LandParcel[] = [];
  let parcelCounter = 2000;

  for (const proj of projects) {
    const numParcels = randInt(3, 7);
    const sCode = proj.stateCode || STATE_CODE_MAP[proj.state] || 'MH';
    const dCode = proj.districtCode || DISTRICT_CODE_MAP[proj.district] || '2704';

    for (let i = 0; i < numParcels; i++) {
      parcelCounter++;
      const area = randFloat(0.8, 18);
      const acqStatus = pick(ACQ_STATUSES);
      // Strict spatial containment: jitter within ~0.015 degrees (~1.5 km of project centroid)
      const lat = parseFloat((proj.latitude + randFloat(-0.018, 0.018)).toFixed(6));
      const lng = parseFloat((proj.longitude + randFloat(-0.018, 0.018)).toFixed(6));
      const surveyNumber = `${randInt(10, 499)}/${randInt(1, 15)}`;
      const ownership = pick(['Private', 'Joint', 'Government', 'Tribal', 'Trust']);

      const parcel = standardizeParcel({
        id: `PRC-${String(parcelCounter).padStart(5, '0')}`,
        projectId: proj.id,
        state: proj.state,
        stateCode: sCode,
        district: proj.district,
        districtCode: dCode,
        village: pick(VILLAGES),
        surveyNumber,
        area,
        landType: pick(LAND_TYPES),
        ownership,
        ownershipStatus: ownership,
        ownerName: pick(OFFICERS),
        acquisitionStatus: acqStatus,
        compensationStatus: acqStatus === 'Acquired' ? pick(['Disbursed', 'Approved']) : acqStatus === 'Under Acquisition' ? pick(['Assessed', 'Pending']) : 'Not Assessed',
        possessionStatus: acqStatus === 'Acquired' ? pick(['Completed', 'Partial']) : 'Not Due',
        latitude: lat,
        longitude: lng,
        verificationStatus: pick(['Pending', 'Verified', 'Verified', 'Verified', 'Rejected']),
        verifiedBy: pick(OFFICERS),
        verifiedAt: pastDate(6),
        remarks: '',
        createdAt: pastDate(18),
        updatedAt: recentDate(),
      });

      parcels.push(parcel);
    }
  }
  return parcels;
}

// --- Generate Affected Families ---
export function generateFamilies(projects: Project[]): AffectedFamily[] {
  const families: AffectedFamily[] = [];
  for (const proj of projects) {
    const numFamilies = randInt(2, 8);
    for (let i = 0; i < numFamilies; i++) {
      const isDisplaced = Math.random() > 0.5;
      const comp = randFloat(100000, 5000000);
      families.push({
        id: id('FAM'),
        projectId: proj.id,
        headOfFamily: pick(['Ramesh', 'Suresh', 'Mahesh', 'Ganesh', 'Umesh', 'Dinesh', 'Naresh', 'Rajesh']) + ' ' + pick(['Kumar', 'Singh', 'Sharma', 'Patel', 'Reddy', 'Rao', 'Nair', 'Verma']),
        village: pick(VILLAGES),
        district: proj.district,
        state: proj.state,
        members: randInt(2, 9),
        isDisplaced,
        landholding: randFloat(0.1, 5),
        compensationEligibility: comp,
        compensationStatus: pick(COMP_STATUSES),
        rrStatus: isDisplaced ? pick(RR_STATUSES) : 'Not Started',
        housingAssistance: isDisplaced && Math.random() > 0.3,
        livelihoodAssistance: Math.random() > 0.4,
        relocationCompleted: isDisplaced && Math.random() > 0.6,
        assistanceReceived: [],
        contactMasked: `+91 XXXXX ${String(randInt(10000, 99999)).slice(0, 5)}`,
        createdAt: pastDate(18),
        updatedAt: recentDate(),
      });
    }
  }
  return families;
}

// --- Generate Notifications ---
export function generateNotifications(projects: Project[]): Notification[] {
  const notifs: Notification[] = [];
  const types: NotificationType[] = ['Preliminary (Section 11)', 'Final (Section 19)', 'Hearing Notice', 'Award Notice', 'Possession Notice', 'R&R Notice'];
  for (const proj of projects) {
    const num = randInt(1, 3);
    for (let i = 0; i < num; i++) {
      notifs.push({
        id: id('NTF'),
        projectId: proj.id,
        notificationType: pick(types),
        dateIssued: pastDate(12),
        authority: pick(OFFICERS),
        publicationStatus: pick(['Draft', 'Published', 'Published', 'Published']),
        effectiveDate: pastDate(6),
        remarks: 'Statutory notification as per RFCTLARR Act 2013',
        createdAt: pastDate(12),
        updatedAt: recentDate(),
      });
    }
  }
  return notifs;
}

// --- Generate Awards ---
export function generateAwards(projects: Project[], parcels: LandParcel[]): Award[] {
  const awards: Award[] = [];
  for (const parcel of parcels) {
    if (parcel.acquisitionStatus === 'Acquired' || parcel.acquisitionStatus === 'Under Acquisition') {
      const assessed = randFloat(500000, 10000000);
      awards.push({
        id: id('AWD'),
        projectId: parcel.projectId,
        parcelId: parcel.id,
        beneficiary: parcel.ownerName,
        awardDate: pastDate(8),
        landArea: parcel.area,
        assessedAmount: assessed,
        awardAmount: parseFloat((assessed * randFloat(1.0, 1.5)).toFixed(2)),
        status: pick(['Draft', 'Issued', 'Issued', 'Accepted', 'Accepted', 'Disputed']),
        createdAt: pastDate(8),
        updatedAt: recentDate(),
      });
    }
  }
  return awards;
}

// --- Generate Compensation Records ---
export function generateCompensation(awards: Award[]): CompensationRecord[] {
  const records: CompensationRecord[] = [];
  for (const award of awards) {
    const paid = award.status === 'Accepted' ? award.awardAmount : award.status === 'Issued' ? randFloat(0, award.awardAmount) : 0;
    records.push({
      id: id('CMP'),
      projectId: award.projectId,
      parcelId: award.parcelId,
      beneficiary: award.beneficiary,
      assessedAmount: award.assessedAmount,
      approvedAmount: award.awardAmount,
      paidAmount: paid,
      bankAccount: `XXXX${randInt(1000, 9999)}`,
      paymentStatus: paid >= award.awardAmount ? 'Disbursed' : paid > 0 ? 'Processing' : pick(['Pending', 'Approved']),
      awardId: award.id,
      verificationState: pick(['Verified', 'Verified', 'Unverified', 'Flagged']),
      disbursedDate: paid > 0 ? pastDate(4) : undefined,
      remarks: '',
      createdAt: pastDate(6),
      updatedAt: recentDate(),
    });
  }
  return records;
}

// --- Generate Possession Records ---
export function generatePossession(parcels: LandParcel[]): PossessionRecord[] {
  const records: PossessionRecord[] = [];
  for (const parcel of parcels) {
    if (parcel.acquisitionStatus === 'Acquired' || parcel.acquisitionStatus === 'Under Acquisition') {
      records.push({
        id: id('POS'),
        projectId: parcel.projectId,
        parcelId: parcel.id,
        dueDate: futureDate(6),
        noticeDate: parcel.possessionStatus !== 'Not Due' ? pastDate(3) : undefined,
        completedDate: parcel.possessionStatus === 'Completed' ? pastDate(1) : undefined,
        status: parcel.possessionStatus,
        possessionOfficer: pick(OFFICERS),
        handoverDate: parcel.possessionStatus === 'Completed' ? pastDate(1) : undefined,
        isPartial: parcel.possessionStatus === 'Partial',
        remarks: '',
        createdAt: pastDate(6),
        updatedAt: recentDate(),
      });
    }
  }
  return records;
}

// --- Generate Milestones ---
export function generateMilestones(projects: Project[]): Milestone[] {
  const milestones: Milestone[] = [];
  const MILESTONE_NAMES = [
    'Land Survey Completed', 'Notification Published', 'Hearing Concluded',
    'Award Declared', 'Compensation Assessed', 'Compensation Disbursed',
    'Possession Taken', 'R&R Initiated', 'R&R Completed', 'Project Closure'
  ];
  for (const proj of projects) {
    const stageIdx = WORKFLOW_STAGES_LIST.indexOf(proj.currentStage);
    for (let i = 0; i < MILESTONE_NAMES.length; i++) {
      const planned = pastDate(18 - i * 2);
      const isComplete = i < Math.floor(stageIdx / 1.6);
      const overdueDays = !isComplete && i < stageIdx ? randInt(5, 90) : 0;
      milestones.push({
        id: id('MLS'),
        projectId: proj.id,
        name: MILESTONE_NAMES[i],
        plannedDate: planned,
        actualDate: isComplete ? pastDate(12 - i) : undefined,
        owner: pick(OFFICERS),
        status: isComplete ? 'Completed' : overdueDays > 0 ? 'Overdue' : i === Math.floor(stageIdx / 1.6) ? 'In Progress' : 'Pending',
        delayDays: overdueDays,
        createdAt: pastDate(20),
        updatedAt: recentDate(),
      });
    }
  }
  return milestones;
}

// --- Generate Documents ---
export function generateDocuments(projects: Project[]): Document[] {
  const docs: Document[] = [];
  const CATEGORIES: DocumentCategory[] = ['Land Records', 'Notifications', 'Awards', 'Compensation', 'Legal', 'Survey', 'R&R', 'Maps'];
  const DOC_NAMES: Record<DocumentCategory, string[]> = {
    'Land Records': ['Land Title Deed', 'Revenue Record (7/12)', 'Mutation Entry', 'Encumbrance Certificate'],
    'Notifications': ['Section 11 Notification', 'Section 19 Declaration', 'Hearing Notice', 'Gazette Publication'],
    'Awards': ['Award Order', 'Award Calculation Sheet', 'Valuation Report'],
    'Compensation': ['Compensation Statement', 'Bank Transfer Receipt', 'Compensation Dispute Filing'],
    'Legal': ['Court Order', 'Legal Opinion', 'Consent Agreement', 'Right of Way Agreement'],
    'Survey': ['Cadastral Survey Map', 'Joint Measurement Report', 'Boundary Demarcation'],
    'R&R': ['R&R Scheme Document', 'Family Survey Report', 'Resettlement Plan'],
    'Maps': ['Project Layout Map', 'Parcel Boundary Map', 'Topographical Survey'],
    'Other': ['Miscellaneous Document'],
  };
  for (const proj of projects) {
    for (const cat of CATEGORIES) {
      const names = DOC_NAMES[cat];
      for (const name of names) {
        if (Math.random() > 0.4) {
          docs.push({
            id: id('DOC'),
            projectId: proj.id,
            name: `${name} - ${proj.name.substring(0, 30)}`,
            category: cat,
            version: randInt(1, 3),
            uploadedBy: pick(OFFICERS),
            uploadedAt: recentDate(),
            fileSize: randInt(50000, 5000000),
            mimeType: pick(['application/pdf', 'image/jpeg', 'application/pdf', 'application/pdf']),
            verificationState: pick(['Pending', 'Verified', 'Verified', 'Verified']),
            remarks: '',
            tags: [cat, proj.state],
          });
        }
      }
    }
  }
  return docs;
}

// --- Generate Alerts ---
export function generateAlerts(projects: Project[], milestones: Milestone[]): Alert[] {
  const alerts: Alert[] = [];
  const overdueMilestones = milestones.filter(m => m.status === 'Overdue');
  for (const m of overdueMilestones.slice(0, 15)) {
    const proj = projects.find(p => p.id === m.projectId);
    alerts.push({
      id: id('ALT'),
      projectId: m.projectId,
      severity: m.delayDays > 60 ? 'Critical' : m.delayDays > 30 ? 'Warning' : 'Info',
      title: `Overdue Milestone: ${m.name}`,
      reason: `Milestone "${m.name}" for project "${proj?.name || m.projectId}" is overdue by ${m.delayDays} days.`,
      timestamp: recentDate(),
      responsibleOfficer: m.owner,
      recommendedAction: `Review milestone status and update timeline. Escalate if resource constraints exist.`,
      status: pick(['Active', 'Active', 'Active', 'Acknowledged']),
    });
  }
  // Add more alert types
  for (const proj of projects.filter(p => p.status === 'Critical').slice(0, 5)) {
    alerts.push({
      id: id('ALT'),
      projectId: proj.id,
      severity: 'Urgent',
      title: `Critical Project: ${proj.name}`,
      reason: `Project "${proj.name}" has critical status with multiple overdue tasks.`,
      timestamp: recentDate(),
      responsibleOfficer: proj.responsibleAuthority,
      recommendedAction: 'Immediate review required. Schedule stakeholder meeting.',
      status: 'Active',
    });
  }
  for (const proj of projects.filter(p => p.status === 'Delayed').slice(0, 5)) {
    alerts.push({
      id: id('ALT'),
      projectId: proj.id,
      severity: 'Warning',
      title: `Compensation Pending: ${proj.name}`,
      reason: `Multiple compensation records pending for project "${proj.name}".`,
      timestamp: recentDate(),
      responsibleOfficer: proj.responsibleAuthority,
      recommendedAction: 'Review pending compensation records and expedite processing.',
      status: 'Active',
    });
  }
  return alerts;
}

// --- Generate Audit Events ---
export function generateAuditEvents(projects: Project[]): AuditEvent[] {
  const events: AuditEvent[] = [];
  const ACTIONS = [
    'Project Created', 'Project Updated', 'Proposal Submitted', 'Verification Completed',
    'Stage Approved', 'Stage Rejected', 'Compensation Updated', 'Document Uploaded',
    'Parcel Verified', 'Alert Resolved', 'User Login', 'Report Generated',
    'Award Issued', 'Possession Updated', 'R&R Status Changed',
  ];
  const ROLES: UserRole[] = ['State Authority', 'District Collector', 'Land Acquisition Officer', 'National Administrator'];
  for (let i = 0; i < 80; i++) {
    const proj = pick(projects);
    const officer = pick(OFFICERS);
    const action = pick(ACTIONS);
    events.push({
      id: id('AUD'),
      timestamp: recentDate(),
      userId: `USR-${randInt(1, 9)}`,
      userName: officer,
      userRole: pick(ROLES),
      action,
      entityType: action.includes('Project') ? 'Project' : action.includes('Compensation') ? 'Compensation' : action.includes('Document') ? 'Document' : action.includes('Parcel') ? 'Parcel' : action.includes('Award') ? 'Award' : 'System',
      entityId: proj.id,
      entityName: proj.name,
      details: `${action} performed on ${proj.name} in ${proj.district}, ${proj.state}`,
    });
  }
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return events;
}

// --- Generate Integrations ---
export function generateIntegrations(): Integration[] {
  return [
    { id: 'INT-001', name: 'Land Records (Bhoomi/BhuNaksha)', type: 'Land Records', endpoint: 'https://api.landrecords.gov.in/v2', status: 'Sandbox', lastSync: recentDate(), recordsSynced: 15420, errors: 0, description: 'Integration with state land record databases for ownership verification.' },
    { id: 'INT-002', name: 'Cadastral Maps Service', type: 'Cadastral Maps', endpoint: 'https://gis.cadastral.gov.in/api', status: 'Sandbox', lastSync: recentDate(), recordsSynced: 8340, errors: 2, description: 'Cadastral survey map and boundary data integration.' },
    { id: 'INT-003', name: 'PFMS (Financial System)', type: 'Financial System', endpoint: 'https://pfms.nic.in/api/v3', status: 'Sandbox', lastSync: recentDate(), recordsSynced: 22100, errors: 0, description: 'Public Financial Management System for compensation disbursement tracking.' },
    { id: 'INT-004', name: 'India GIS Service (ISRO)', type: 'GIS Services', endpoint: 'https://bhuvan.nrsc.gov.in/api', status: 'Connected', lastSync: recentDate(), recordsSynced: 45000, errors: 0, description: 'ISRO Bhuvan geospatial data service for satellite imagery and mapping.' },
    { id: 'INT-005', name: 'SMS Gateway (NIC)', type: 'Notification/SMS', endpoint: 'https://sms.gov.in/api', status: 'Sandbox', lastSync: recentDate(), recordsSynced: 3200, errors: 1, description: 'Government SMS gateway for statutory notification delivery.' },
    { id: 'INT-006', name: 'Email Service (NIC Mail)', type: 'Email', endpoint: 'https://mail.gov.in/api', status: 'Sandbox', lastSync: recentDate(), recordsSynced: 1800, errors: 0, description: 'NIC email service for official communication and notifications.' },
    { id: 'INT-007', name: 'DigiLocker Integration', type: 'Government Portals', endpoint: 'https://api.digilocker.gov.in/v2', status: 'Disconnected', recordsSynced: 0, errors: 0, description: 'DigiLocker integration for verified document access and storage.' },
    { id: 'INT-008', name: 'Aadhaar Verification (UIDAI)', type: 'Government Portals', endpoint: 'https://auth.uidai.gov.in/api', status: 'Disconnected', recordsSynced: 0, errors: 0, description: 'UIDAI Aadhaar-based identity verification for beneficiary validation.' },
  ];
}

// --- Generate Demo Users ---
export function generateUsers(): User[] {
  return [
    { id: 'USR-1', name: 'Dr. Anand Sharma', email: 'admin@bhoomisetu.gov.in', role: 'National Administrator', department: 'Ministry of Rural Development', isActive: true },
    { id: 'USR-2', name: 'Smt. Priya Mehta', email: 'central@bhoomisetu.gov.in', role: 'Central Ministry Officer', department: 'Ministry of Road Transport', isActive: true },
    { id: 'USR-3', name: 'Shri Vikram Singh', email: 'state@bhoomisetu.gov.in', role: 'State Authority', state: 'Karnataka', department: 'Revenue Department', isActive: true },
    { id: 'USR-4', name: 'Shri Raghav Patel', email: 'collector@bhoomisetu.gov.in', role: 'District Collector', state: 'Gujarat', district: 'Ahmedabad', department: 'District Administration', isActive: true },
    { id: 'USR-5', name: 'Smt. Lakshmi Nair', email: 'lao@bhoomisetu.gov.in', role: 'Land Acquisition Officer', state: 'Tamil Nadu', district: 'Chennai', department: 'Land Revenue', isActive: true },
    { id: 'USR-6', name: 'Shri Manish Gupta', email: 'pia@bhoomisetu.gov.in', role: 'Project Implementing Agency', state: 'Maharashtra', department: 'NHAI', isActive: true },
    { id: 'USR-7', name: 'Shri Arjun Reddy', email: 'field@bhoomisetu.gov.in', role: 'Field Verification Officer', state: 'Telangana', district: 'Hyderabad', department: 'Survey & Land Records', isActive: true },
    { id: 'USR-8', name: 'Smt. Kavita Deshmukh', email: 'rr@bhoomisetu.gov.in', role: 'R&R Officer', state: 'Madhya Pradesh', district: 'Bhopal', department: 'Rehabilitation Authority', isActive: true },
    { id: 'USR-9', name: 'Dr. Sunil Joshi', email: 'analyst@bhoomisetu.gov.in', role: 'Policy Analyst', department: 'NITI Aayog', isActive: true },
  ];
}

// --- Generate Workflow Transitions ---
export function generateTransitions(projects: Project[]): WorkflowTransition[] {
  const transitions: WorkflowTransition[] = [];
  for (const proj of projects) {
    const stageIdx = WORKFLOW_STAGES_LIST.indexOf(proj.currentStage);
    for (let i = 0; i < stageIdx; i++) {
      transitions.push({
        id: id('WFT'),
        projectId: proj.id,
        fromStage: WORKFLOW_STAGES_LIST[i],
        toStage: WORKFLOW_STAGES_LIST[i + 1],
        action: i < 3 ? 'Submit' : 'Approve',
        performedBy: pick(OFFICERS),
        performedByRole: pick(['State Authority', 'District Collector', 'National Administrator']),
        timestamp: pastDate(18 - i),
        remarks: `Stage transition: ${WORKFLOW_STAGES_LIST[i]} → ${WORKFLOW_STAGES_LIST[i + 1]}`,
      });
    }
  }
  return transitions;
}

// --- Master Data Generation ---
export interface DemoData {
  projects: Project[];
  parcels: LandParcel[];
  families: AffectedFamily[];
  notifications: Notification[];
  awards: Award[];
  compensation: CompensationRecord[];
  possession: PossessionRecord[];
  milestones: Milestone[];
  documents: Document[];
  alerts: Alert[];
  auditEvents: AuditEvent[];
  transitions: WorkflowTransition[];
  integrations: Integration[];
  users: User[];
}

export function generateAllDemoData(): DemoData {
  const projects = generateProjects();
  const parcels = generateParcels(projects);
  const families = generateFamilies(projects);
  const notifications = generateNotifications(projects);
  const awards = generateAwards(projects, parcels);
  const compensation = generateCompensation(awards);
  const possession = generatePossession(parcels);
  const milestones = generateMilestones(projects);
  const documents = generateDocuments(projects);
  const alerts = generateAlerts(projects, milestones);
  const auditEvents = generateAuditEvents(projects);
  const transitions = generateTransitions(projects);
  const integrations = generateIntegrations();
  const users = generateUsers();

  return {
    projects, parcels, families, notifications, awards, compensation,
    possession, milestones, documents, alerts, auditEvents, transitions,
    integrations, users,
  };
}
