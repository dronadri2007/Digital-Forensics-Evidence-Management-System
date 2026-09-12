/**
 * Service to manage discovery state persistence across session, reloads, and navigation.
 */

const DISCOVERY_STORAGE_PREFIX = 'aegis_case_discovery_v1_';

export interface PersistedDiscoveryState {
  stage: number;
  consumedActions?: string[];
  lastUpdated: string;
}

export interface CaseDiscoveryState {
  stage: number;
  consumedActions: string[];
}

export const loadCaseDiscoveryState = (
  caseId: string,
  isCaseComplete: boolean = false
): CaseDiscoveryState => {
  if (typeof window === 'undefined') return { stage: 0, consumedActions: [] };

  // If the case is already fully solved/complete, render the full graph (Stage 4)
  if (isCaseComplete) {
    return { stage: 4, consumedActions: [] };
  }

  try {
    const raw = localStorage.getItem(`${DISCOVERY_STORAGE_PREFIX}${caseId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      const stage = typeof parsed?.stage === 'number' ? Math.min(Math.max(parsed.stage, 0), 4) : 0;
      const consumedActions = Array.isArray(parsed?.consumedActions) ? parsed.consumedActions : [];
      return { stage, consumedActions };
    }
  } catch (e) {
    console.warn('Failed to load discovery state for case', caseId, e);
  }

  // Initial opening of a new/active case defaults to Stage 0 with empty consumedActions
  return { stage: 0, consumedActions: [] };
};

export const saveCaseDiscoveryState = (
  caseId: string,
  stage: number,
  consumedActions: string[] = []
): void => {
  if (typeof window === 'undefined') return;
  try {
    const payload: PersistedDiscoveryState = {
      stage: Math.min(Math.max(stage, 0), 4),
      consumedActions: Array.from(new Set(consumedActions)),
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(`${DISCOVERY_STORAGE_PREFIX}${caseId}`, JSON.stringify(payload));
  } catch (e) {
    console.warn('Failed to save discovery state for case', caseId, e);
  }
};

export const loadCaseDiscoveryStage = (
  caseId: string,
  isCaseComplete: boolean = false
): number => {
  return loadCaseDiscoveryState(caseId, isCaseComplete).stage;
};

export const saveCaseDiscoveryStage = (
  caseId: string,
  stage: number,
  consumedActions?: string[]
): void => {
  const current = loadCaseDiscoveryState(caseId);
  const actionsToSave = consumedActions ?? current.consumedActions;
  saveCaseDiscoveryState(caseId, stage, actionsToSave);
};

export const resetCaseDiscoveryStage = (caseId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${DISCOVERY_STORAGE_PREFIX}${caseId}`);
  } catch (e) {
    console.warn('Failed to reset discovery stage for case', caseId, e);
  }
};
