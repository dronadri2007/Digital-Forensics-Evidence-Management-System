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

export type TemporalWindow =
  | 'Late Night (22:00 – 04:00)'
  | 'Early Morning (04:00 – 08:00)'
  | 'Daytime (08:00 – 17:00)'
  | 'Evening (17:00 – 22:00)';

export interface WildcardConfig {
  incidentMode: 'Random' | 'Custom';
  motiveArchetype: MotiveArchetype;
  evidenceScarcity: EvidenceScarcity;
  sceneType: SceneType;
  temporalWindow: TemporalWindow;
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

export const TEMPORAL_WINDOW_OPTIONS: TemporalWindow[] = [
  'Late Night (22:00 – 04:00)',
  'Early Morning (04:00 – 08:00)',
  'Daytime (08:00 – 17:00)',
  'Evening (17:00 – 22:00)',
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
    const isCustom = wildcardConfig?.incidentMode === 'Custom';

    // Determine effective parameters
    const motive = isCustom
      ? wildcardConfig.motiveArchetype
      : MOTIVE_OPTIONS[Math.floor(Math.random() * MOTIVE_OPTIONS.length)];

    const scarcity = isCustom
      ? wildcardConfig.evidenceScarcity
      : EVIDENCE_SCARCITY_OPTIONS[Math.floor(Math.random() * EVIDENCE_SCARCITY_OPTIONS.length)];

    const scene = isCustom
      ? wildcardConfig.sceneType
      : SCENE_TYPE_OPTIONS[Math.floor(Math.random() * SCENE_TYPE_OPTIONS.length)];

    const timeWindow = isCustom
      ? wildcardConfig.temporalWindow
      : TEMPORAL_WINDOW_OPTIONS[Math.floor(Math.random() * TEMPORAL_WINDOW_OPTIONS.length)];

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

    // Clean title and description derived from Motive + Scene + Temporal Window
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
    const description = `Investigation into ${motiveInfo.verb} recorded during ${timeWindow.toLowerCase()} at ${chosenLocation}.`;

    return {
      id: newId,
      title,
      description,
      status: 'INVESTIGATION ACTIVE',
      wildcardConfig: {
        motive,
        scene,
        scarcity,
        window: timeWindow,
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
