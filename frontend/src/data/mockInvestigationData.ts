export type EntityCategory = 'Person' | 'Location' | 'Device' | 'Handle' | 'Camera' | 'Vehicle' | 'Evidence';
export type EntitySemantic = 'victim' | 'prime_suspect' | 'suspect' | 'neutral';
export type EdgeSemantic = 'forensic' | 'circumstantial' | 'contradiction';

export interface GraphNodeData {
  id: string;
  name: string;
  category: EntityCategory;
  semantic: EntitySemantic;
  confidence?: number;
  roleSubtitle: string;
  x: number;
  y: number;
  inspector: {
    entityType: string;
    nameId: string;
    confidence: string;
    knownRelationships: string[];
    evidence: string[];
    timeline: Array<{ timestamp: string; event: string }>;
  };
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  semantic: EdgeSemantic;
  label: string;
}

export interface AiLogEntry {
  timestamp: string;
  label: string;
  text: string;
}

export interface CaseInvestigationData {
  caseId: string;
  title: string;
  status: 'ACTIVE' | 'COMPLETE';
  evidenceCount: number;
  confidence: number;
  objective: string;
  latestFinding: string;
  nextLead: string;
  logs: AiLogEntry[];
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  resolution: {
    finalConclusion: string;
    primeSuspect: {
      name: string;
      role: string;
      confidence: number;
    };
    keyEvidence: string[];
    keyContradictions: string[];
  };
}

export const MOCK_INVESTIGATION_CASE: CaseInvestigationData = {
  caseId: 'CASE-001',
  title: 'The Open & Shut',
  status: 'ACTIVE',
  evidenceCount: 7,
  confidence: 78,
  objective: 'Identify the connection between the vehicle and the suspect.',
  latestFinding: 'Vehicle activity was recorded across two independent CCTV zones.',
  nextLead: 'Cross-reference telecom activity.',
  logs: [
    {
      timestamp: '14:03:17',
      label: 'CCTV SEARCH',
      text: 'Vehicle identified at Pier 14 North Gate'
    },
    {
      timestamp: '14:03:21',
      label: 'ANPR PIVOT',
      text: 'Plate 49-X-204 linked to registered sedan'
    },
    {
      timestamp: '14:03:27',
      label: 'IDENTITY PIVOT',
      text: 'Digital handle @vortex_0x discovered in telemetry burst'
    },
    {
      timestamp: '14:04:02',
      label: 'FORENSIC AUDIT',
      text: 'Sector 4 valve override initiated via Terminal 04'
    },
    {
      timestamp: '14:04:19',
      label: 'TELECOM PIVOT',
      text: 'Correlated cellular handshake logged 12 mins prior to override'
    },
    {
      timestamp: '14:04:55',
      label: 'ALIBI COLLISION',
      text: 'Punch-clock claim contradicted by optical entry record'
    }
  ],
  nodes: [
    {
      id: 'marcus_vance',
      name: 'Marcus Vance',
      category: 'Person',
      semantic: 'victim',
      confidence: 95,
      roleSubtitle: 'Executive VP, Vance Logistics',
      x: 320,
      y: 200,
      inspector: {
        entityType: 'PERSON // VICTIM',
        nameId: 'Marcus Vance (ID: ASH-VIC-902)',
        confidence: '95%',
        knownRelationships: [
          'Elena Rostova (Reporting Manager)',
          'Julian Cross (Contracting Client)',
          'Pier 14 Terminal (Operational Facility)'
        ],
        evidence: [
          'Physical device recovered at Pier 14 access stairs',
          'Biometric log confirmation at 01:45:00',
          'Coroner toxicological report: sedative compound detected'
        ],
        timeline: [
          { timestamp: '01:30:12', event: 'Departed Sector 2 Vance residence' },
          { timestamp: '01:45:00', event: 'Keycard access registered at Pier 14 Terminal' },
          { timestamp: '02:02:18', event: 'Unscheduled manual override alert issued' }
        ]
      }
    },
    {
      id: 'elena_rostova',
      name: 'Elena Rostova',
      category: 'Person',
      semantic: 'prime_suspect',
      confidence: 92,
      roleSubtitle: 'Senior Ops Dispatcher',
      x: 580,
      y: 190,
      inspector: {
        entityType: 'PERSON // PRIME SUSPECT',
        nameId: 'Elena Rostova (ID: ASH-DSP-411)',
        confidence: '92%',
        knownRelationships: [
          'Marcus Vance (Immediate Supervisor)',
          'Tariq Mercer (Frequent Off-Record Contact)',
          'Audi RS6 49-X-204 (Registered Owner)'
        ],
        evidence: [
          'DMV Title confirms sole ownership of Audi RS6',
          'Optical ANPR CCTV match at Pier 14 Gate at 02:14:09',
          'Terminal 04 cryptographic keycard token used during breach'
        ],
        timeline: [
          { timestamp: '01:15:00', event: 'Signed out of central administrative dispatch' },
          { timestamp: '02:01:45', event: 'Inbound cellular call from Tariq Mercer (-12m)' },
          { timestamp: '02:14:09', event: 'Vehicle photographed crossing Pier 14 perimeter' },
          { timestamp: '02:22:30', event: 'Terminal 04 administrative override token logged' }
        ]
      }
    },
    {
      id: 'julian_cross',
      name: 'Julian Cross',
      category: 'Person',
      semantic: 'suspect',
      confidence: 64,
      roleSubtitle: 'Contract Systems Engineer',
      x: 180,
      y: 400,
      inspector: {
        entityType: 'PERSON // SUSPECT',
        nameId: 'Julian Cross (ID: ASH-ENG-108)',
        confidence: '64%',
        knownRelationships: [
          'Marcus Vance (System Contractor)',
          'Pier 14 Terminal (Maintenance Access)',
          '@vortex_0x (Potential Key Exchange Peer)'
        ],
        evidence: [
          'Cellular tower Sector 4 sector azimuth pinged handset at 02:08',
          'Git commit history for pump firmware submitted from unauthorized IP',
          'Signed maintenance pass for Pier 14 bypass valve'
        ],
        timeline: [
          { timestamp: '00:45:00', event: 'Remote SSH session opened to municipal test bench' },
          { timestamp: '02:08:14', event: 'Tower handoff recorded on Pier 14 perimeter' }
        ]
      }
    },
    {
      id: 'tariq_mercer',
      name: 'Tariq Mercer',
      category: 'Person',
      semantic: 'suspect',
      confidence: 51,
      roleSubtitle: 'Freight Broker',
      x: 820,
      y: 190,
      inspector: {
        entityType: 'PERSON // SUSPECT',
        nameId: 'Tariq Mercer (ID: ASH-BRK-552)',
        confidence: '51%',
        knownRelationships: [
          'Elena Rostova (Commercial Associate)',
          'Pier 14 Terminal (Cargo Routing Access)'
        ],
        evidence: [
          'Encrypted voice packet burst to Rostova burner handset',
          'Bank routing record showing escrow payment from offshore shell'
        ],
        timeline: [
          { timestamp: '01:50:00', event: 'Signal established via secondary SIM' },
          { timestamp: '02:01:45', event: 'Outbound call to Elena Rostova' }
        ]
      }
    },
    {
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
          'CCTV-P14-NORTH (Primary Perimeter Optical)',
          'Marcus Vance (Last Known Presence)',
          'Elena Rostova (Terminal Override Point)'
        ],
        evidence: [
          'Pumping station valve manifold physical override lever engaged',
          'Physical scuff marks matching commercial boot sole at North Door'
        ],
        timeline: [
          { timestamp: '01:45:00', event: 'Marcus Vance check-in' },
          { timestamp: '02:14:09', event: 'Perimeter breach by Audi RS6' },
          { timestamp: '02:22:30', event: 'Sector 4 municipal water distribution zeroed' }
        ]
      }
    },
    {
      id: 'vance_residence',
      name: 'Vance Residence',
      category: 'Location',
      semantic: 'neutral',
      confidence: 99,
      roleSubtitle: 'Sector 2 Residential',
      x: 140,
      y: 180,
      inspector: {
        entityType: 'LOCATION // RESIDENCE',
        nameId: 'Vance Residence (Sector 2)',
        confidence: '99%',
        knownRelationships: [
          'Marcus Vance (Domicile)'
        ],
        evidence: [
          'Home smart-meter indicated departure at 01:30:12',
          'Garage roll-up sensor verified departure'
        ],
        timeline: [
          { timestamp: '01:30:12', event: 'Departure verified' }
        ]
      }
    },
    {
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
        nameId: 'Google Pixel 8 (Titan M2 Enclave)',
        confidence: '94%',
        knownRelationships: [
          'Marcus Vance (Registered Device Owner)'
        ],
        evidence: [
          'Physical extraction unlocked with court-order bypass',
          'Unsent draft message referencing blackmail from dispatch'
        ],
        timeline: [
          { timestamp: '01:44:22', event: 'Bluetooth tethering to terminal gate lost' }
        ]
      }
    },
    {
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
        nameId: 'CCTV-P14-NORTH (Municipal Grid)',
        confidence: '99%',
        knownRelationships: [
          'Pier 14 Terminal (Installed Sector)',
          'Audi RS6 (Captured Entity)'
        ],
        evidence: [
          'Frame 4492: Clear front bumper plate 49-X-204 captured',
          'Infrared sensor shows lone occupant in driver seat'
        ],
        timeline: [
          { timestamp: '02:14:09', event: 'Motion trigger and license plate recognition logged' }
        ]
      }
    },
    {
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
          'Elena Rostova (Title Holder)',
          'CCTV-P14-NORTH (Optical ANPR Sighting)'
        ],
        evidence: [
          'Vehicle registered to Elena Rostova private address',
          'Tire tread mold casts at Pier 14 North Gate match Pirelli P-Zero dimensions'
        ],
        timeline: [
          { timestamp: '02:14:09', event: 'Photographed passing Pier 14 North Gate' },
          { timestamp: '02:31:40', event: 'Photographed outbound on Eastern Expressway' }
        ]
      }
    },
    {
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
          'Elena Rostova (Correlated Cipher Peer)',
          'Julian Cross (Public Key Exchange)'
        ],
        evidence: [
          'Telegram session token seized from Pier 14 staging node',
          'Timestamp correlation with telemetry override payload distribution'
        ],
        timeline: [
          { timestamp: '02:18:11', event: 'Sent encrypted SHA-256 payload to dispatch router' }
        ]
      }
    }
  ],
  edges: [
    {
      id: 'e1',
      source: 'pixel_device',
      target: 'marcus_vance',
      semantic: 'forensic',
      label: 'Forensic Hardware Extraction'
    },
    {
      id: 'e2',
      source: 'vance_residence',
      target: 'marcus_vance',
      semantic: 'forensic',
      label: 'Domicile Departure Log'
    },
    {
      id: 'e3',
      source: 'marcus_vance',
      target: 'pier_14',
      semantic: 'forensic',
      label: 'Physical Keycard Entry'
    },
    {
      id: 'e4',
      source: 'elena_rostova',
      target: 'pier_14',
      semantic: 'forensic',
      label: 'Terminal 04 Override Token'
    },
    {
      id: 'e5',
      source: 'cctv_p14',
      target: 'audi_rs6',
      semantic: 'forensic',
      label: 'Optical ANPR Recognition'
    },
    {
      id: 'e6',
      source: 'audi_rs6',
      target: 'elena_rostova',
      semantic: 'forensic',
      label: 'DMV Title Registration'
    },
    {
      id: 'e7',
      source: 'cctv_p14',
      target: 'pier_14',
      semantic: 'forensic',
      label: 'Physical Perimeter Camera'
    },
    {
      id: 'e8',
      source: 'julian_cross',
      target: 'pier_14',
      semantic: 'circumstantial',
      label: 'Cell Tower Proximity Ping'
    },
    {
      id: 'e9',
      source: 'tariq_mercer',
      target: 'elena_rostova',
      semantic: 'circumstantial',
      label: 'Outbound Call (-12m)'
    },
    {
      id: 'e10',
      source: 'elena_rostova',
      target: 'vortex_handle',
      semantic: 'circumstantial',
      label: 'Correlated SIM Fingerprint'
    },
    {
      id: 'e11',
      source: 'elena_rostova',
      target: 'cctv_p14',
      semantic: 'contradiction',
      label: 'Alibi Log vs Optical Gate Timestamp'
    }
  ],
  resolution: {
    finalConclusion: 'Optical license plate correlation and forensic device extraction confirm unauthorized sector access orchestrated by Elena Rostova. The claimed punch-clock alibi was conclusively disproven by CCTV-P14-NORTH optical timestamps.',
    primeSuspect: {
      name: 'Elena Rostova',
      role: 'Senior Ops Dispatcher',
      confidence: 92
    },
    keyEvidence: [
      'Optical ANPR match at Pier 14 North Gate at 02:14:09 identifying Audi RS6',
      'Keycard override credentials traced directly to terminal workstation 04',
      'Encrypted telemetry burst exchanged with handle @vortex_0x during override sequence',
      'Physical DMV Title registration matching vehicle directly to suspect address'
    ],
    keyContradictions: [
      'Off-duty timesheet alibi conflicts with optical gate logs by 47 minutes',
      'Alleged transit pass use debunked by GPS proximity logs at central interchange'
    ]
  }
};

export interface MockEvidencePickerItem {
  id: string;
  name: string;
  meta: string;
  typeLabel: 'Video' | 'Image' | 'Doc' | 'Data';
  iconType: 'video' | 'image' | 'doc' | 'data' | 'vehicle';
  node: GraphNodeData;
  edge: GraphEdgeData;
}

export const MOCK_EVIDENCE_PICKER_ITEMS: MockEvidencePickerItem[] = [
  {
    id: 'ev-cctv-04',
    name: 'CCTV-04-23h14.mp4',
    meta: 'Video · 24.8 MB',
    typeLabel: 'Video',
    iconType: 'video',
    node: {
      id: 'cctv_04_gate',
      name: 'CCTV-04 Pier Gate',
      category: 'Camera',
      semantic: 'neutral',
      confidence: 91,
      roleSubtitle: 'Perimeter Video Clip',
      x: 430,
      y: 480,
      inspector: {
        entityType: 'CAMERA // SENSOR CLIP',
        nameId: 'CCTV-04-23h14.mp4 (Gate Cam)',
        confidence: '91%',
        knownRelationships: ['Pier 14 Terminal (Perimeter Gate)', 'Audi RS6 (49-X-204)'],
        evidence: [
          'Optical trigger recorded vehicle heading south towards terminal dock',
          'Driver silhouette matches height profile 178cm'
        ],
        timeline: [
          { timestamp: '23:14:02', event: 'Optical motion trigger registered at gate' }
        ]
      }
    },
    edge: {
      id: 'e_ev_cctv_04',
      source: 'cctv_04_gate',
      target: 'pier_14',
      semantic: 'forensic',
      label: 'Perimeter Optical Gate Capture'
    }
  },
  {
    id: 'ev-latent-print',
    name: 'Latent print scan 12A.jpg',
    meta: 'Image · 3.1 MB',
    typeLabel: 'Image',
    iconType: 'image',
    node: {
      id: 'latent_print_12a',
      name: 'Latent Print 12A',
      category: 'Evidence',
      semantic: 'neutral',
      confidence: 86,
      roleSubtitle: 'Physical Forensic Lift',
      x: 540,
      y: 70,
      inspector: {
        entityType: 'EVIDENCE // BIOMETRIC LIFT',
        nameId: 'Latent Print Scan 12A (Terminal 04 Console)',
        confidence: '86%',
        knownRelationships: ['Elena Rostova (92% Minutiae Match)', 'Pier 14 Terminal (Substrate)'],
        evidence: [
          '12-point ridge bifurcation match to suspect right thumb',
          'Cyanoacrylate fuming recovery verified on mechanical override switch'
        ],
        timeline: [
          { timestamp: '02:22:30', event: 'Contact deposit estimated during override execution' }
        ]
      }
    },
    edge: {
      id: 'e_ev_latent_12a',
      source: 'latent_print_12a',
      target: 'elena_rostova',
      semantic: 'forensic',
      label: 'Biometric Ridge Match'
    }
  },
  {
    id: 'ev-bank-stmt',
    name: 'Bank statement Q3.pdf',
    meta: 'Doc · 340 KB',
    typeLabel: 'Doc',
    iconType: 'doc',
    node: {
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
        knownRelationships: ['Elena Rostova (Beneficiary Account)', 'Marcus Vance (Debtor Account)'],
        evidence: [
          'Transfer reference TX-99201 settled 48 hours prior to intrusion',
          '$180,000 disbursement under shell consulting invoice'
        ],
        timeline: [
          { timestamp: '23:40:00', event: 'Ledger settlement confirmed via correspondent banking' }
        ]
      }
    },
    edge: {
      id: 'e_ev_bank_q3',
      source: 'bank_stmt_q3',
      target: 'elena_rostova',
      semantic: 'forensic',
      label: 'Financial Wire Trace'
    }
  },
  {
    id: 'ev-tower-ping',
    name: 'Tower 1 ping log.csv',
    meta: 'Data · 88 KB',
    typeLabel: 'Data',
    iconType: 'data',
    node: {
      id: 'tower_1_ping',
      name: 'Tower 1 Ping Log',
      category: 'Device',
      semantic: 'neutral',
      confidence: 88,
      roleSubtitle: 'Cellular Azimuth Burst',
      x: 140,
      y: 520,
      inspector: {
        entityType: 'DEVICE // TELECOM LOG',
        nameId: 'Tower 1 Cellular Ping Telemetry Log',
        confidence: '88%',
        knownRelationships: ['Julian Cross (Associated IMSI Handset)'],
        evidence: [
          'Sector 4 antenna handoff recorded at 02:08:14',
          'Signal strength -74dBm indicates line-of-sight to terminal'
        ],
        timeline: [
          { timestamp: '02:08:14', event: 'Cellular handshake recorded during breach window' }
        ]
      }
    },
    edge: {
      id: 'e_ev_tower_ping',
      source: 'tower_1_ping',
      target: 'julian_cross',
      semantic: 'forensic',
      label: 'Cellular Handoff Record'
    }
  },
  {
    id: 'ev-witness-stmt',
    name: 'Witness statement 07.docx',
    meta: 'Doc · 22 KB',
    typeLabel: 'Doc',
    iconType: 'doc',
    node: {
      id: 'witness_stmt_07',
      name: 'Witness Stmt 07',
      category: 'Evidence',
      semantic: 'neutral',
      confidence: 75,
      roleSubtitle: 'Security Guard Debrief',
      x: 140,
      y: 60,
      inspector: {
        entityType: 'EVIDENCE // WITNESS RECORD',
        nameId: 'Witness Statement #07 (Guard Station 2)',
        confidence: '75%',
        knownRelationships: ['Marcus Vance (Observed Vehicle)'],
        evidence: [
          'Guard logs confirm dark station wagon entering perimeter without badge scan at 01:42',
          'Operator was unable to identify driver through tinted windshield'
        ],
        timeline: [
          { timestamp: '01:42:10', event: 'Guard verbal observation noted in logbook' }
        ]
      }
    },
    edge: {
      id: 'e_ev_witness_07',
      source: 'witness_stmt_07',
      target: 'marcus_vance',
      semantic: 'forensic',
      label: 'Corroborating Perimeter Observation'
    }
  },
  {
    id: 'ev-vehicle-reg',
    name: 'Vehicle registration.pdf',
    meta: 'Doc · 145 KB',
    typeLabel: 'Doc',
    iconType: 'vehicle',
    node: {
      id: 'vehicle_reg_doc',
      name: 'Vehicle Reg 49-X-204',
      category: 'Vehicle',
      semantic: 'neutral',
      confidence: 99,
      roleSubtitle: 'DMV Certified Title',
      x: 880,
      y: 450,
      inspector: {
        entityType: 'VEHICLE // MUNICIPAL TITLE',
        nameId: 'Ashwick DMV Title Records (49-X-204)',
        confidence: '99%',
        knownRelationships: ['Audi RS6 (49-X-204) (Registered Conveyance)', 'Elena Rostova (Sole Owner)'],
        evidence: [
          'Official DMV state registry copy matches engine VIN: WAUZZZF24PA0921',
          'Registration current, no lienholder reported'
        ],
        timeline: [
          { timestamp: '00:00:00', event: 'State DMV database record synchronized' }
        ]
      }
    },
    edge: {
      id: 'e_ev_vehicle_reg',
      source: 'vehicle_reg_doc',
      target: 'audi_rs6',
      semantic: 'forensic',
      label: 'Certified DMV Title Registration'
    }
  }
];
