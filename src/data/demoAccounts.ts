// ============================================================
// BhoomiSetu - Authoritative Demo Accounts & Credentials
// Synthetic Credentials for SIH Demonstration Environment
// ============================================================
import type { UserRole } from '../types';

export interface DemoAccount {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  name: string;
  department: string;
  state?: string;
  district?: string;
  avatar?: string;
}

/**
 * Synthetic demonstration credentials per SIH26016 specification.
 * In a production deployment, passwords must be securely hashed and verified
 * on a protected server with OAuth2/OIDC/SSO (e.g., Parichay / Jan Parichay).
 */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    username: 'admin',
    email: 'admin@bhoomisetu.gov.in',
    password: 'Admin@123',
    role: 'National Administrator',
    name: 'Dr. Anand Sharma',
    department: 'Ministry of Rural Development (DoLR)',
  },
  {
    username: 'central',
    email: 'central@bhoomisetu.gov.in',
    password: 'Central@123',
    role: 'Central Ministry Officer',
    name: 'Smt. Priya Mehta',
    department: 'Ministry of Road Transport & Highways',
  },
  {
    username: 'state',
    email: 'state@bhoomisetu.gov.in',
    password: 'State@123',
    role: 'State Authority',
    name: 'Shri Vikram Singh',
    department: 'Revenue & Land Reforms Department',
    state: 'Karnataka',
  },
  {
    username: 'district',
    email: 'district@bhoomisetu.gov.in',
    password: 'District@123',
    role: 'District Collector',
    name: 'Shri Raghav Patel',
    department: 'District Collectorate',
    state: 'Gujarat',
    district: 'Ahmedabad',
  },
  {
    username: 'lao',
    email: 'lao@bhoomisetu.gov.in',
    password: 'Lao@123',
    role: 'Land Acquisition Officer',
    name: 'Smt. Lakshmi Nair',
    department: 'Competent Authority Land Acquisition (CALA)',
    state: 'Tamil Nadu',
    district: 'Chennai',
  },
  {
    username: 'pia',
    email: 'pia@bhoomisetu.gov.in',
    password: 'Pia@123',
    role: 'Project Implementing Agency',
    name: 'Shri Manish Gupta',
    department: 'National Highways Authority of India (NHAI)',
    state: 'Maharashtra',
  },
  {
    username: 'field',
    email: 'field@bhoomisetu.gov.in',
    password: 'Field@123',
    role: 'Field Verification Officer',
    name: 'Shri Arjun Reddy',
    department: 'Directorate of Land Records & Survey',
    state: 'Telangana',
    district: 'Hyderabad',
  },
  {
    username: 'rr',
    email: 'rr@bhoomisetu.gov.in',
    password: 'RR@123',
    role: 'R&R Officer',
    name: 'Smt. Kavita Deshmukh',
    department: 'Rehabilitation & Resettlement Directorate',
    state: 'Madhya Pradesh',
    district: 'Bhopal',
  },
  {
    username: 'analyst',
    email: 'analyst@bhoomisetu.gov.in',
    password: 'Analyst@123',
    role: 'Policy Analyst',
    name: 'Dr. Sunil Joshi',
    department: 'NITI Aayog Infrastructure & Land Cell',
  },
];
