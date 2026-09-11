# AEGIS Frontend

AI-assisted digital forensics investigation interface built with React, Vite, TypeScript, and Tailwind CSS.

## Architecture

- **Landing Page (`/`)**: Atmosphere, Datura flower video canvas, institutional brief, and direct investigation entry.
- **Cases Dashboard (`/cases`)**: Active case registry, status badges, investigation metrics, and new investigation initiation.
- **Case Investigation Room (`/cases/:id`)**: Full interactive workspace featuring:
  - Context strip with case metadata and live confidence scores.
  - Interactive Pan/Zoom Evidence Graph with forensic, circumstantial, and contradiction relations.
  - Contextual Entity Inspector drawer with Dossier details, relationships, and timelines.
  - Floating Frosted Glass AEGIS AI Panel with structured reasoning, real-time log, evidence input bar, and collapsible state.
  - In-place Case Resolution flow.
- **New Investigation (`/cases/new`)**: Scenario briefs (Tier 01–03 & Wildcard generator) with parameter customization.
- **About AEGIS (`/about`)**: Editorial presentation of the synthetic sandbox, 8-layer evidence environment, reasoning model, and pipeline.

## Getting Started

### Prerequisites
- Node.js 18+
- npm / pnpm / yarn

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
```