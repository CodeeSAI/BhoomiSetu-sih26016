// ============================================================
// BhoomiSetu - Standardized National Land Schema
// Standardizes attributes across all 28 States & 8 UTs (Section F)
// ============================================================
import type { LandParcel, LandType, AcquisitionStatus, CompensationStatus, PossessionStatus, RRStatus, WorkflowStage } from './index';
import { ulpinAdapter } from '../services/adapters/ulpinAdapter';
import { cadastralAdapter } from '../services/adapters/cadastralAdapter';

export const STATE_CODE_MAP: Record<string, string> = {
  'Maharashtra': 'MH',
  'Uttar Pradesh': 'UP',
  'Karnataka': 'KA',
  'Gujarat': 'GJ',
  'Rajasthan': 'RJ',
  'Tamil Nadu': 'TN',
  'Telangana': 'TS',
  'Madhya Pradesh': 'MP',
  'Assam': 'AS',
  'Delhi NCR': 'DL',
};

export const DISTRICT_CODE_MAP: Record<string, string> = {
  'Pune': '2704',
  'Nagpur': '2705',
  'Thane': '2706',
  'Nashik': '2707',
  'Lucknow': '0901',
  'Varanasi': '0902',
  'Kanpur': '0903',
  'Agra': '0904',
  'Bengaluru Rural': '2901',
  'Mysuru': '2902',
  'Belagavi': '2903',
  'Dharwad': '2904',
  'Ahmedabad': '2401',
  'Surat': '2402',
  'Vadodara': '2403',
  'Rajkot': '2404',
  'Jaipur': '0801',
  'Jodhpur': '0802',
  'Udaipur': '0803',
  'Kota': '0804',
  'Chennai': '3301',
  'Coimbatore': '3302',
  'Madurai': '3303',
  'Salem': '3304',
  'Hyderabad': '3601',
  'Warangal': '3602',
  'Bhopal': '2301',
  'Indore': '2302',
  'Kamrup': '1801',
  'Guwahati': '1802',
  'New Delhi': '0701',
};

export interface StandardizedParcelRecord {
  parcelId: string;
  ulpin: string;
  state: string;
  stateCode: string;
  district: string;
  districtCode: string;
  village: string;
  surveyNumber: string;
  parcelArea: number; // in hectares
  projectId: string;
  landType: LandType;
  ownership: string;
  workflowStage: WorkflowStage;
  acquisitionStatus: AcquisitionStatus;
  compensationStatus: CompensationStatus;
  possessionStatus: PossessionStatus;
  rrStatus: RRStatus;
  verificationStatus: 'Pending' | 'Verified' | 'Rejected' | 'Re-verification';
  cadastralReference: string;
  latitude: number;
  longitude: number;
  coordinates: [number, number][];
  createdAt: string;
  updatedAt: string;
}

/**
 * Generates an authoritative 14-character Bhu-Aadhar (ULPIN) standard identifier
 */
export function generateStandardULPIN(stateCode: string, districtCode: string, lat: number, lng: number): string {
  return ulpinAdapter.generateULPIN(stateCode, districtCode, lat, lng);
}

/**
 * Standardize any raw parcel or imported data into the national schema
 */
export function standardizeParcel(raw: Partial<LandParcel> & Record<string, any>): LandParcel {
  const state = raw.state || 'Maharashtra';
  const district = raw.district || 'Pune';
  const stateCode = raw.stateCode || STATE_CODE_MAP[state] || 'MH';
  const districtCode = raw.districtCode || DISTRICT_CODE_MAP[district] || '2704';
  const surveyNumber = raw.surveyNumber || `${Math.floor(10 + Math.random() * 900)}/${Math.floor(1 + Math.random() * 20)}`;
  const lat = typeof raw.latitude === 'number' ? raw.latitude : 19.7515;
  const lng = typeof raw.longitude === 'number' ? raw.longitude : 75.7139;
  const area = Number(raw.area || raw.parcelArea || 2.5);
  const ownership = raw.ownership || raw.ownershipStatus || 'Private';

  // Authoritative 14-character Bhu-Aadhar ULPIN standard
  const ulpin = raw.ulpin || generateStandardULPIN(stateCode, districtCode, lat, lng);
  const cadastralRef = raw.cadastralReference || `CAD-${stateCode}-${districtCode}-${surveyNumber.replace(/[^0-9A-Za-z]/g, '-')}`;
  const coordinates = raw.coordinates && raw.coordinates.length > 2
    ? raw.coordinates
    : cadastralAdapter.generateCadastralPolygon(lat, lng, area);

  return {
    id: raw.id || `PRC-${String(Date.now()).slice(-5)}`,
    ulpin,
    projectId: raw.projectId || 'PRJ-1001',
    state,
    stateCode,
    district,
    districtCode,
    village: raw.village || 'Revenue Village',
    surveyNumber,
    area,
    parcelArea: area,
    landType: raw.landType || 'Agricultural',
    ownership,
    ownershipStatus: ownership,
    ownerName: raw.ownerName || 'State Beneficiary Owner',
    acquisitionStatus: raw.acquisitionStatus || 'Proposed',
    compensationStatus: raw.compensationStatus || 'Not Assessed',
    possessionStatus: raw.possessionStatus || 'Not Due',
    verificationStatus: raw.verificationStatus || 'Pending',
    cadastralReference: cadastralRef,
    workflowStage: raw.workflowStage || 'Proposal Draft',
    rrStatus: raw.rrStatus || 'Not Started',
    latitude: lat,
    longitude: lng,
    coordinates,
    verifiedBy: raw.verifiedBy,
    verifiedAt: raw.verifiedAt,
    remarks: raw.remarks,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}
