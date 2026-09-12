import React from 'react';

interface Entity {
  id: string;
  name: string;
  code: string;
  category: string;
  icon: (props: { className?: string }) => React.ReactElement;
}

// Minimal, heraldic, institutional SVG emblems for Ashwick municipal bodies
const entities: Entity[] = [
  {
    id: 'aca',
    name: 'Ashwick Civil Authority',
    code: 'ACA-01',
    category: 'Municipal Governance',
    icon: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        {/* Classical Pediment with layered cornice moulding */}
        <path d="M12 2.5L2.5 6.5h19L12 2.5z" />
        <path d="M12 4.2v.01" strokeWidth="2" />
        <line x1="3.5" y1="8" x2="20.5" y2="8" strokeWidth="1.3" />
        <line x1="4.5" y1="9.2" x2="19.5" y2="9.2" strokeWidth="0.8" />
        {/* 4 Fluted Columns with Capitols and Bases */}
        <line x1="5.5" y1="9.2" x2="5.5" y2="16.5" strokeWidth="1.2" />
        <line x1="9.5" y1="9.2" x2="9.5" y2="16.5" strokeWidth="1.2" />
        <line x1="14.5" y1="9.2" x2="14.5" y2="16.5" strokeWidth="1.2" />
        <line x1="18.5" y1="9.2" x2="18.5" y2="16.5" strokeWidth="1.2" />
        {/* Central Civic Arch Portal */}
        <path d="M10.5 16.5v-3a1.5 1.5 0 0 1 3 0v3" strokeWidth="1" />
        {/* Stepped Foundation (Stylobate) */}
        <line x1="3.5" y1="16.5" x2="20.5" y2="16.5" strokeWidth="1.2" />
        <line x1="2" y1="18.2" x2="22" y2="18.2" strokeWidth="1.3" />
        <line x1="1" y1="20" x2="23" y2="20" strokeWidth="1.4" />
        {/* Small civic seal star above peak */}
        <circle cx="12" cy="1" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'amp',
    name: 'Ashwick Metropolitan Police',
    code: 'AMP-07',
    category: 'Law Enforcement',
    icon: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        {/* Heraldic Police Shield */}
        <path d="M12 2.5l7.5 3.2v6.8c0 5.2-3.8 9.2-7.5 10.3-3.7-1.1-7.5-5.1-7.5-10.3V5.7L12 2.5z" strokeWidth="1.3" />
        {/* Inner Shield Contour */}
        <path d="M12 4.6l5.6 2.4v4.8c0 3.8-2.8 6.9-5.6 7.8-2.8-.9-5.6-4-5.6-7.8V7L12 4.6z" strokeWidth="0.8" opacity="0.6" />
        {/* Official 8-Point Faceted Police Star */}
        <polygon points="12 6.5 13.3 9.7 16.5 9.7 14 11.5 14.9 14.6 12 12.8 9.1 14.6 10 11.5 7.5 9.7 10.7 9.7" strokeWidth="1.1" />
        {/* Central Badge Core */}
        <circle cx="12" cy="11.2" r="1.2" strokeWidth="1" />
        <circle cx="12" cy="11.2" r="0.4" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'acsb',
    name: 'Ashwick Cyber Security Bureau',
    code: 'CSB-12',
    category: 'Infrastructure Defense',
    icon: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        {/* Hexagonal Defense Vault Perimeter */}
        <polygon points="12 2 20.5 6.8 20.5 17.2 12 22 3.5 17.2 3.5 6.8" strokeWidth="1.3" />
        {/* Inner Concentric Circuit Hexagon */}
        <polygon points="12 4.5 18.5 8.2 18.5 15.8 12 19.5 5.5 15.8 5.5 8.2" strokeWidth="0.8" opacity="0.5" />
        {/* Cryptographic Vault Core & Keyway */}
        <rect x="9.5" y="10.5" width="5" height="4.5" rx="1" strokeWidth="1.2" />
        <path d="M10.5 10.5V8.5a1.5 1.5 0 0 1 3 0v2" strokeWidth="1.1" />
        <circle cx="12" cy="12.2" r="0.6" fill="currentColor" />
        <line x1="12" y1="12.8" x2="12" y2="13.8" strokeWidth="0.9" />
        {/* Branching Circuit Traces to Vertices */}
        <line x1="12" y1="4.5" x2="12" y2="7" strokeWidth="0.9" />
        <line x1="12" y1="15" x2="12" y2="19.5" strokeWidth="0.9" />
        <line x1="9.5" y1="12" x2="5.5" y2="12" strokeWidth="0.9" />
        <line x1="14.5" y1="12" x2="18.5" y2="12" strokeWidth="0.9" />
        <circle cx="12" cy="7" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'ata',
    name: 'Ashwick Telecommunications Authority',
    code: 'ATA-04',
    category: 'Signals & Network Mesh',
    icon: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        {/* Central Lattice Transmission Mast */}
        <path d="M12 2v20" strokeWidth="1.3" />
        {/* Lattice Truss Bracing */}
        <path d="M9 21.5l3-4.5 3 4.5" strokeWidth="1" />
        <path d="M9.8 17l2.2-3.5 2.2 3.5" strokeWidth="0.9" />
        <path d="M10.5 13.5l1.5-2.5 1.5 2.5" strokeWidth="0.8" />
        {/* Ground Base Plinth */}
        <line x1="7.5" y1="21.5" x2="16.5" y2="21.5" strokeWidth="1.4" />
        {/* Emitter Feed & Beacon */}
        <circle cx="12" cy="3" r="1.2" strokeWidth="1.2" />
        <circle cx="12" cy="3" r="0.4" fill="currentColor" />
        {/* Concentric Parabolic Wavefront Arrays */}
        <path d="M8.5 6a5 5 0 0 1 7 0" strokeWidth="1.1" />
        <path d="M6 4a8.5 8.5 0 0 1 12 0" strokeWidth="1" opacity="0.75" />
        <path d="M3.5 2a12 12 0 0 1 17 0" strokeWidth="0.9" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: 'afn',
    name: 'Ashwick Financial Network',
    code: 'AFN-09',
    category: 'Exchange & Ledger Oversight',
    icon: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer Sovereign Coin / Guilloche Border */}
        <circle cx="12" cy="12" r="9.5" strokeWidth="1.3" />
        {/* 12 Clearing Clock Ticks */}
        <path d="M12 3v1.2M12 19.8v1.2M3 12h1.2M19.8 12h1.2M5.6 5.6l.8.8M17.6 17.6l.8.8M5.6 18.4l.8-.8M17.6 6.4l.8-.8" strokeWidth="0.8" opacity="0.6" />
        {/* Nested Faceted Diamond / Reserve Vault Core */}
        <polygon points="12 5.5 18.5 12 12 18.5 5.5 12" strokeWidth="1.1" />
        {/* Inner Interlocking Ledger Square */}
        <rect x="8.5" y="8.5" width="7" height="7" rx="0.8" strokeWidth="0.9" transform="rotate(45 12 12)" opacity="0.7" />
        {/* Sovereign Bullion / Node Center */}
        <circle cx="12" cy="12" r="2.2" strokeWidth="1.1" />
        <circle cx="12" cy="12" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'adfl',
    name: 'Ashwick Digital Forensics Lab',
    code: 'DFL-02',
    category: 'Algorithmic Reconstruction',
    icon: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        {/* Analytical Precision Reticle Outer Ring */}
        <circle cx="12" cy="12" r="9.5" strokeWidth="1.3" />
        {/* Calibrated Micrometer Sub-Ring */}
        <circle cx="12" cy="12" r="7" strokeWidth="0.8" strokeDasharray="1.2 1.8" opacity="0.6" />
        {/* Cardinal & Diagonal Target Crosshairs */}
        <line x1="12" y1="1" x2="12" y2="4.5" strokeWidth="1.2" />
        <line x1="12" y1="19.5" x2="12" y2="23" strokeWidth="1.2" />
        <line x1="1" y1="12" x2="4.5" y2="12" strokeWidth="1.2" />
        <line x1="19.5" y1="12" x2="23" y2="12" strokeWidth="1.2" />
        {/* Center Biometric & Forensic Focus Ring */}
        <circle cx="12" cy="12" r="4" strokeWidth="1" />
        {/* Focal Aperture / Micro-Target */}
        <polygon points="12 9.5 14.5 12 12 14.5 9.5 12" strokeWidth="0.9" opacity="0.8" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
];

export const AshwickEntities: React.FC = () => {
  return (
    <section className="relative w-full py-20 border-t border-white/[0.06] dark:border-white/[0.06] border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header - World Building Context (NOT partners/sponsors) */}
        <div className="text-center mb-12">
          <p className="font-mono text-[11px] tracking-ultra-wide uppercase text-slate-400 dark:text-slate-400 text-slate-600 mb-2">
            SYNTHETIC INVESTIGATION JURISDICTION
          </p>
          <h2 className="font-sans font-medium text-lg text-slate-200 dark:text-slate-200 text-slate-800 tracking-tight">
            Ashwick Municipal Simulation Environment
          </h2>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-400 text-slate-600 max-w-xl mx-auto leading-relaxed">
            Forensic graph structures and evidence topologies modeled across synthetic public records, signal intercepts, and municipal infrastructures.
          </p>
        </div>

        {/* 6 Grid items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entities.map((entity) => {
            const Icon = entity.icon;
            return (
              <div
                key={entity.id}
                className="group relative p-5 rounded-lg border border-white/[0.06] dark:border-white/[0.06] border-slate-200/80 bg-white/[0.015] dark:bg-white/[0.015] bg-slate-50/50 hover:bg-white/[0.03] dark:hover:bg-white/[0.03] hover:border-white/[0.12] transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded border border-white/[0.08] dark:border-white/[0.08] border-slate-200 bg-white/[0.03] dark:bg-white/[0.03] bg-white text-slate-300 dark:text-slate-300 text-slate-700 group-hover:text-slate-100 dark:group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-[10px] tracking-wider text-slate-400 dark:text-slate-400 text-slate-600 uppercase">
                        {entity.code}
                      </span>
                      <span className="font-mono text-[9px] tracking-wider text-slate-400 dark:text-slate-400 text-slate-600 uppercase">
                        {entity.category}
                      </span>
                    </div>
                    <h3 className="font-sans text-sm font-medium text-slate-200 dark:text-slate-200 text-slate-800 truncate group-hover:text-slate-100 transition-colors">
                      {entity.name}
                    </h3>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
