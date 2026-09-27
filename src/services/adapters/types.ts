// ============================================================
// BhoomiSetu - Integration Adapter Contracts & Types
// Standardized interfaces for National GovTech Interoperability
// ============================================================

export type AdapterConnectionState =
  | 'Connected'
  | 'Official Sandbox'
  | 'Credential Required'
  | 'Degraded'
  | 'Error';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'credential_required';
  latencyMs: number;
  message: string;
  timestamp: string;
}

export interface AuthResult {
  success: boolean;
  authenticated: boolean;
  mode: 'real_credentials' | 'official_sandbox' | 'unauthenticated';
  token?: string;
  error?: string;
  timestamp: string;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  errors: number;
  latencyMs: number;
  details: string;
  timestamp: string;
}

export interface SyncStats {
  lastSync?: string;
  recordsSynced: number;
  errors: number;
  latencyMs: number;
  status: AdapterConnectionState;
}

export interface IntegrationAdapter<T = any> {
  id: string;
  name: string;
  system: string;
  purpose: string;
  environment: 'Production' | 'Staging' | 'Official Sandbox';
  connectionStatus: AdapterConnectionState;
  
  health(): Promise<HealthCheckResult>;
  authenticate(): Promise<AuthResult>;
  get(id: string): Promise<T | null>;
  list(params?: Record<string, any>): Promise<T[]>;
  create?(data: Partial<T>): Promise<T>;
  update?(id: string, data: Partial<T>): Promise<T>;
  sync(): Promise<SyncResult>;
  
  getStats(): SyncStats;
  getConfig(): Record<string, string>;
  updateConfig(config: Record<string, string>): void;
}
