import { CaseItem, MOCK_CASES } from '../pages/CasesPage';

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

const SESSION_STORAGE_KEY = 'aegis_case_files_v1';

/**
 * Load cases from session storage if available, otherwise return initial cases.
 */
export const loadSessionCases = (): CaseItem[] => {
  if (typeof window === 'undefined') return MOCK_CASES;
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load cases from sessionStorage', e);
  }
  return MOCK_CASES;
};

/**
 * Save cases to session storage for session persistence across route changes.
 */
export const saveSessionCases = (cases: CaseItem[]): void => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cases));
  } catch (e) {
    console.warn('Failed to save cases to sessionStorage', e);
  }
};

/**
 * Isolated mock case generation function.
 * Given a scenario ID and existing cases, generates a unique CaseItem with CASE-0NN ID.
 * Replaceable with real backend logic when available.
 */
export const generateMockCase = (
  scenarioId: string,
  existingCases: CaseItem[]
): CaseItem => {
  // Determine next case numeric ID
  let maxIdNum = 3;
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
    const randomSectors = ['Sector 3 Sub-Basin', 'Sector 7 Highline', 'West Canal Perimeter', 'North Gate Intertie'];
    const sector = randomSectors[Math.floor(Math.random() * randomSectors.length)];
    return {
      id: newId,
      title: `${sector} Synthetic Breach`,
      description: 'Automated telemetry discrepancy synthesized by Ashwick surveillance matrix.',
      status: 'INVESTIGATION ACTIVE',
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
