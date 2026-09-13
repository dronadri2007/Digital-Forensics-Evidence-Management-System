import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { AshwickBottomStrip } from '../components/AshwickBottomStrip';

interface AboutPageProps {
  onNavigate?: (path: string) => void;
  isLoading?: boolean;
}

interface DraftingAnchorProps {
  num: string;
  isDark: boolean;
  variant?: 'crosshair' | 'arc' | 'grid' | 'ticks';
}

const DraftingAnchor: React.FC<DraftingAnchorProps> = ({
  num,
  isDark,
  variant = 'crosshair',
}) => {
  return (
    <div className="w-full flex items-center justify-center p-2 select-none overflow-hidden">
      <svg
        viewBox="0 0 320 200"
        className="w-full max-w-[280px] h-auto overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Technical drafting marks contained strictly inside the 320x200 canvas */}
        <g
          stroke="currentColor"
          strokeWidth="1"
          className={isDark ? 'text-white/[0.08]' : 'text-black/[0.07]'}
        >
          {variant === 'crosshair' && (
            <>
              {/* Reticle & Crosshairs */}
              <line x1="160" y1="18" x2="160" y2="182" strokeDasharray="4 4" />
              <line x1="30" y1="100" x2="290" y2="100" strokeDasharray="4 4" />
              <circle cx="160" cy="100" r="70" />
              <circle cx="160" cy="100" r="3" />
              <line x1="90" y1="100" x2="100" y2="100" />
              <line x1="220" y1="100" x2="230" y2="100" />
              <line x1="160" y1="30" x2="160" y2="40" />
              <line x1="160" y1="160" x2="160" y2="170" />
            </>
          )}

          {variant === 'arc' && (
            <>
              {/* Drafting Arc with radius and boundary guides */}
              <path d="M60 165 A 115 115 0 0 1 245 40" />
              <line x1="50" y1="165" x2="70" y2="165" />
              <line x1="245" y1="30" x2="245" y2="50" />
              <line x1="135" y1="100" x2="145" y2="100" />
              <line x1="160" y1="75" x2="160" y2="85" />
              <circle cx="60" cy="165" r="2" />
              <circle cx="245" cy="40" r="2" />
            </>
          )}

          {variant === 'grid' && (
            <>
              {/* Technical coordinate grid fragment */}
              <line x1="45" y1="45" x2="275" y2="45" strokeDasharray="2 3" />
              <line x1="45" y1="100" x2="275" y2="100" strokeDasharray="2 3" />
              <line x1="45" y1="155" x2="275" y2="155" strokeDasharray="2 3" />
              <line x1="75" y1="25" x2="75" y2="175" strokeDasharray="2 3" />
              <line x1="160" y1="25" x2="160" y2="175" strokeDasharray="2 3" />
              <line x1="245" y1="25" x2="245" y2="175" strokeDasharray="2 3" />
              <rect x="65" y="35" width="190" height="130" stroke="currentColor" strokeWidth="0.75" />
            </>
          )}

          {variant === 'ticks' && (
            <>
              {/* Calibration datum line and ticks */}
              <line x1="35" y1="100" x2="285" y2="100" />
              <line x1="55" y1="92" x2="55" y2="108" />
              <line x1="85" y1="95" x2="85" y2="105" />
              <line x1="115" y1="94" x2="115" y2="106" />
              <line x1="160" y1="88" x2="160" y2="112" strokeWidth="1.5" />
              <line x1="205" y1="94" x2="205" y2="106" />
              <line x1="235" y1="95" x2="235" y2="105" />
              <line x1="265" y1="92" x2="265" y2="108" />
            </>
          )}
        </g>

        {/* Technical Numeral: ~125px font-size, centered inside 320x200 canvas */}
        <text
          x="160"
          y="140"
          textAnchor="middle"
          fontSize="125"
          fontWeight="bold"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          className={isDark ? 'fill-white/[0.09]' : 'fill-black/[0.08]'}
          style={{ letterSpacing: '-0.04em' }}
        >
          {num}
        </text>
      </svg>
    </div>
  );
};

export const AboutPage: React.FC<AboutPageProps> = ({ isLoading = false }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (isLoading) {
    return (
      <div
        className={`w-full min-h-[100dvh] flex flex-col items-center justify-center transition-colors duration-300 ${
          isDark ? 'bg-[#080A0C] text-[#EDEAE3]' : 'bg-[#F6F4EE] text-[#1A1C1E]'
        }`}
      >
        <div className="w-6 h-6 border-2 border-[#6B9B85] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#6B9B85]">
          LOADING DOCUMENTATION...
        </span>
      </div>
    );
  }

  const evidenceLayers = [
    { num: '01', name: 'CIVIL REGISTRY', desc: 'Municipal identity registrations, residency logs, and vital civil status records.' },
    { num: '02', name: 'CRIMINAL / BIOMETRIC RECORDS', desc: 'Fingerprint index, custody reports, and past jurisdictional filings.' },
    { num: '03', name: 'TELECOM', desc: 'Call detail records (CDR), cellular tower telemetry pings, and SIM allocations.' },
    { num: '04', name: 'CCTV', desc: 'Optical surveillance feeds, timestamped egress captures, and gate cameras.' },
    { num: '05', name: 'FINANCIAL', desc: 'Electronic transfer receipts, point-of-sale timestamps, and account ledgers.' },
    { num: '06', name: 'VEHICLE / ANPR', desc: 'Automated number plate recognition sweeps, title registries, and chassis logs.' },
    { num: '07', name: 'DIGITAL & BREACH', desc: 'Encrypted telemetry payloads, network audit trails, and workstation overrides.' },
    { num: '08', name: 'WITNESS EVIDENCE', desc: 'Recorded statements, corroborated timelines, and investigative interviews.' },
  ];

  const pipelineSteps = [
    'SYNTHETIC DATA',
    'EVIDENCE GRAPH',
    'INVESTIGATION TOOLS',
    'AI REASONING',
    'CORRELATION',
    'RESOLUTION',
  ];

  const tiers = [
    {
      tier: 'TIER 01',
      title: 'OPEN & SHUT',
      desc: 'High evidence density with direct forensic correlations. Serves as a baseline validation scenario with minimal background noise and clear corroborating records.',
    },
    {
      tier: 'TIER 02',
      title: 'CLONED PLATE',
      desc: 'Moderate evidence density characterized by identity duplication and vehicle spoofing. Introduces conflicting sensor readings that require multi-source cross-verification.',
    },
    {
      tier: 'TIER 03',
      title: 'STAGED ALIBI',
      desc: 'Low evidence density complicated by intentional adversarial deception. Features fabricated digital timestamps and coordinated accomplice alibis that generate deliberate graph contradictions.',
    },
    {
      tier: 'TIER 04',
      title: 'COLD CASE',
      desc: "Minimal evidence density with incomplete logs and degraded historical data. Tests the system's ability to correlate faint, latent signals across extensive temporal gaps.",
    },
  ];

  const controlledPillars = [
    {
      tag: 'SYNTHETIC DATA',
      detail: 'All civilian identities, records, vehicle registries, and communication logs are procedurally synthesized algorithms.',
    },
    {
      tag: 'CONTROLLED SANDBOX',
      detail: 'Investigation environments run in fully isolated virtualized containers with no external network dependencies or live telemetry ingestion.',
    },
    {
      tag: 'RESEARCH PROTOTYPE',
      detail: 'Designed strictly for academic study and algorithmic evaluation in automated reasoning, graph intelligence, and evidence governance.',
    },
  ];

  const projectStatusItems = [
    {
      label: 'AEGIS PROTOTYPE',
      detail: 'Active technical preview focusing on interactive graph reasoning, entity extraction, and multi-agent forensic verification.',
    },
    {
      label: 'SYNTHETIC ENVIRONMENT',
      detail: 'Ashwick municipal dataset v2.4 with eight interconnected evidentiary layers, 120k synthetic residents, and deterministic incident seeding.',
    },
    {
      label: 'CONTROLLED INVESTIGATION SANDBOX',
      detail: 'Self-contained browser-based demonstration sandbox with offline session persistence, zero external API tracking, and reproducible scenario test suites.',
    },
  ];

  const teamMembers = [
    {
      role: 'Lead Systems Architecture',
      member: 'Team Member 01',
      bio: 'Focus: Distributed state synchronization, sandbox virtualization, and high-throughput evidentiary pipelines.',
    },
    {
      role: 'Digital Forensics & Ontologies',
      member: 'Team Member 02',
      bio: 'Focus: Multi-modal forensic schemas, evidentiary chain-of-custody ontologies, and biometric index standards.',
    },
    {
      role: 'Synthetic Environment Simulation',
      member: 'Team Member 03',
      bio: 'Focus: Procedural municipal agent modeling, urban behavioral simulation, and temporal sensor synthesis.',
    },
    {
      role: 'Graph Intelligence & Neural Reasoning',
      member: 'Team Member 04',
      bio: 'Focus: Probabilistic entity resolution, multi-hop relation extraction, and contradiction-detection heuristics.',
    },
  ];

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-300 ${
        isDark ? 'bg-[#080A0C] text-[#EDEAE3]' : 'bg-[#F6F4EE] text-[#1A1C1E]'
      }`}
    >
      {/* 
        HALVED HORIZONTAL GUTTERS SPECIFICATION:
        Content max-width: 1080px (within ~1050-1100px target).
        At 1440px viewport: (1440 - 1080) / 2 = 180px gutters on each side (within ~170-195px target).
        Vertical spacing: ~80-100px (space-y-20 lg:space-y-24).
      */}
      <div className="w-full max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-0 pt-24 sm:pt-32 pb-20 space-y-20 lg:space-y-24">
        
        {/* SECTION 01 — ABOUT HERO (Clean introduction, no numeral, full width) */}
        <section className="w-full">
          <span
            className={`font-mono text-xs font-semibold uppercase tracking-[0.22em] block select-none ${
              isDark ? 'text-[#74AC95]' : 'text-[#1E6147]'
            }`}
          >
            ABOUT AEGIS
          </span>
          <div className={`w-12 h-[1px] my-3.5 ${isDark ? 'bg-white/15' : 'bg-black/15'}`} />
          <h1 className="font-sans font-bold text-4xl sm:text-6xl tracking-tight leading-none uppercase select-none">
            AEGIS
          </h1>
          <p
            className={`font-mono text-xs sm:text-sm uppercase tracking-[0.16em] mt-3.5 font-medium ${
              isDark ? 'text-[#EDEAE3]/65' : 'text-[#1A1C1E]/65'
            }`}
          >
            Automated Evidence Governance &amp; Intelligence System
          </p>
          <p
            className={`font-sans text-base sm:text-lg leading-relaxed mt-6 font-normal max-w-[960px] ${
              isDark ? 'text-[#EDEAE3]/85' : 'text-[#1A1C1E]/85'
            }`}
          >
            AEGIS is an AI-assisted digital forensics and investigation sandbox designed
            to explore how intelligent systems investigate interconnected evidence inside
            a controlled synthetic environment.
          </p>
        </section>

        {/* SECTION 02 — THE PROBLEM (Text LEFT 58%, Visual Anchor 02 RIGHT 42%) */}
        <section className="grid grid-cols-1 min-[1000px]:grid-cols-12 gap-10 min-[1000px]:gap-14 lg:gap-16 items-center">
          <div className="min-[1000px]:col-span-7">
            <span
              className={`font-mono text-xs font-semibold uppercase tracking-[0.22em] block select-none ${
                isDark ? 'text-[#74AC95]' : 'text-[#1E6147]'
              }`}
            >
              THE PROBLEM
            </span>
            <div className={`w-12 h-[1px] my-3.5 ${isDark ? 'bg-white/15' : 'bg-black/15'}`} />
            <div
              className={`font-sans text-sm sm:text-base leading-relaxed space-y-4 ${
                isDark ? 'text-[#EDEAE3]/75' : 'text-[#1A1C1E]/75'
              }`}
            >
              <p>
                Modern investigations rarely fail from a lack of data; they fail from fragmentation.
                Critical investigative traces are scattered across siloed municipal databases, encrypted
                messaging protocols, telecommunications cell towers, financial ledgers, optical
                surveillance networks, and witness testimonies. Each system captures an isolated slice
                of reality, recorded under distinct schemas, formats, and retention horizons.
              </p>
              <p>
                The true challenge in digital forensics is not information retrieval, but cross-domain
                correlation. Establishing evidentiary links requires bridging disconnected timelines, mapping
                pseudo-anonymous identifiers to physical entities, and identifying subtle dependencies
                that no single database query can surface.
              </p>
              <p>
                Compounding this complexity is the reality of incomplete and conflicting signals. Real-world
                investigations routinely operate with missing timestamps, spoofed identifiers, deliberate
                misdirection, and contradictory alibis. Investigators must evaluate hypotheses
                probabilistically, balancing circumstantial patterns against hard forensic records without
                jumping to premature conclusions.
              </p>
            </div>
          </div>
          <div className="min-[1000px]:col-span-5 flex justify-center min-[1000px]:justify-end">
            <DraftingAnchor num="02" isDark={isDark} variant="crosshair" />
          </div>
        </section>

        {/* SECTION 03 — THE ASHWICK SANDBOX (Visual Anchor 03 LEFT 42%, Text RIGHT 58%) */}
        <section className="grid grid-cols-1 min-[1000px]:grid-cols-12 gap-10 min-[1000px]:gap-14 lg:gap-16 items-center">
          <div className="min-[1000px]:col-span-5 flex justify-center min-[1000px]:justify-start order-2 min-[1000px]:order-1">
            <DraftingAnchor num="03" isDark={isDark} variant="arc" />
          </div>
          <div className="min-[1000px]:col-span-7 order-1 min-[1000px]:order-2">
            <span
              className={`font-mono text-xs font-semibold uppercase tracking-[0.22em] block select-none ${
                isDark ? 'text-[#74AC95]' : 'text-[#1E6147]'
              }`}
            >
              THE ASHWICK SANDBOX
            </span>
            <div className={`w-12 h-[1px] my-3.5 ${isDark ? 'bg-white/15' : 'bg-black/15'}`} />
            <div
              className={`font-sans text-sm sm:text-base leading-relaxed space-y-4 ${
                isDark ? 'text-[#EDEAE3]/75' : 'text-[#1A1C1E]/75'
              }`}
            >
              <p>
                Ashwick is a synthetic, procedurally coherent municipality engineered specifically for
                digital forensics research and autonomous investigation benchmarking. Developing and
                evaluating intelligent investigative systems against real-world police databases introduces
                profound privacy risks, legal constraints, and unrepeatable test conditions. Ashwick resolves
                this dilemma by providing an authentic, reproducible digital twin that simulates an entire
                municipality without utilizing real-world personal data.
              </p>
              <p>
                The sandbox models a municipality of approximately 120,000 synthetic residents, complete
                with interconnected civil registries, cellular tower coverage maps, automated license plate
                cameras, banking payment rails, and forensic biometric archives. Every incident in Ashwick
                unfolds across a synchronized multi-week temporal window, embedding true evidentiary chains
                alongside routine civilian noise, parallel daily activity, and realistic forensic anomalies.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 04 — THE EVIDENCE ENVIRONMENT (Inline Prefix 04 ·, List on Right) */}
        <section className="grid grid-cols-1 min-[1000px]:grid-cols-12 gap-10 min-[1000px]:gap-14 lg:gap-16 items-start">
          <div className="min-[1000px]:col-span-5">
            <span
              className={`font-mono text-xs font-semibold uppercase tracking-[0.22em] block select-none ${
                isDark ? 'text-[#74AC95]' : 'text-[#1E6147]'
              }`}
            >
              04 · THE EVIDENCE ENVIRONMENT
            </span>
            <div className={`w-12 h-[1px] my-3.5 ${isDark ? 'bg-white/15' : 'bg-black/15'}`} />
            <p
              className={`font-sans text-sm leading-relaxed mb-4 ${
                isDark ? 'text-[#EDEAE3]/75' : 'text-[#1A1C1E]/75'
              }`}
            >
              The Ashwick simulation operates across eight synchronized evidence layers, mirroring
              the data environments available to modern criminal intelligence units.
            </p>
            <p
              className={`font-sans text-xs leading-relaxed font-mono opacity-60 ${
                isDark ? 'text-[#EDEAE3]' : 'text-[#1A1C1E]'
              }`}
            >
              These eight layers are continuously cross-indexed through shared spatial coordinates,
              temporal timestamps, and cryptographic entity identifiers.
            </p>
          </div>

          <div className="min-[1000px]:col-span-7 divide-y divide-white/[0.06] dark:divide-white/[0.06] divide-black/[0.06]">
            {evidenceLayers.map((layer) => (
              <div key={layer.num} className="py-3.5 flex items-baseline gap-4 select-none">
                <span className="font-mono text-xs opacity-40 shrink-0 select-none">
                  {layer.num}
                </span>
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between w-full gap-1 sm:gap-4">
                  <span className="font-mono text-xs font-semibold tracking-wider uppercase shrink-0">
                    {layer.name}
                  </span>
                  <span
                    className={`font-sans text-xs leading-normal sm:text-right ${
                      isDark ? 'text-[#EDEAE3]/55' : 'text-[#1A1C1E]/60'
                    }`}
                  >
                    {layer.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 05 — THE AI INVESTIGATOR (Visual Anchor 05 LEFT 42%, Text RIGHT 58%) */}
        <section className="grid grid-cols-1 min-[1000px]:grid-cols-12 gap-10 min-[1000px]:gap-14 lg:gap-16 items-center">
          <div className="min-[1000px]:col-span-5 flex justify-center min-[1000px]:justify-start order-2 min-[1000px]:order-1">
            <DraftingAnchor num="05" isDark={isDark} variant="grid" />
          </div>
          <div className="min-[1000px]:col-span-7 order-1 min-[1000px]:order-2">
            <span
              className={`font-mono text-xs font-semibold uppercase tracking-[0.22em] block select-none ${
                isDark ? 'text-[#74AC95]' : 'text-[#1E6147]'
              }`}
            >
              THE AI INVESTIGATOR
            </span>
            <div className={`w-12 h-[1px] my-3.5 ${isDark ? 'bg-white/15' : 'bg-black/15'}`} />
            <div
              className={`font-sans text-sm sm:text-base leading-relaxed space-y-4 ${
                isDark ? 'text-[#EDEAE3]/75' : 'text-[#1A1C1E]/75'
              }`}
            >
              <p>
                AEGIS is fundamentally not a conversational chatbot. Rather than generating plausible
                prose from generic prompts, AEGIS operates as an autonomous investigative reasoning engine
                designed to execute structured forensic workflows, formulate and test hypotheses, and
                maintain rigorous chain-of-custody tracking across evidentiary leads.
              </p>
              <p>
                The engine interfaces directly with specialized investigative tools — querying cell tower
                logs, dispatching warrant requests to financial rails, and inspecting surveillance footage.
                As discoveries are made, AEGIS dynamically constructs and mutates an internal evidence graph,
                pivoting between entities (such as linking a burner phone IMSI to an automated vehicle
                registration) to uncover non-obvious relationship paths.
              </p>
              <p>
                Throughout an inquiry, AEGIS performs continuous contradiction detection, flagging
                irreconcilable alibi claims, physical impossibilities, and temporal conflicts. Rather than
                forcing binary determinations, the system maintains probabilistic confidence distributions
                across potential suspect paths, explicitly surfacing investigative blind spots and
                recommending high-leverage pivots to resolve ambiguity.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 06 — THE EVIDENCE GRAPH (Inline Prefix 06 ·, Mini Graph on Right) */}
        <section className="grid grid-cols-1 min-[1000px]:grid-cols-12 gap-10 min-[1000px]:gap-14 lg:gap-16 items-center">
          <div className="min-[1000px]:col-span-7">
            <span
              className={`font-mono text-xs font-semibold uppercase tracking-[0.22em] block select-none ${
                isDark ? 'text-[#74AC95]' : 'text-[#1E6147]'
              }`}
            >
              06 · THE EVIDENCE GRAPH
            </span>
            <div className={`w-12 h-[1px] my-3.5 ${isDark ? 'bg-white/15' : 'bg-black/15'}`} />
            <div
              className={`font-sans text-sm sm:text-base leading-relaxed space-y-4 ${
                isDark ? 'text-[#EDEAE3]/75' : 'text-[#1A1C1E]/75'
              }`}
            >
              <p>
                At the core of the AEGIS architecture is the interactive evidence graph, where disparate
                investigative artifacts are unified into a cohesive semantic network. Graph nodes represent
                real-world entities — persons of interest, cellular devices, vehicle registrations, physical
                geolocations, and validated alibi records — each maintaining a dynamic confidence score updated
                as corroborating data is ingested.
              </p>
              <p>
                Edges between nodes represent established relationships governed by strict forensic
                semantics. Solid blue edges denote hard forensic links backed by immutable cryptographic or
                physical evidence; dotted amber edges signify circumstantial correlations requiring further
                corroboration; and solid red edges highlight active contradictions that undermine suspect
                testimony or conflicting timelines.
              </p>
            </div>
          </div>

          <div className="min-[1000px]:col-span-5 flex justify-center min-[1000px]:justify-end">
            <div
              className={`p-6 rounded-lg border w-full max-w-[380px] select-none ${
                isDark
                  ? 'bg-[#0E131A]/70 border-white/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.3)]'
                  : 'bg-white border-black/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.04)]'
              }`}
            >
              <svg
                viewBox="0 0 340 170"
                className="w-full h-auto"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Edge 1: Forensic (Solid Blue) Person -> Device */}
                <line
                  x1="60"
                  y1="45"
                  x2="170"
                  y2="45"
                  stroke="#5E89A8"
                  strokeWidth="1.75"
                />

                {/* Edge 2: Circumstantial (Dotted Amber) Device -> Vehicle */}
                <line
                  x1="170"
                  y1="45"
                  x2="280"
                  y2="45"
                  stroke="#C49B58"
                  strokeWidth="1.75"
                  strokeDasharray="4 4"
                />

                {/* Edge 3: Forensic (Solid Blue) Person -> Location */}
                <line
                  x1="60"
                  y1="45"
                  x2="115"
                  y2="115"
                  stroke="#5E89A8"
                  strokeWidth="1.75"
                />

                {/* Edge 4: Contradiction (Red Line) Location -> Alibi */}
                <line
                  x1="115"
                  y1="115"
                  x2="225"
                  y2="115"
                  stroke="#C85A5A"
                  strokeWidth="1.75"
                />

                {/* 5 Nodes */}
                {/* Node 1: Person */}
                <g transform="translate(60, 45)">
                  <circle
                    r="6"
                    fill={isDark ? '#161C24' : '#E8E5DF'}
                    stroke={isDark ? '#EDEAE3' : '#1A1C1E'}
                    strokeWidth="1.5"
                  />
                  <text
                    y="-12"
                    textAnchor="middle"
                    className={`font-mono text-[9px] uppercase tracking-wider ${
                      isDark ? 'fill-[#EDEAE3]/80' : 'fill-[#1A1C1E]/80'
                    }`}
                  >
                    PERSON
                  </text>
                </g>

                {/* Node 2: Device */}
                <g transform="translate(170, 45)">
                  <circle
                    r="6"
                    fill={isDark ? '#161C24' : '#E8E5DF'}
                    stroke={isDark ? '#EDEAE3' : '#1A1C1E'}
                    strokeWidth="1.5"
                  />
                  <text
                    y="-12"
                    textAnchor="middle"
                    className={`font-mono text-[9px] uppercase tracking-wider ${
                      isDark ? 'fill-[#EDEAE3]/80' : 'fill-[#1A1C1E]/80'
                    }`}
                  >
                    DEVICE
                  </text>
                </g>

                {/* Node 3: Vehicle */}
                <g transform="translate(280, 45)">
                  <circle
                    r="6"
                    fill={isDark ? '#161C24' : '#E8E5DF'}
                    stroke={isDark ? '#EDEAE3' : '#1A1C1E'}
                    strokeWidth="1.5"
                  />
                  <text
                    y="-12"
                    textAnchor="middle"
                    className={`font-mono text-[9px] uppercase tracking-wider ${
                      isDark ? 'fill-[#EDEAE3]/80' : 'fill-[#1A1C1E]/80'
                    }`}
                  >
                    VEHICLE
                  </text>
                </g>

                {/* Node 4: Location */}
                <g transform="translate(115, 115)">
                  <circle
                    r="6"
                    fill={isDark ? '#161C24' : '#E8E5DF'}
                    stroke={isDark ? '#EDEAE3' : '#1A1C1E'}
                    strokeWidth="1.5"
                  />
                  <text
                    y="18"
                    textAnchor="middle"
                    className={`font-mono text-[9px] uppercase tracking-wider ${
                      isDark ? 'fill-[#EDEAE3]/80' : 'fill-[#1A1C1E]/80'
                    }`}
                  >
                    LOCATION
                  </text>
                </g>

                {/* Node 5: Alibi/Record */}
                <g transform="translate(225, 115)">
                  <circle
                    r="6"
                    fill={isDark ? '#161C24' : '#E8E5DF'}
                    stroke={isDark ? '#EDEAE3' : '#1A1C1E'}
                    strokeWidth="1.5"
                  />
                  <text
                    y="18"
                    textAnchor="middle"
                    className={`font-mono text-[9px] uppercase tracking-wider ${
                      isDark ? 'fill-[#EDEAE3]/80' : 'fill-[#1A1C1E]/80'
                    }`}
                  >
                    ALIBI RECORD
                  </text>
                </g>
              </svg>

              {/* Edge legend */}
              <div
                className={`mt-4 pt-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[10px] ${
                  isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-[2px] bg-[#5E89A8] shrink-0" />
                  <span className="font-mono text-[9px] uppercase tracking-wider opacity-60">
                    Forensic Evidence
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-[2px] border-b border-dotted border-[#C49B58] shrink-0" />
                  <span className="font-mono text-[9px] uppercase tracking-wider opacity-60">
                    Circumstantial Evidence
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-[2px] bg-[#C85A5A] shrink-0" />
                  <span className="font-mono text-[9px] uppercase tracking-wider opacity-60">
                    Contradiction
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 07 — THE ZERO-EVIDENCE CHALLENGE (Visual Anchor 07 LEFT 42%, Text RIGHT 58%) */}
        <section className="grid grid-cols-1 min-[1000px]:grid-cols-12 gap-10 min-[1000px]:gap-14 lg:gap-16 items-center">
          <div className="min-[1000px]:col-span-5 flex justify-center min-[1000px]:justify-start order-2 min-[1000px]:order-1">
            <DraftingAnchor num="07" isDark={isDark} variant="ticks" />
          </div>
          <div className="min-[1000px]:col-span-7 order-1 min-[1000px]:order-2">
            <span
              className={`font-mono text-xs font-semibold uppercase tracking-[0.22em] block select-none ${
                isDark ? 'text-[#74AC95]' : 'text-[#1E6147]'
              }`}
            >
              THE ZERO-EVIDENCE CHALLENGE
            </span>
            <div className={`w-12 h-[1px] my-3.5 ${isDark ? 'bg-white/15' : 'bg-black/15'}`} />
            <div
              className={`font-sans text-sm sm:text-base leading-relaxed space-y-4 ${
                isDark ? 'text-[#EDEAE3]/75' : 'text-[#1A1C1E]/75'
              }`}
            >
              <p>
                In forensic intelligence, a &ldquo;zero-evidence&rdquo; scenario does not denote the complete
                absence of data, but rather the absence of explicit, direct leads pointing to a suspect.
                Traditional rule-based search techniques fail entirely when there are no registered license
                plates at the scene, no matching biometric records, and no direct witness identifications.
              </p>
              <p>
                AEGIS addresses these cold-start scenarios by applying spatio-temporal co-presence analysis
                and behavioral anomaly detection across ambient sensor arrays. By isolating device handoffs,
                egress route intersections, and atypical transactional activity within the incident window,
                the engine narrows millions of candidate interactions down to a tractable set of
                high-probability investigation targets.
              </p>
              <p>
                The primary research objective of the Zero-Evidence Challenge is to render the investigative
                process transparent and verifiable. Rather than presenting black-box conclusions, AEGIS
                exposes its deductive trajectory step-by-step, allowing human supervisors to inspect the
                evidentiary foundations of every deduction, verify graph traversals, and audit automated
                findings with complete accountability.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 08 — THE INVESTIGATION PIPELINE (Inline Prefix 08 ·, Full-width) */}
        <section className="w-full pt-2">
          <span
            className={`font-mono text-xs font-semibold uppercase tracking-[0.22em] block select-none ${
              isDark ? 'text-[#74AC95]' : 'text-[#1E6147]'
            }`}
          >
            08 · THE INVESTIGATION PIPELINE
          </span>
          <div className={`w-12 h-[1px] my-3.5 ${isDark ? 'bg-white/15' : 'bg-black/15'}`} />
          <p
            className={`font-sans text-sm leading-relaxed max-w-[960px] mb-6 ${
              isDark ? 'text-[#EDEAE3]/75' : 'text-[#1A1C1E]/75'
            }`}
          >
            The AEGIS investigation pipeline defines the systematic lifecycle of an inquiry, transforming
            raw municipal data streams into actionable forensic conclusions through progressive layers
            of extraction, correlation, and multi-agent reasoning.
          </p>
          
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 select-none">
            {pipelineSteps.map((step, idx) => (
              <React.Fragment key={step}>
                <div
                  className={`px-4 py-2.5 rounded border ${
                    isDark
                      ? 'border-white/[0.08] bg-[#0D1117] text-[#EDEAE3]'
                      : 'border-black/[0.08] bg-white text-[#1A1C1E] shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
                  }`}
                >
                  <span className="font-mono text-xs uppercase tracking-wider font-medium">
                    {step}
                  </span>
                </div>
                {idx < pipelineSteps.length - 1 && (
                  <span className="font-mono text-xs opacity-30 select-none hidden sm:inline">
                    →
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* SECTION 09 — INVESTIGATION TIERS (Inline Prefix 09 ·, Tier List RIGHT) */}
        <section className="grid grid-cols-1 min-[1000px]:grid-cols-12 gap-10 min-[1000px]:gap-14 lg:gap-16 items-start pt-2">
          <div className="min-[1000px]:col-span-5">
            <span
              className={`font-mono text-xs font-semibold uppercase tracking-[0.22em] block select-none ${
                isDark ? 'text-[#74AC95]' : 'text-[#1E6147]'
              }`}
            >
              09 · INVESTIGATION TIERS
            </span>
            <div className={`w-12 h-[1px] my-3.5 ${isDark ? 'bg-white/15' : 'bg-black/15'}`} />
            <p
              className={`font-sans text-sm leading-relaxed ${
                isDark ? 'text-[#EDEAE3]/75' : 'text-[#1A1C1E]/75'
              }`}
            >
              The Ashwick benchmark comprises four standardized scenario tiers alongside a synthetic
              wildcard engine, calibrated to evaluate investigative performance across progressive levels
              of evidentiary ambiguity, noise, and deception.
            </p>

            <div
              className={`mt-6 p-4 rounded border ${
                isDark
                  ? 'border-white/[0.08] bg-[#0D1117]/60'
                  : 'border-black/[0.08] bg-black/[0.02]'
              }`}
            >
              <div className="font-mono text-xs font-semibold tracking-wider uppercase mb-1.5">
                WILDCARD · GENERATE FRESH INCIDENT
              </div>
              <p
                className={`font-sans text-xs leading-relaxed ${
                  isDark ? 'text-[#EDEAE3]/65' : 'text-[#1A1C1E]/65'
                }`}
              >
                A procedural scenario generator that synthesizes novel crimes, motives, and evidence
                topologies on demand. Ensures intelligent systems are evaluated against unmemorized
                test distributions rather than static benchmarks.
              </p>
            </div>
          </div>

          <div className="min-[1000px]:col-span-7 divide-y divide-white/[0.06] dark:divide-white/[0.06] divide-black/[0.06]">
            {tiers.map((t) => (
              <div key={t.tier} className="py-4 select-none">
                <div className="flex items-center justify-between gap-4 mb-1.5">
                  <span className="font-mono text-xs opacity-50 tracking-wider">
                    {t.tier}
                  </span>
                  <span className="font-mono text-xs font-semibold tracking-wider uppercase">
                    {t.title}
                  </span>
                </div>
                <p
                  className={`font-sans text-xs leading-relaxed ${
                    isDark ? 'text-[#EDEAE3]/60' : 'text-[#1A1C1E]/65'
                  }`}
                >
                  {t.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 10 — CONTROLLED / SYNTHETIC ENVIRONMENT (Inline Prefix 10 ·, Two-Column) */}
        <section className="grid grid-cols-1 min-[1000px]:grid-cols-12 gap-10 min-[1000px]:gap-14 lg:gap-16 items-start pt-2">
          <div className="min-[1000px]:col-span-5">
            <span
              className={`font-mono text-xs font-semibold uppercase tracking-[0.22em] block select-none ${
                isDark ? 'text-[#74AC95]' : 'text-[#1E6147]'
              }`}
            >
              10 · CONTROLLED / SYNTHETIC ENVIRONMENT
            </span>
            <div className={`w-12 h-[1px] my-3.5 ${isDark ? 'bg-white/15' : 'bg-black/15'}`} />
            <p
              className={`font-sans text-sm leading-relaxed mb-6 ${
                isDark ? 'text-[#EDEAE3]/75' : 'text-[#1A1C1E]/75'
              }`}
            >
              AEGIS operates exclusively within a deterministic research perimeter designed
              for ethical AI exploration and repeatable forensic evaluation.
            </p>

            <div className="flex flex-wrap gap-2.5 mb-6">
              {controlledPillars.map((p) => (
                <span
                  key={p.tag}
                  className={`px-3 py-1 rounded text-[11px] font-mono tracking-wider uppercase border select-none ${
                    isDark
                      ? 'border-white/[0.08] bg-white/[0.03] text-[#EDEAE3]/80'
                      : 'border-black/[0.08] bg-black/[0.03] text-[#1A1C1E]/80'
                  }`}
                >
                  {p.tag}
                </span>
              ))}
            </div>

            <p
              className={`font-sans text-xs leading-relaxed font-mono opacity-60 ${
                isDark ? 'text-[#EDEAE3]' : 'text-[#1A1C1E]'
              }`}
            >
              Ashwick is fully simulated. Zero real-world personal data, private records,
              or operational surveillance feeds are ingested or processed.
            </p>
          </div>

          <div className="min-[1000px]:col-span-7 space-y-4">
            {controlledPillars.map((p) => (
              <div
                key={p.tag}
                className={`p-4 rounded border ${
                  isDark
                    ? 'border-white/[0.06] bg-[#0E131A]/40'
                    : 'border-black/[0.06] bg-white'
                }`}
              >
                <div className="font-mono text-xs font-semibold tracking-wider uppercase mb-1">
                  {p.tag}
                </div>
                <p
                  className={`font-sans text-xs leading-relaxed ${
                    isDark ? 'text-[#EDEAE3]/65' : 'text-[#1A1C1E]/65'
                  }`}
                >
                  {p.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 11 — PROJECT STATUS (Inline Prefix 11 ·, Two-Column) */}
        <section className="grid grid-cols-1 min-[1000px]:grid-cols-12 gap-10 min-[1000px]:gap-14 lg:gap-16 items-start pt-2">
          <div className="min-[1000px]:col-span-5">
            <span
              className={`font-mono text-xs font-semibold uppercase tracking-[0.22em] block select-none ${
                isDark ? 'text-[#74AC95]' : 'text-[#1E6147]'
              }`}
            >
              11 · PROJECT STATUS
            </span>
            <div className={`w-12 h-[1px] my-3.5 ${isDark ? 'bg-white/15' : 'bg-black/15'}`} />
            <p
              className={`font-sans text-sm leading-relaxed ${
                isDark ? 'text-[#EDEAE3]/75' : 'text-[#1A1C1E]/75'
              }`}
            >
              Current engineering release and operational boundaries of the AEGIS
              investigation framework.
            </p>

            <div className="space-y-2 mt-6 select-none font-mono text-xs opacity-60">
              {projectStatusItems.map((item) => (
                <div key={item.label} className="tracking-wider">
                  &gt; {item.label}
                </div>
              ))}
            </div>
          </div>

          <div className="min-[1000px]:col-span-7 space-y-4">
            {projectStatusItems.map((item) => (
              <div
                key={item.label}
                className={`p-4 rounded border ${
                  isDark
                    ? 'border-white/[0.06] bg-[#0E131A]/40'
                    : 'border-black/[0.06] bg-white'
                }`}
              >
                <div className="font-mono text-xs font-semibold tracking-wider uppercase mb-1">
                  {item.label}
                </div>
                <p
                  className={`font-sans text-xs leading-relaxed ${
                    isDark ? 'text-[#EDEAE3]/65' : 'text-[#1A1C1E]/65'
                  }`}
                >
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 12 — TEAM (Closing Section, No Numeral, Full-Width Responsive 2x2 Grid) */}
        <section className="w-full pt-2">
          <span
            className={`font-mono text-xs font-semibold uppercase tracking-[0.22em] block select-none ${
              isDark ? 'text-[#74AC95]' : 'text-[#1E6147]'
            }`}
          >
            TEAM
          </span>
          <div className={`w-12 h-[1px] my-3.5 ${isDark ? 'bg-white/15' : 'bg-black/15'}`} />
          <p
            className={`font-sans text-sm leading-relaxed max-w-[960px] mb-6 ${
              isDark ? 'text-[#EDEAE3]/75' : 'text-[#1A1C1E]/75'
            }`}
          >
            The interdisciplinary researchers and systems architects behind the AEGIS automated evidence
            governance platform.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
            {teamMembers.map((t) => (
              <div
                key={t.role}
                className={`p-5 rounded border ${
                  isDark
                    ? 'border-white/[0.08] bg-[#0E131A]/40'
                    : 'border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
                }`}
              >
                <span
                  className={`font-mono text-[10px] tracking-wider uppercase block ${
                    isDark ? 'text-[#74AC95]' : 'text-[#1E6147]'
                  }`}
                >
                  {t.role}
                </span>
                <span className="font-sans font-semibold text-sm block mt-1.5">
                  {t.member}
                </span>
                <p
                  className={`font-sans text-xs leading-relaxed mt-2.5 ${
                    isDark ? 'text-[#EDEAE3]/60' : 'text-[#1A1C1E]/65'
                  }`}
                >
                  {t.bio}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 13 — ABOUT FOOTER (Unchanged Ashwick institutional marks strip) */}
        <section className="w-full pt-8 border-t border-white/[0.06] dark:border-white/[0.06] border-black/[0.06]">
          <AshwickBottomStrip />
        </section>

      </div>
    </div>
  );
};
