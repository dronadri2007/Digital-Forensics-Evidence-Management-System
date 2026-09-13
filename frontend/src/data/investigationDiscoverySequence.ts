import {
  GraphNodeData,
  GraphEdgeData,
  AiLogEntry,
} from './mockInvestigationData';

export type SuggestionIconType =
  | 'search'
  | 'radio'
  | 'camera'
  | 'user-check'
  | 'fingerprint'
  | 'file-text'
  | 'shield-check';

export interface SuggestionChipItem {
  id: string;
  label: string;
  icon: SuggestionIconType;
  /** If true, advances the discovery stage; if false, emits an informative response */
  isLeadAction: boolean;
  /** Informative response if not advancing stage */
  infoResponse?: {
    label: string;
    text: string;
  };
}

export interface DiscoveryStageData {
  stage: number;
  objective: string;
  latestFinding: string;
  nextLead: string;
  confidence: number;
  evidenceCount: number;
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  newLogs: AiLogEntry[];
  suggestions: SuggestionChipItem[];
}

// ---------------------------------------------------------------------------
// NODES CATALOG
// ---------------------------------------------------------------------------

export const NODE_LIAM_WRIGHT: GraphNodeData = {
  id: 'liam_wright',
  name: 'Liam Wright',
  category: 'Person',
  semantic: 'victim',
  confidence: 95,
  roleSubtitle: 'Resident · Sector 2',
  x: 320,
  y: 200,
  inspector: {
    entityType: 'PERSON // VICTIM',
    nameId: 'Liam Wright (ID: ASH-VIC-902)',
    confidence: '95%',
    knownRelationships: [
      'Pier 14 Terminal (Last Known Visit)',
      'Marcus Vance (Commercial Contact)',
      'Vance Logistics (Former Contractor)'
    ],
    evidence: [
      'Physical access badge recovered at Pier 14 access stairs',
      'Coroner toxicological report: volatile anesthetic compound detected',
      'Encrypted voice-memo fragment retrieved from handset'
    ],
    timeline: [
      { timestamp: '01:15:00', event: 'Departed Sector 2 apartment' },
      { timestamp: '01:45:00', event: 'Perimeter optical gate recorded passage at Pier 14' },
      { timestamp: '02:02:18', event: 'Biometric telemetry interrupted' }
    ]
  }
};

export const NODE_PIER_14: GraphNodeData = {
  id: 'pier_14',
  name: 'Pier 14 Terminal',
  category: 'Location',
  semantic: 'neutral',
  confidence: 88,
  roleSubtitle: 'Industrial Port Zone',
  x: 430,
  y: 350,
  inspector: {
    entityType: 'LOCATION // FACILITY',
    nameId: 'Ashwick Pier 14 Terminal',
    confidence: '88%',
    knownRelationships: [
      'Liam Wright (Last Known Presence)',
      'CCTV-P14-NORTH (Perimeter Optical)',
      'Elena Rostova (Terminal Override Point)'
    ],
    evidence: [
      'Pumping station valve manifold physical override lever engaged',
      'Commercial boot sole imprint matching Vibram tread at North Door'
    ],
    timeline: [
      { timestamp: '01:45:00', event: 'Liam Wright check-in recorded' },
      { timestamp: '02:14:09', event: 'Perimeter transit by black sedan' },
      { timestamp: '02:22:30', event: 'Sector 4 valve distribution zeroed' }
    ]
  }
};

export const NODE_LATENT_PRINT: GraphNodeData = {
  id: 'latent_print',
  name: 'Latent Print (12A)',
  category: 'Evidence',
  semantic: 'neutral',
  confidence: 65,
  roleSubtitle: 'Item 12A // Forensic Recovery',
  x: 230,
  y: 350,
  inspector: {
    entityType: 'EVIDENCE // PHYSICAL',
    nameId: 'Latent Friction Ridge Scan (Item 12A)',
    confidence: '65%',
    knownRelationships: [
      'Pier 14 Terminal (Console Lift)',
      'Ashwick Central Crime Lab'
    ],
    evidence: [
      '8-point partial ridge capture from Terminal 04 physical key-switch',
      'Cyanoacrylate ester fuming scan confirmed high friction clarity'
    ],
    timeline: [
      { timestamp: '02:40:12', event: 'Evidence technician field lift logged' }
    ]
  }
};

export const NODE_PIXEL_DEVICE: GraphNodeData = {
  id: 'pixel_device',
  name: 'Pixel 8 Enclave',
  category: 'Device',
  semantic: 'neutral',
  confidence: 94,
  roleSubtitle: 'Hardware ID: PX8-551',
  x: 310,
  y: 40,
  inspector: {
    entityType: 'DEVICE // HARDWARE',
    nameId: 'Google Pixel 8 (Hardware Enclave)',
    confidence: '94%',
    knownRelationships: [
      'Liam Wright (Owner)',
      'Sector 4 Cell Tower'
    ],
    evidence: [
      'Physical hardware extraction unlocked via bypass image',
      'Unsent draft message referencing unscheduled dispatch shift'
    ],
    timeline: [
      { timestamp: '01:44:22', event: 'Bluetooth tethering to terminal gate severed' }
    ]
  }
};

export const NODE_MARCUS_VANCE: GraphNodeData = {
  id: 'marcus_vance',
  name: 'Marcus Vance',
  category: 'Person',
  semantic: 'neutral',
  confidence: 45,
  roleSubtitle: 'Executive VP, Vance Logistics',
  x: 140,
  y: 180,
  inspector: {
    entityType: 'PERSON // WITNESS OF INTEREST',
    nameId: 'Marcus Vance (ID: ASH-VP-201)',
    confidence: '45%',
    knownRelationships: [
      'Liam Wright (Commercial Client)',
      'Elena Rostova (Reporting Manager)',
      'Pier 14 Terminal (Facility Lease)'
    ],
    evidence: [
      'Smart-meter home departure log verified at 01:30:12',
      'Cellular handset handoff logged Sector 2 perimeter'
    ],
    timeline: [
      { timestamp: '01:30:12', event: 'Smart-meter departure verification' }
    ]
  }
};

export const NODE_JULIAN_CROSS: GraphNodeData = {
  id: 'julian_cross',
  name: 'Julian Cross',
  category: 'Person',
  semantic: 'neutral',
  confidence: 38,
  roleSubtitle: 'Contract Systems Engineer',
  x: 180,
  y: 400,
  inspector: {
    entityType: 'PERSON // SYSTEMS ENGINEER',
    nameId: 'Julian Cross (ID: ASH-ENG-108)',
    confidence: '38%',
    knownRelationships: [
      'Pier 14 Terminal (Pump Firmware Contractor)',
      'Liam Wright (On-Site Colleague)'
    ],
    evidence: [
      'Signed maintenance pass for Pier 14 bypass valve',
      'Remote SSH diagnostics connection logged at 00:45:00'
    ],
    timeline: [
      { timestamp: '00:45:00', event: 'Remote test bench session initiated' }
    ]
  }
};

export const NODE_CCTV_P14: GraphNodeData = {
  id: 'cctv_p14',
  name: 'CCTV-P14-NORTH',
  category: 'Camera',
  semantic: 'neutral',
  confidence: 99,
  roleSubtitle: 'High-Res Optical ANPR',
  x: 620,
  y: 400,
  inspector: {
    entityType: 'CAMERA // SENSOR',
    nameId: 'CCTV-P14-NORTH (Municipal Optical Grid)',
    confidence: '99%',
    knownRelationships: [
      'Pier 14 Terminal (North Perimeter Gate)',
      'Audi RS6 (Captured Entity)'
    ],
    evidence: [
      'Frame 4492: Front bumper plate 49-X-204 captured in high-contrast IR',
      'Optical timestamp confirms exact vehicle entry at 02:14:09'
    ],
    timeline: [
      { timestamp: '02:14:09', event: 'Motion trigger and license plate recognition logged' }
    ]
  }
};

export const NODE_AUDI_RS6: GraphNodeData = {
  id: 'audi_rs6',
  name: 'Audi RS6 (49-X-204)',
  category: 'Vehicle',
  semantic: 'neutral',
  confidence: 87,
  roleSubtitle: 'Black Sedan // Plate 49-X-204',
  x: 770,
  y: 350,
  inspector: {
    entityType: 'VEHICLE // CONVEYANCE',
    nameId: '2023 Audi RS6 Avant (Plate: 49-X-204)',
    confidence: '87%',
    knownRelationships: [
      'Elena Rostova (Registered Title Holder)',
      'CCTV-P14-NORTH (Optical Sighting)'
    ],
    evidence: [
      'State DMV Title confirms registration to Elena Rostova private address',
      'Pirelli tire tread impression at North Gate matches vehicle specifications'
    ],
    timeline: [
      { timestamp: '02:14:09', event: 'Photographed passing Pier 14 North Gate' },
      { timestamp: '02:31:40', event: 'Photographed outbound on Eastern Expressway' }
    ]
  }
};

export const NODE_ELENA_ROSTOVA_NEUTRAL: GraphNodeData = {
  id: 'elena_rostova',
  name: 'Elena Rostova',
  category: 'Person',
  semantic: 'neutral',
  confidence: 54,
  roleSubtitle: 'Senior Ops Dispatcher',
  x: 580,
  y: 190,
  inspector: {
    entityType: 'PERSON // VEHICLE OWNER',
    nameId: 'Elena Rostova (ID: ASH-DSP-411)',
    confidence: '54%',
    knownRelationships: [
      'Audi RS6 49-X-204 (Registered Title)',
      'Pier 14 Terminal (Supervisory Authorization)',
      'Marcus Vance (Logistics Liaison)'
    ],
    evidence: [
      'DMV Title confirms sole ownership of Audi RS6',
      'Claimed punch-clock shift alibi at central dispatch office'
    ],
    timeline: [
      { timestamp: '01:15:00', event: 'Recorded on central dispatch badge log' },
      { timestamp: '02:14:09', event: 'Registered vehicle sighted at Pier 14' }
    ]
  }
};

export const NODE_ELENA_ROSTOVA_SUSPECT: GraphNodeData = {
  ...NODE_ELENA_ROSTOVA_NEUTRAL,
  semantic: 'suspect',
  confidence: 76,
  roleSubtitle: 'Senior Ops Dispatcher // POI',
};

export const NODE_ELENA_ROSTOVA_PRIME: GraphNodeData = {
  ...NODE_ELENA_ROSTOVA_NEUTRAL,
  semantic: 'prime_suspect',
  confidence: 92,
  roleSubtitle: 'Senior Ops Dispatcher // PRIME SUSPECT',
};

export const NODE_VORTEX_HANDLE: GraphNodeData = {
  id: 'vortex_handle',
  name: '@vortex_0x',
  category: 'Handle',
  semantic: 'neutral',
  confidence: 73,
  roleSubtitle: 'Encrypted Telemetry Identity',
  x: 740,
  y: 40,
  inspector: {
    entityType: 'HANDLE // DIGITAL IDENTITY',
    nameId: '@vortex_0x (Encrypted Relay)',
    confidence: '73%',
    knownRelationships: [
      'Elena Rostova (Recovery Email Match)',
      'Sector 4 Gateway Router (Payload Recipient)'
    ],
    evidence: [
      'Cryptographic session token recovered from dispatch terminal cache',
      'Telemetry payload distribution timestamped 02:18:11'
    ],
    timeline: [
      { timestamp: '02:18:11', event: 'Dispatched encrypted SHA-256 payload to dispatch router' }
    ]
  }
};

export const NODE_BANK_STMT_Q3: GraphNodeData = {
  id: 'bank_stmt_q3',
  name: 'Bank Statement Q3',
  category: 'Evidence',
  semantic: 'neutral',
  confidence: 94,
  roleSubtitle: 'Offshore Wire Ledger',
  x: 920,
  y: 120,
  inspector: {
    entityType: 'EVIDENCE // FINANCIAL DOCUMENT',
    nameId: 'Bank Statement Q3 (Cygnus Offshore Escrow)',
    confidence: '94%',
    knownRelationships: [
      'Elena Rostova (Beneficiary Account)',
      'Marcus Vance (Debtor Account)',
    ],
    evidence: [
      'Transfer reference TX-99201 settled 48 hours prior to intrusion',
      '$180,000 disbursement under shell consulting invoice',
    ],
    timeline: [
      { timestamp: '23:40:00', event: 'Ledger settlement confirmed via correspondent banking' },
    ],
  },
};

// ---------------------------------------------------------------------------
// PROGRESSIVE DISCOVERY STAGES
// ---------------------------------------------------------------------------

export const DISCOVERY_STAGES: DiscoveryStageData[] = [
  // -------------------------------------------------------------------------
  // STAGE 0: Initial State (3 nodes, 2 edges, 1 log, low confidence)
  // -------------------------------------------------------------------------
  {
    stage: 0,
    objective: 'Establish initial timeline and forensic contacts around Pier 14.',
    latestFinding: 'Preliminary crime scene processing underway at Pier 14 North Gate.',
    nextLead: 'Trace sector telecommunications and optical coverage.',
    confidence: 28,
    evidenceCount: 2,
    nodes: [NODE_LIAM_WRIGHT, NODE_PIER_14, NODE_LATENT_PRINT],
    edges: [
      {
        id: 'e_init_1',
        source: 'liam_wright',
        target: 'pier_14',
        semantic: 'forensic',
        label: 'Last Known Location',
      },
      {
        id: 'e_init_2',
        source: 'pier_14',
        target: 'latent_print',
        semantic: 'forensic',
        label: 'Collected at Scene',
      },
    ],
    newLogs: [
      {
        timestamp: '00:01:14',
        label: 'CASE INITIATED',
        text: 'Initial briefing logged. Scene secured at Pier 14.',
      },
    ],
    suggestions: [
      {
        id: 's0_telecom',
        label: 'Trace telecom around the scene',
        icon: 'radio',
        isLeadAction: true,
      },
      {
        id: 's0_cctv',
        label: 'Check CCTV corridor near the scene',
        icon: 'camera',
        isLeadAction: true,
      },
      {
        id: 's0_witness',
        label: 'Scan local registry for witness reports',
        icon: 'search',
        isLeadAction: false,
        infoResponse: {
          label: 'REGISTRY SEARCH',
          text: 'No registered civilian witnesses active in Sector 4 between 01:00 and 03:00.',
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // STAGE 1: Telecom Trace (Adds devices and persons of interest)
  // -------------------------------------------------------------------------
  {
    stage: 1,
    objective: 'Correlate active handsets and physical access logs around Pier 14.',
    latestFinding: 'Tower 1 Sector 4 azimuth confirms 3 active devices in scene perimeter.',
    nextLead: 'Inspect optical surveillance corridor covering the entry road.',
    confidence: 45,
    evidenceCount: 4,
    nodes: [
      NODE_LIAM_WRIGHT,
      NODE_PIER_14,
      NODE_LATENT_PRINT,
      NODE_PIXEL_DEVICE,
      NODE_MARCUS_VANCE,
      NODE_JULIAN_CROSS,
    ],
    edges: [
      {
        id: 'e_init_1',
        source: 'liam_wright',
        target: 'pier_14',
        semantic: 'forensic',
        label: 'Last Known Location',
      },
      {
        id: 'e_init_2',
        source: 'pier_14',
        target: 'latent_print',
        semantic: 'forensic',
        label: 'Collected at Scene',
      },
      {
        id: 'e1',
        source: 'pixel_device',
        target: 'liam_wright',
        semantic: 'forensic',
        label: 'Forensic Hardware Extraction',
      },
      {
        id: 'e8',
        source: 'julian_cross',
        target: 'pier_14',
        semantic: 'circumstantial',
        label: 'Cell Tower Proximity Ping',
      },
      {
        id: 'e2',
        source: 'marcus_vance',
        target: 'liam_wright',
        semantic: 'circumstantial',
        label: 'Prior Shift Communications',
      },
    ],
    newLogs: [
      {
        timestamp: '00:03:42',
        label: 'TOWER 1 SCAN',
        text: '3 devices active in scene sector between 22:30 and 01:00.',
      },
    ],
    suggestions: [
      {
        id: 's1_cctv',
        label: 'Check CCTV corridor near the scene',
        icon: 'camera',
        isLeadAction: true,
      },
      {
        id: 's1_alibi',
        label: 'Verify alibis of active handset owners',
        icon: 'user-check',
        isLeadAction: false,
        infoResponse: {
          label: 'ALIBI VERIFY',
          text: 'Marcus Vance smart-meter verifies home departure at 01:30. Systems engineer alibi pending.',
        },
      },
      {
        id: 's1_engineer',
        label: 'Run background check on systems engineer',
        icon: 'search',
        isLeadAction: false,
        infoResponse: {
          label: 'BACKGROUND AUDIT',
          text: 'Julian Cross holds active contractor clearance. Remote test bench log timestamps match.',
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // STAGE 2: CCTV & Vehicle Correlation (Camera, Vehicle, Elena neutral)
  // -------------------------------------------------------------------------
  {
    stage: 2,
    objective: 'Investigate perimeter vehicle sighting and driver authorization.',
    latestFinding: 'Optical ANPR match correlates registered Audi RS6 with gate crossing at 02:14:09.',
    nextLead: 'Check digital footprint of registered vehicle owner.',
    confidence: 64,
    evidenceCount: 6,
    nodes: [
      NODE_LIAM_WRIGHT,
      NODE_PIER_14,
      NODE_LATENT_PRINT,
      NODE_PIXEL_DEVICE,
      NODE_MARCUS_VANCE,
      NODE_JULIAN_CROSS,
      NODE_CCTV_P14,
      NODE_AUDI_RS6,
      NODE_ELENA_ROSTOVA_NEUTRAL,
    ],
    edges: [
      {
        id: 'e_init_1',
        source: 'liam_wright',
        target: 'pier_14',
        semantic: 'forensic',
        label: 'Last Known Location',
      },
      {
        id: 'e_init_2',
        source: 'pier_14',
        target: 'latent_print',
        semantic: 'forensic',
        label: 'Collected at Scene',
      },
      {
        id: 'e1',
        source: 'pixel_device',
        target: 'liam_wright',
        semantic: 'forensic',
        label: 'Forensic Hardware Extraction',
      },
      {
        id: 'e8',
        source: 'julian_cross',
        target: 'pier_14',
        semantic: 'circumstantial',
        label: 'Cell Tower Proximity Ping',
      },
      {
        id: 'e2',
        source: 'marcus_vance',
        target: 'liam_wright',
        semantic: 'circumstantial',
        label: 'Prior Shift Communications',
      },
      {
        id: 'e7',
        source: 'cctv_p14',
        target: 'pier_14',
        semantic: 'forensic',
        label: 'Physical Perimeter Camera',
      },
      {
        id: 'e5',
        source: 'cctv_p14',
        target: 'audi_rs6',
        semantic: 'forensic',
        label: 'Optical ANPR Recognition',
      },
      {
        id: 'e6',
        source: 'audi_rs6',
        target: 'elena_rostova',
        semantic: 'forensic',
        label: 'DMV Title Registration',
      },
    ],
    newLogs: [
      {
        timestamp: '00:06:19',
        label: 'CCTV RECOVERY',
        text: 'Vehicle identified at Pier 14 North Gate at 02:14:09.',
      },
    ],
    suggestions: [
      {
        id: 's2_digital',
        label: 'Check digital traces on the vehicle owner',
        icon: 'search',
        isLeadAction: true,
      },
      {
        id: 's2_dmv',
        label: 'Pull DMV registration history',
        icon: 'file-text',
        isLeadAction: false,
        infoResponse: {
          label: 'DMV QUERY',
          text: 'Title 49-X-204 confirms sole ownership of 2023 Audi RS6 registered to Elena Rostova.',
        },
      },
      {
        id: 's2_keycard',
        label: 'Review gate access keycard logs',
        icon: 'fingerprint',
        isLeadAction: false,
        infoResponse: {
          label: 'KEYCARD AUDIT',
          text: 'Terminal 04 administrative override token logged at 02:22:30 matching dispatch tier.',
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // STAGE 3: Digital Handle Pivot (Handle node added, Elena -> amber suspect)
  // -------------------------------------------------------------------------
  {
    stage: 3,
    objective: 'Resolve cryptographic identity and access token usage.',
    latestFinding: 'Breach database correlates digital handle recovery email with dispatch administrator.',
    nextLead: 'Cross-reference declared alibi against cellular tower telemetry.',
    confidence: 78,
    evidenceCount: 7,
    nodes: [
      NODE_LIAM_WRIGHT,
      NODE_PIER_14,
      NODE_LATENT_PRINT,
      NODE_PIXEL_DEVICE,
      NODE_MARCUS_VANCE,
      NODE_JULIAN_CROSS,
      NODE_CCTV_P14,
      NODE_AUDI_RS6,
      NODE_ELENA_ROSTOVA_SUSPECT,
      NODE_VORTEX_HANDLE,
    ],
    edges: [
      {
        id: 'e_init_1',
        source: 'liam_wright',
        target: 'pier_14',
        semantic: 'forensic',
        label: 'Last Known Location',
      },
      {
        id: 'e_init_2',
        source: 'pier_14',
        target: 'latent_print',
        semantic: 'forensic',
        label: 'Collected at Scene',
      },
      {
        id: 'e1',
        source: 'pixel_device',
        target: 'liam_wright',
        semantic: 'forensic',
        label: 'Forensic Hardware Extraction',
      },
      {
        id: 'e8',
        source: 'julian_cross',
        target: 'pier_14',
        semantic: 'circumstantial',
        label: 'Cell Tower Proximity Ping',
      },
      {
        id: 'e2',
        source: 'marcus_vance',
        target: 'liam_wright',
        semantic: 'circumstantial',
        label: 'Prior Shift Communications',
      },
      {
        id: 'e7',
        source: 'cctv_p14',
        target: 'pier_14',
        semantic: 'forensic',
        label: 'Physical Perimeter Camera',
      },
      {
        id: 'e5',
        source: 'cctv_p14',
        target: 'audi_rs6',
        semantic: 'forensic',
        label: 'Optical ANPR Recognition',
      },
      {
        id: 'e6',
        source: 'audi_rs6',
        target: 'elena_rostova',
        semantic: 'forensic',
        label: 'DMV Title Registration',
      },
      {
        id: 'e10',
        source: 'elena_rostova',
        target: 'vortex_handle',
        semantic: 'circumstantial',
        label: 'Correlated SIM Fingerprint',
      },
      {
        id: 'e4',
        source: 'elena_rostova',
        target: 'pier_14',
        semantic: 'forensic',
        label: 'Terminal 04 Override Token',
      },
    ],
    newLogs: [
      {
        timestamp: '00:09:50',
        label: 'BREACH DATABASE',
        text: 'Handle tied to recovery email matching dispatch registrations.',
      },
    ],
    suggestions: [
      {
        id: 's3_alibi_cross',
        label: 'Cross-check alibi against telecom',
        icon: 'user-check',
        isLeadAction: true,
      },
      {
        id: 's3_token',
        label: 'Verify dispatch terminal keycard token',
        icon: 'fingerprint',
        isLeadAction: false,
        infoResponse: {
          label: 'TOKEN AUDIT',
          text: 'Cryptographic session token on Terminal 04 issued directly to Elena Rostova dispatch terminal.',
        },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // STAGE 4: Alibi Collision & Prime Suspect (Elena -> red, contradiction line)
  // -------------------------------------------------------------------------
  {
    stage: 4,
    objective: 'Finalize corroborating evidence chain and prepare case briefing.',
    latestFinding: 'Conclusive alibi collision established. Optical gate timestamps contradict claimed alibi by 47 minutes.',
    nextLead: 'Case ready for formal resolution.',
    confidence: 92,
    evidenceCount: 8,
    nodes: [
      NODE_LIAM_WRIGHT,
      NODE_PIER_14,
      NODE_LATENT_PRINT,
      NODE_PIXEL_DEVICE,
      NODE_MARCUS_VANCE,
      NODE_JULIAN_CROSS,
      NODE_CCTV_P14,
      NODE_AUDI_RS6,
      NODE_ELENA_ROSTOVA_PRIME,
      NODE_VORTEX_HANDLE,
      NODE_BANK_STMT_Q3,
    ],
    edges: [
      {
        id: 'e_init_1',
        source: 'liam_wright',
        target: 'pier_14',
        semantic: 'forensic',
        label: 'Last Known Location',
      },
      {
        id: 'e_init_2',
        source: 'pier_14',
        target: 'latent_print',
        semantic: 'forensic',
        label: 'Collected at Scene',
      },
      {
        id: 'e1',
        source: 'pixel_device',
        target: 'liam_wright',
        semantic: 'forensic',
        label: 'Forensic Hardware Extraction',
      },
      {
        id: 'e8',
        source: 'julian_cross',
        target: 'pier_14',
        semantic: 'circumstantial',
        label: 'Cell Tower Proximity Ping',
      },
      {
        id: 'e2',
        source: 'marcus_vance',
        target: 'liam_wright',
        semantic: 'circumstantial',
        label: 'Prior Shift Communications',
      },
      {
        id: 'e7',
        source: 'cctv_p14',
        target: 'pier_14',
        semantic: 'forensic',
        label: 'Physical Perimeter Camera',
      },
      {
        id: 'e5',
        source: 'cctv_p14',
        target: 'audi_rs6',
        semantic: 'forensic',
        label: 'Optical ANPR Recognition',
      },
      {
        id: 'e6',
        source: 'audi_rs6',
        target: 'elena_rostova',
        semantic: 'forensic',
        label: 'DMV Title Registration',
      },
      {
        id: 'e10',
        source: 'elena_rostova',
        target: 'vortex_handle',
        semantic: 'circumstantial',
        label: 'Correlated SIM Fingerprint',
      },
      {
        id: 'e4',
        source: 'elena_rostova',
        target: 'pier_14',
        semantic: 'forensic',
        label: 'Terminal 04 Override Token',
      },
      {
        id: 'e11',
        source: 'elena_rostova',
        target: 'cctv_p14',
        semantic: 'contradiction',
        label: 'Alibi Log vs Optical Gate Timestamp',
      },
      {
        id: 'e_bank_elena',
        source: 'bank_stmt_q3',
        target: 'elena_rostova',
        semantic: 'forensic',
        label: 'Financial Wire Trace',
      },
    ],
    newLogs: [
      {
        timestamp: '00:12:30',
        label: 'ALIBI COLLISION',
        text: 'Claimed location contradicts tower ping and optical gate by 47 minutes.',
      },
    ],
    suggestions: [
      {
        id: 's4_solve',
        label: 'Review findings and prepare briefing',
        icon: 'shield-check',
        isLeadAction: true,
      },
    ],
  },
];
