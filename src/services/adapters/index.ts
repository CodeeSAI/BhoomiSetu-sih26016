// ============================================================
// BhoomiSetu - Integration Adapters Registry
// Central dispatch for all government integration connectors
// ============================================================
import { dilrmpAdapter } from './dilrmpAdapter';
import { ulpinAdapter } from './ulpinAdapter';
import { cadastralAdapter } from './cadastralAdapter';
import { apiSetuAdapter } from './apiSetuAdapter';
import { financialAdapter } from './financialAdapter';
import { notificationAdapter } from './notificationAdapter';
import { documentAdapter } from './documentAdapter';
import type { IntegrationAdapter } from './types';

export * from './types';
export {
  dilrmpAdapter,
  ulpinAdapter,
  cadastralAdapter,
  apiSetuAdapter,
  financialAdapter,
  notificationAdapter,
  documentAdapter,
};

export const ALL_ADAPTERS: IntegrationAdapter[] = [
  dilrmpAdapter,
  ulpinAdapter,
  cadastralAdapter,
  apiSetuAdapter,
  financialAdapter,
  notificationAdapter,
  documentAdapter,
];

export function getAdapterById(id: string): IntegrationAdapter | undefined {
  return ALL_ADAPTERS.find(a => a.id === id);
}
