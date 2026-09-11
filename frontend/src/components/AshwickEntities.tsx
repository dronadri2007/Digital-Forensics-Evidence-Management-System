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
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Classical civic pediment and balance */}
        <path d="M3 21h18M5 21V10M19 21V10M9 21V10M14 21V10M2 10l10-6 10 6" />
      </svg>
    ),
  },
  {
    id: 'amp',
    name: 'Ashwick Metropolitan Police',
    code: 'AMP-07',
    category: 'Law Enforcement',
    icon: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Clean geometric municipal enforcement star */}
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    id: 'acsb',
    name: 'Ashwick Cyber Security Bureau',
    code: 'CSB-12',
    category: 'Infrastructure Defense',
    icon: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Geometric defensive matrix */}
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    id: 'ata',
    name: 'Ashwick Telecommunications Authority',
    code: 'ATA-04',
    category: 'Signals & Network Mesh',
    icon: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Telecom transmission array */}
        <path d="M12 2a10 10 0 0 1 10 10M12 6a6 6 0 0 1 6 6M12 10a2 2 0 0 1 2 2" />
        <line x1="12" y1="12" x2="12" y2="22" />
        <path d="M8 22h8" />
      </svg>
    ),
  },
  {
    id: 'afn',
    name: 'Ashwick Financial Network',
    code: 'AFN-09',
    category: 'Exchange & Ledger Oversight',
    icon: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Hexagonal clearinghouse geometry */}
        <polygon points="12 2 21 7.5 21 16.5 12 22 3 16.5 3 7.5 12 2" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    id: 'adfl',
    name: 'Ashwick Digital Forensics Lab',
    code: 'DFL-02',
    category: 'Algorithmic Reconstruction',
    icon: ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Optical analytical focal reticle */}
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="3" x2="12" y2="7" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <line x1="3" y1="12" x2="7" y2="12" />
        <line x1="17" y1="12" x2="21" y2="12" />
        <circle cx="12" cy="12" r="2" />
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
