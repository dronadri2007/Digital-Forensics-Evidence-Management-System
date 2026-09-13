import { CaseItem } from '../pages/CasesPage';

export interface ScenarioDefinition {
  id: string;
  tierLabel?: string;
  title: string;
  description: string;
  evidenceAvailability?: 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';
  isWildcard?: boolean;
}

export const SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'tier-01',
    tierLabel: 'TIER 01',
    title: 'Open & Shut',
    description: 'Evidence-rich investigation with a clear starting lead.',
    evidenceAvailability: 'HIGH',
  },
  {
    id: 'tier-02',
    tierLabel: 'TIER 02',
    title: 'Cloned Plate',
    description: 'Vehicle and identity ambiguity requiring careful resolution.',
    evidenceAvailability: 'MEDIUM',
  },
  {
    id: 'tier-03',
    tierLabel: 'TIER 03',
    title: 'Staged Alibi',
    description: 'Conflicting evidence and alibi construction.',
    evidenceAvailability: 'LOW',
  },
  {
    id: 'tier-04',
    tierLabel: 'TIER 04',
    title: 'Cold Case',
    description: 'Sparse evidence requiring ranked inference under uncertainty.',
    evidenceAvailability: 'MINIMAL',
  },
];

export const WILDCARD_SCENARIO: ScenarioDefinition = {
  id: 'wildcard',
  title: 'GENERATE FRESH INCIDENT',
  description: 'Create a new synthetic investigation inside Ashwick.',
  isWildcard: true,
};

const LOCAL_STORAGE_KEY = 'aegis_case_files_v1';

/**
 * Load cases from local storage if available. Returns an empty array by default.
 */
export const loadStoredCases = (): CaseItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load cases from localStorage', e);
  }
  return [];
};

/**
 * Save cases to local storage for persistence across reloads, theme toggles, and navigation.
 */
export const saveStoredCases = (cases: CaseItem[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cases));
  } catch (e) {
    console.warn('Failed to save cases to localStorage', e);
  }
};

// Aliases for backward compatibility
export const loadSessionCases = loadStoredCases;
export const saveSessionCases = saveStoredCases;

/**
 * Update the status of a specific case in localStorage and return the updated cases list.
 */
export const updateCaseStatus = (
  caseId: string,
  status: 'INVESTIGATION ACTIVE' | 'INVESTIGATION COMPLETE'
): CaseItem[] => {
  const current = loadStoredCases();
  const updated = current.map((c) => (c.id === caseId ? { ...c, status } : c));
  saveStoredCases(updated);
  return updated;
};

/**
 * Archive or restore a specific case in localStorage and return the updated cases list.
 */
export const archiveCase = (caseId: string, isArchived: boolean = true): CaseItem[] => {
  const current = loadStoredCases();
  const updated = current.map((c) => (c.id === caseId ? { ...c, isArchived } : c));
  saveStoredCases(updated);
  return updated;
};

/**
 * Permanently delete a specific case and clean up its discovery state from localStorage.
 */
export const deleteCase = (caseId: string): CaseItem[] => {
  const current = loadStoredCases();
  const updated = current.filter((c) => c.id !== caseId);
  saveStoredCases(updated);
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(`aegis_case_discovery_v1_${caseId}`);
    } catch (e) {
      console.warn('Failed to remove case discovery state', e);
    }
  }
  return updated;
};

export type MotiveArchetype =
  | 'Financial Dispute'
  | 'Domestic / Jealousy'
  | 'Burglary Gone Wrong'
  | 'Corporate Cover-up'
  | 'Blackmail / Extortion'
  | 'Random Transient';

export type EvidenceScarcity =
  | 'Tier 1 — High Evidence'
  | 'Tier 2 — Medium Evidence'
  | 'Tier 3 — Low Evidence'
  | 'Tier 4 — Cold Case';

export type SceneType =
  | 'Residential'
  | 'Commercial'
  | 'Industrial / Port'
  | 'Public Space'
  | 'Transit / Infrastructure';

export type SuspectVictimRelationship =
  | 'Stranger'
  | 'Acquaintance'
  | 'Colleague'
  | 'Family'
  | 'Intimate / Domestic'
  | 'Unknown';

export type MethodComplexity =
  | 'Opportunistic'
  | 'Planned'
  | 'Elaborate'
  | 'Staged';

export interface WildcardConfig {
  incidentMode: 'Random' | 'Custom';
  motiveArchetype: MotiveArchetype;
  evidenceScarcity: EvidenceScarcity;
  sceneType: SceneType;
  relationship: SuspectVictimRelationship;
  methodComplexity: MethodComplexity;
}

export const MOTIVE_OPTIONS: MotiveArchetype[] = [
  'Financial Dispute',
  'Domestic / Jealousy',
  'Burglary Gone Wrong',
  'Corporate Cover-up',
  'Blackmail / Extortion',
  'Random Transient',
];

export const EVIDENCE_SCARCITY_OPTIONS: EvidenceScarcity[] = [
  'Tier 1 — High Evidence',
  'Tier 2 — Medium Evidence',
  'Tier 3 — Low Evidence',
  'Tier 4 — Cold Case',
];

export const SCENE_TYPE_OPTIONS: SceneType[] = [
  'Residential',
  'Commercial',
  'Industrial / Port',
  'Public Space',
  'Transit / Infrastructure',
];

export const RELATIONSHIP_OPTIONS: SuspectVictimRelationship[] = [
  'Stranger',
  'Acquaintance',
  'Colleague',
  'Family',
  'Intimate / Domestic',
  'Unknown',
];

export const METHOD_COMPLEXITY_OPTIONS: MethodComplexity[] = [
  'Opportunistic',
  'Planned',
  'Elaborate',
  'Staged',
];

/**
 * Isolated mock case generation function.
 * Given a scenario ID, existing cases, and optional wildcardConfig,
 * generates a unique CaseItem with CASE-0NN ID.
 * When no cases exist, starts at CASE-001.
 */
export const generateMockCase = (
  scenarioId: string,
  existingCases: CaseItem[],
  wildcardConfig?: WildcardConfig
): CaseItem => {
  // Determine next case numeric ID based on existing cases
  let maxIdNum = 0;
  for (const c of existingCases) {
    const match = c.id.match(/^CASE-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxIdNum) {
        maxIdNum = num;
      }
    }
  }
  const nextIdNum = maxIdNum + 1;
  const newId = `CASE-${String(nextIdNum).padStart(3, '0')}`;

  if (scenarioId === 'wildcard') {
    // Determine effective parameters
    const motive =
      wildcardConfig?.motiveArchetype ||
      MOTIVE_OPTIONS[Math.floor(Math.random() * MOTIVE_OPTIONS.length)];

    const scarcity =
      wildcardConfig?.evidenceScarcity ||
      EVIDENCE_SCARCITY_OPTIONS[Math.floor(Math.random() * EVIDENCE_SCARCITY_OPTIONS.length)];

    const scene =
      wildcardConfig?.sceneType ||
      SCENE_TYPE_OPTIONS[Math.floor(Math.random() * SCENE_TYPE_OPTIONS.length)];

    const relationship =
      wildcardConfig?.relationship ||
      RELATIONSHIP_OPTIONS[Math.floor(Math.random() * RELATIONSHIP_OPTIONS.length)];

    const complexity =
      wildcardConfig?.methodComplexity ||
      METHOD_COMPLEXITY_OPTIONS[Math.floor(Math.random() * METHOD_COMPLEXITY_OPTIONS.length)];

    // Evidence count and confidence by scarcity level
    const scarcityDetails: Record<EvidenceScarcity, { count: number; confidence: number }> = {
      'Tier 1 — High Evidence': { count: 9, confidence: 84 },
      'Tier 2 — Medium Evidence': { count: 7, confidence: 76 },
      'Tier 3 — Low Evidence': { count: 5, confidence: 62 },
      'Tier 4 — Cold Case': { count: 3, confidence: 45 },
    };
    const { count, confidence } = scarcityDetails[scarcity] || { count: 7, confidence: 75 };

    // Locations in Ashwick based on Scene Type
    const sceneLocations: Record<SceneType, string[]> = {
      'Residential': ['Vance Residential Enclave', 'Sector 2 Briarcliff Heights', 'Highline Residential Block C'],
      'Commercial': ['Ashwick Financial Quarter', 'Plaza Arcade Commercial Center', 'Central Exchange Suites'],
      'Industrial / Port': ['Pier 14 Terminal', 'East Canal Drydock 6', 'Sub-Basin Pumping Station 4'],
      'Public Space': ['Ashwick Civic Common', 'Memorial Promenade Plaza', 'Old Foundry Park Grounds'],
      'Transit / Infrastructure': ['Substation 9 Relay Vault', 'Metro Line 2 Conduit', 'North Gate Intertie Terminal'],
    };
    const locations = sceneLocations[scene] || ['Sector 7 Synthetic Perimeter'];
    const chosenLocation = locations[Math.floor(Math.random() * locations.length)];

    // Clean title and description derived from Motive + Scene + Relationship + Method Complexity
    const motiveTitles: Record<MotiveArchetype, { suffix: string; verb: string }> = {
      'Financial Dispute': { suffix: 'Asset Embezzlement', verb: 'ledger discrepancies and illicit asset diversion' },
      'Domestic / Jealousy': { suffix: 'Unlawful Entry Dispute', verb: 'unauthorized biometric collisions and access overrides' },
      'Burglary Gone Wrong': { suffix: 'Forced Vault Breach', verb: 'physical perimeter damage and tripped telemetry sensors' },
      'Corporate Cover-up': { suffix: 'Telemetry Suppression Audit', verb: 'coordinated CCTV feed blanking and falsified audit logs' },
      'Blackmail / Extortion': { suffix: 'Communications Intercept Trace', verb: 'secondary trunk line wiretaps and encrypted packet extortion' },
      'Random Transient': { suffix: 'Uncorrelated Intrusion Event', verb: 'unregistered movement across thermal sensors with zero RFID correlation' },
    };

    const motiveInfo = motiveTitles[motive] || { suffix: 'Incident Investigation', verb: 'anomalous sensor activity' };
    const title = `${chosenLocation} ${motiveInfo.suffix}`;
    const description = `${complexity} investigation into ${motiveInfo.verb}, involving ${relationship.toLowerCase()} dynamics at ${chosenLocation}.`;

    return {
      id: newId,
      title,
      description,
      status: 'INVESTIGATION ACTIVE',
      wildcardConfig: {
        motive,
        scene,
        scarcity,
        relationship,
        complexity,
        evidenceCount: count,
        confidence,
      },
    };
  }

  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  const scenarioTitles: Record<string, { title: string; desc: string }> = {
    'tier-01': {
      title: 'Ashwick Sector 4 Pumping Overrides',
      desc: 'Evidence-rich investigation into unauthorized automated valve overrides with clear initial CCTV records.',
    },
    'tier-02': {
      title: 'Pier 14 Terminal Cloned Telemetry',
      desc: 'Vehicle coordinate duplication and license plate ambiguity requiring optical correlation.',
    },
    'tier-03': {
      title: 'Substation 9 Staged Alibi Sequence',
      desc: 'Conflicting punch-clock access records and digital timeline contradictions.',
    },
    'tier-04': {
      title: 'Civic Transit Archival Cold Trace',
      desc: 'Sparse historic telemetry requiring ranked probability inference under sensor uncertainty.',
    },
  };

  const info = scenarioTitles[scenarioId] || {
    title: scenario ? `${scenario.title} Incident` : `Investigation ${newId}`,
    desc: scenario ? scenario.description : 'Synthetic investigation scenario inside Ashwick.',
  };

  return {
    id: newId,
    title: info.title,
    description: info.desc,
    status: 'INVESTIGATION ACTIVE',
  };
};
