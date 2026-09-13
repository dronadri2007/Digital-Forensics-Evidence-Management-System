import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export interface CaseItem {
  id: string;
  title: string;
  description: string;
  status: 'INVESTIGATION ACTIVE' | 'INVESTIGATION COMPLETE';
  isArchived?: boolean;
  wildcardConfig?: {
    motive: string;
    scene: string;
    scarcity: string;
    relationship?: string;
    complexity?: string;
    window?: string;
    evidenceCount?: number;
    confidence?: number;
  };
}

export interface CasesPageProps {
  cases?: CaseItem[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onOpenCase?: (caseId: string) => void;
  onNewInvestigation?: () => void;
  onDeleteCase?: (caseId: string) => void;
  onArchiveCase?: (caseId: string, isArchived: boolean) => void;
}

export const CasesPage: React.FC<CasesPageProps> = ({
  cases: propCases,
  isLoading = false,
  error = null,
  onRetry,
  onOpenCase,
  onNewInvestigation,
  onDeleteCase,
  onArchiveCase,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [internalCases] = useState<CaseItem[]>([]);
  const cases = propCases ?? internalCases;

  // Filter & Search state
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuCaseId, setOpenMenuCaseId] = useState<string | null>(null);
  const [caseToDelete, setCaseToDelete] = useState<CaseItem | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcuts: Cmd/Ctrl + K to focus search, Esc to close menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setOpenMenuCaseId(null);
        setCaseToDelete(null);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close active card overflow menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        openMenuCaseId &&
        menuContainerRef.current &&
        !menuContainerRef.current.contains(e.target as Node)
      ) {
        setOpenMenuCaseId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuCaseId]);

  // Tab separation
  const activeCases = cases.filter((c) => !c.isArchived);
  const archivedCases = cases.filter((c) => Boolean(c.isArchived));

  const currentTabCases = activeTab === 'ACTIVE' ? activeCases : archivedCases;

  // Search filter (title & description, case-insensitive partial match)
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleCases = currentTabCases.filter((c) => {
    if (!normalizedQuery) return true;
    return (
      c.title.toLowerCase().includes(normalizedQuery) ||
      c.description.toLowerCase().includes(normalizedQuery) ||
      c.id.toLowerCase().includes(normalizedQuery)
    );
  });

  const handleDeleteConfirm = () => {
    if (caseToDelete) {
      onDeleteCase?.(caseToDelete.id);
      setCaseToDelete(null);
      setOpenMenuCaseId(null);
    }
  };

  return (
    <div 
      className={`min-h-screen w-full transition-colors duration-300 ${
        isDark ? 'bg-[#080A0C] text-[#EDEAE3]' : 'bg-[#F6F4EE] text-[#1A1C1E]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-8 sm:px-10 pt-28 sm:pt-32 pb-24">
        {/* HEADER AREA */}
        <div className="mb-8">
          <span 
            className={`font-mono text-xs font-semibold uppercase tracking-[0.22em] block mb-2 select-none ${
              isDark ? 'text-[#74AC95]' : 'text-[#1E6147]'
            }`}
          >
            CASE FILES
          </span>
          <p 
            className={`font-sans text-sm sm:text-base font-normal leading-relaxed ${
              isDark ? 'text-[#EDEAE3]/65' : 'text-[#1A1C1E]/65'
            }`}
          >
            Your investigations inside the Ashwick environment.
          </p>
        </div>

        {/* CONTROLS STRIP: ACTIVE/ARCHIVED TABS + REALTIME SEARCH (Section E2 & F) */}
        {!error && !isLoading && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-black/[0.06] dark:border-white/[0.06]">
            {/* Filter Tabs: ACTIVE / ARCHIVED */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] select-none">
              <button
                type="button"
                onClick={() => setActiveTab('ACTIVE')}
                className={`px-3.5 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  activeTab === 'ACTIVE'
                    ? isDark
                      ? 'bg-white/[0.10] text-[#EDEAE3] shadow-sm font-semibold'
                      : 'bg-white text-[#1A1C1E] shadow-sm font-semibold'
                    : isDark
                    ? 'text-[#EDEAE3]/50 hover:text-[#EDEAE3]'
                    : 'text-[#1A1C1E]/50 hover:text-[#1A1C1E]'
                }`}
              >
                ACTIVE ({activeCases.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ARCHIVED')}
                className={`px-3.5 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  activeTab === 'ARCHIVED'
                    ? isDark
                      ? 'bg-white/[0.10] text-[#EDEAE3] shadow-sm font-semibold'
                      : 'bg-white text-[#1A1C1E] shadow-sm font-semibold'
                    : isDark
                    ? 'text-[#EDEAE3]/50 hover:text-[#EDEAE3]'
                    : 'text-[#1A1C1E]/50 hover:text-[#1A1C1E]'
                }`}
              >
                ARCHIVED ({archivedCases.length})
              </button>
            </div>

            {/* Search Input (Section F): width ~360-420px */}
            <div className="relative w-full sm:w-[380px] select-none">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`w-3.5 h-3.5 ${isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'}`} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cases..."
                className={`w-full pl-9 pr-14 py-2 text-xs font-sans rounded-lg border transition-colors duration-150 focus:outline-none ${
                  isDark
                    ? 'bg-[#0D1117] border-white/[0.08] text-[#EDEAE3] placeholder-[#EDEAE3]/30 focus:border-[#74AC95]/50'
                    : 'bg-white border-black/[0.08] text-[#1A1C1E] placeholder-[#1A1C1E]/30 focus:border-[#1E6147]/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                <kbd
                  className={`font-mono text-[9.5px] px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                    isDark
                      ? 'bg-white/[0.04] border-white/[0.08] text-[#EDEAE3]/35'
                      : 'bg-black/[0.03] border-black/[0.08] text-[#1A1C1E]/40'
                  }`}
                >
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>
        )}

        {/* LOADING SKELETON STATE (Section B1) */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`rounded-lg border p-6 sm:p-7 flex flex-col justify-between min-h-[220px] animate-pulse ${
                  isDark
                    ? 'border-white/[0.06] bg-[#0D1117]'
                    : 'border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className={`h-3 w-16 rounded ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.05]'}`} />
                    <div className={`h-4 w-28 rounded-full ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.05]'}`} />
                  </div>
                  <div className={`h-6 w-3/4 rounded mb-3 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.07]'}`} />
                  <div className={`h-3 w-full rounded mb-2 ${isDark ? 'bg-white/[0.04]' : 'bg-black/[0.04]'}`} />
                  <div className={`h-3 w-2/3 rounded ${isDark ? 'bg-white/[0.04]' : 'bg-black/[0.04]'}`} />
                </div>
                <div className={`pt-6 mt-6 border-t ${isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
                  <div className={`h-3 w-20 rounded ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.05]'}`} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ERROR STATE (Section B2) */}
        {!isLoading && error && (
          <div className="w-full flex flex-col items-center justify-center py-16 sm:py-24 text-center">
            <div
              className={`w-12 h-12 rounded-full border flex items-center justify-center mb-4 ${
                isDark
                  ? 'border-red-500/20 bg-red-500/10 text-red-400'
                  : 'border-red-600/20 bg-red-50 text-red-600'
              }`}
            >
              <AlertCircle className="w-6 h-6 stroke-[1.75]" />
            </div>
            <span
              className={`font-mono text-xs uppercase tracking-[0.2em] block mb-2 ${
                isDark ? 'text-red-400/80' : 'text-red-700/80'
              }`}
            >
              ERROR · DATA SYNC FAILURE
            </span>
            <h2 className="font-sans font-bold text-xl uppercase tracking-tight mb-2">
              Failed to load cases
            </h2>
            <p
              className={`font-sans text-xs sm:text-sm leading-relaxed max-w-md mb-6 ${
                isDark ? 'text-[#EDEAE3]/60' : 'text-[#1A1C1E]/60'
              }`}
            >
              {error || 'Unable to retrieve active case files from the investigation index.'}
            </p>
            <div className="flex items-center gap-3">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className={`px-5 py-2 rounded-lg border font-mono text-xs uppercase tracking-widest transition-colors ${
                    isDark
                      ? 'border-[#74AC95]/40 bg-[#74AC95]/15 text-[#74AC95] hover:bg-[#74AC95]/25'
                      : 'border-[#1E6147]/40 bg-[#1E6147]/10 text-[#1E6147] hover:bg-[#1E6147]/20'
                  }`}
                >
                  RETRY
                </button>
              )}
              {onNewInvestigation && (
                <button
                  type="button"
                  onClick={onNewInvestigation}
                  className={`px-4 py-2 rounded-lg border font-mono text-xs uppercase tracking-widest transition-colors ${
                    isDark
                      ? 'border-white/[0.10] bg-[#0D1117] text-[#EDEAE3]/70 hover:text-white'
                      : 'border-black/[0.10] bg-white text-[#1A1C1E]/70 hover:text-black'
                  }`}
                >
                  NEW INVESTIGATION
                </button>
              )}
            </div>
          </div>
        )}

        {/* CONTENT AREA: Active Grid vs Empty Grid */}
        {!isLoading && !error && (
          <div>
            {/* Global Empty State (when 0 cases ever exist) */}
            {cases.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center py-12 sm:py-20">
                <p 
                  className={`font-mono text-xs uppercase tracking-[0.18em] mb-6 text-center select-none ${
                    isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'
                  }`}
                >
                  No investigations yet.
                </p>

                <div
                  onClick={onNewInvestigation}
                  data-new-investigation-trigger="true"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') onNewInvestigation?.(); }}
                  className={`w-full max-w-lg rounded-lg border p-8 sm:p-12 text-center transition-all duration-200 ease-out cursor-pointer group focus:outline-none focus-visible:ring-1 focus-visible:ring-[#6B9B85] hover:-translate-y-0.5 ${
                    isDark
                      ? 'border-white/[0.08] bg-[#0D1117] hover:border-white/[0.18] hover:bg-[#11161E]'
                      : 'border-black/[0.08] bg-white hover:border-black/[0.18] hover:bg-[#FAF8F5] shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
                  }`}
                >
                  <div 
                    className={`w-10 h-10 rounded-full border flex items-center justify-center mx-auto mb-5 transition-colors duration-200 ${
                      isDark
                        ? 'border-white/[0.08] bg-white/[0.03] text-[#EDEAE3]/70 group-hover:text-[#74AC95] group-hover:border-[#74AC95]/40'
                        : 'border-black/[0.08] bg-black/[0.03] text-[#1A1C1E]/70 group-hover:text-[#1E6147] group-hover:border-[#1E6147]/40'
                    }`}
                  >
                    <Plus className="w-5 h-5 stroke-[1.75]" />
                  </div>

                  <h2 
                    className={`font-sans font-bold text-base sm:text-lg uppercase tracking-[0.14em] transition-colors duration-200 select-none ${
                      isDark 
                        ? 'text-[#EDEAE3] group-hover:text-[#74AC95]' 
                        : 'text-[#1A1C1E] group-hover:text-[#1E6147]'
                    }`}
                  >
                    NEW INVESTIGATION
                  </h2>

                  <p 
                    className={`font-sans text-xs sm:text-sm leading-relaxed mt-2.5 max-w-sm mx-auto ${
                      isDark ? 'text-[#EDEAE3]/55' : 'text-[#1A1C1E]/55'
                    }`}
                  >
                    Select an investigative tier to generate synthetic case evidence in Ashwick.
                  </p>
                </div>
              </div>
            ) : (
              /* GRID WITH CASES */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* NEW INVESTIGATION CARD (Always first in ACTIVE tab) */}
                {activeTab === 'ACTIVE' && (
                  <div
                    onClick={onNewInvestigation}
                    data-new-investigation-trigger="true"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') onNewInvestigation?.(); }}
                    className={`rounded-lg border p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 ease-out group cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#6B9B85] hover:-translate-y-0.5 ${
                      isDark
                        ? 'border-white/[0.08] bg-[#0D1117] hover:border-white/[0.18] hover:bg-[#11161E]'
                        : 'border-black/[0.08] bg-white hover:border-black/[0.18] hover:bg-[#FAF8F5] shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
                    }`}
                  >
                    <div>
                      <div 
                        className={`w-9 h-9 rounded-full border flex items-center justify-center mb-4 transition-colors duration-200 ${
                          isDark
                            ? 'border-white/[0.08] bg-white/[0.03] text-[#EDEAE3]/70 group-hover:text-[#74AC95] group-hover:border-[#74AC95]/40'
                            : 'border-black/[0.08] bg-black/[0.03] text-[#1A1C1E]/70 group-hover:text-[#1E6147] group-hover:border-[#1E6147]/40'
                        }`}
                      >
                        <Plus className="w-4 h-4 stroke-[1.75]" />
                      </div>

                      <h3 
                        className={`font-sans font-bold text-lg sm:text-xl uppercase tracking-[0.14em] mb-2.5 leading-snug transition-colors duration-200 select-none ${
                          isDark 
                            ? 'text-[#EDEAE3] group-hover:text-[#74AC95]' 
                            : 'text-[#1A1C1E] group-hover:text-[#1E6147]'
                        }`}
                      >
                        NEW INVESTIGATION
                      </h3>

                      <p 
                        className={`font-sans text-xs sm:text-sm leading-relaxed ${
                          isDark ? 'text-[#EDEAE3]/55' : 'text-[#1A1C1E]/55'
                        }`}
                      >
                        Begin a new investigation in the Ashwick environment.
                      </p>
                    </div>

                    <div 
                      className={`pt-6 mt-6 border-t flex items-center justify-between ${
                        isDark ? 'border-white/[0.05]' : 'border-black/[0.05]'
                      }`}
                    >
                      <span 
                        className={`font-mono text-xs uppercase tracking-widest transition-colors duration-200 flex items-center gap-2 select-none ${
                          isDark
                            ? 'text-[#EDEAE3]/70 group-hover:text-[#74AC95]'
                            : 'text-[#1A1C1E]/70 group-hover:text-[#1E6147]'
                        }`}
                      >
                        <span>CREATE CASE</span>
                        <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* CASE CARDS */}
                {visibleCases.map((caseItem) => {
                  const isActive = caseItem.status === 'INVESTIGATION ACTIVE';
                  const isMenuOpen = openMenuCaseId === caseItem.id;

                  return (
                    <div
                      key={caseItem.id}
                      data-case-card-id={caseItem.id}
                      onClick={() => onOpenCase?.(caseItem.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') onOpenCase?.(caseItem.id); }}
                      className={`relative rounded-lg border p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 ease-out group cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#6B9B85] hover:-translate-y-0.5 ${
                        isDark
                          ? 'border-white/[0.08] bg-[#0D1117] hover:border-white/[0.18] hover:bg-[#11161E]'
                          : 'border-black/[0.08] bg-white hover:border-black/[0.18] hover:bg-[#FAF8F5] shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
                      }`}
                    >
                      <div>
                        {/* Top Row: Case ID, Status Tag, and 3-Dots Menu */}
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <span 
                            className={`font-mono text-xs tracking-wider uppercase select-none ${
                              isDark ? 'text-[#EDEAE3]/45' : 'text-[#1A1C1E]/45'
                            }`}
                          >
                            {caseItem.id}
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Status Tag */}
                            <span 
                              className={`font-mono text-[10px] uppercase tracking-[0.14em] px-2.5 py-1 rounded-full border select-none ${
                                isActive
                                  ? isDark
                                    ? 'bg-[#6B9B85]/10 text-[#74AC95] border-[#6B9B85]/25'
                                    : 'bg-[#1E6147]/10 text-[#1E6147] border-[#1E6147]/25'
                                  : isDark
                                    ? 'bg-[#E4BCC9]/10 text-[#E8C8D4] border-[#E4BCC9]/25'
                                    : 'bg-[#E4BCC9]/25 text-[#7A4455] border-[#E4BCC9]/50'
                              }`}
                            >
                              {caseItem.status}
                            </span>

                            {/* 3-Dots Overflow Menu Trigger (Section E1) */}
                            <div className="relative" ref={isMenuOpen ? menuContainerRef : null}>
                              <button
                                type="button"
                                title="Case Options"
                                aria-label="Case actions menu"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuCaseId(isMenuOpen ? null : caseItem.id);
                                }}
                                className={`p-1 rounded transition-colors duration-150 focus:outline-none ${
                                  isDark
                                    ? 'text-[#EDEAE3]/40 hover:text-[#EDEAE3] hover:bg-white/[0.08]'
                                    : 'text-[#1A1C1E]/40 hover:text-[#1A1C1E] hover:bg-black/[0.05]'
                                }`}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {/* Overflow Popover */}
                              {isMenuOpen && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className={`absolute right-0 top-7 w-36 py-1 rounded-lg border shadow-xl z-20 select-none ${
                                    isDark
                                      ? 'bg-[#141A22] border-white/[0.12] text-[#EDEAE3]'
                                      : 'bg-white border-black/[0.12] text-[#1A1C1E]'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onArchiveCase?.(caseItem.id, !caseItem.isArchived);
                                      setOpenMenuCaseId(null);
                                    }}
                                    className={`w-full text-left px-3 py-2 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                                      isDark
                                        ? 'hover:bg-white/[0.06] text-[#EDEAE3]/80 hover:text-white'
                                        : 'hover:bg-black/[0.04] text-[#1A1C1E]/80 hover:text-black'
                                    }`}
                                  >
                                    {caseItem.isArchived ? 'RESTORE CASE' : 'ARCHIVE CASE'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCaseToDelete(caseItem);
                                      setOpenMenuCaseId(null);
                                    }}
                                    className={`w-full text-left px-3 py-2 font-mono text-[10px] uppercase tracking-wider transition-colors border-t ${
                                      isDark
                                        ? 'border-white/[0.06] text-red-400 hover:bg-red-500/10'
                                        : 'border-black/[0.06] text-red-600 hover:bg-red-50'
                                    }`}
                                  >
                                    DELETE CASE
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Case Title */}
                        <h3 
                          className={`font-sans text-lg sm:text-xl font-bold tracking-tight mb-2.5 leading-snug transition-colors duration-200 ${
                            isDark
                              ? 'text-[#EDEAE3] group-hover:text-[#74AC95]'
                              : 'text-[#1A1C1E] group-hover:text-[#1E6147]'
                          }`}
                        >
                          {caseItem.title}
                        </h3>

                        {/* One-line short description */}
                        <p 
                          className={`font-sans text-xs sm:text-sm leading-relaxed line-clamp-2 ${
                            isDark ? 'text-[#EDEAE3]/60' : 'text-[#1A1C1E]/65'
                          }`}
                        >
                          {caseItem.description}
                        </p>
                      </div>

                      {/* Bottom Row: Quiet "OPEN CASE →" action */}
                      <div 
                        className={`pt-6 mt-6 border-t flex items-center justify-between ${
                          isDark ? 'border-white/[0.05]' : 'border-black/[0.05]'
                        }`}
                      >
                        <span 
                          className={`font-mono text-xs uppercase tracking-widest transition-colors duration-200 flex items-center gap-2 select-none ${
                            isDark
                              ? 'text-[#EDEAE3]/70 group-hover:text-[#74AC95]'
                              : 'text-[#1A1C1E]/70 group-hover:text-[#1E6147]'
                          }`}
                        >
                          <span>OPEN CASE</span>
                          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty Search Result state (Section F2) */}
            {cases.length > 0 && visibleCases.length === 0 && (
              <div className="w-full text-center py-16 border rounded-lg border-dashed border-black/[0.08] dark:border-white/[0.08]">
                <p 
                  className={`font-mono text-xs uppercase tracking-[0.16em] ${
                    isDark ? 'text-[#EDEAE3]/40' : 'text-[#1A1C1E]/40'
                  }`}
                >
                  No cases match your search.
                </p>
              </div>
            )}
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL (Section E2, E4) */}
        {caseToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
            <div
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-xl border p-6 shadow-2xl transition-all ${
                isDark
                  ? 'bg-[#0E1216] border-white/[0.14] text-[#EDEAE3]'
                  : 'bg-white border-black/[0.14] text-[#1A1C1E]'
              }`}
            >
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.2em] block mb-2 ${
                  isDark ? 'text-[#E07A7A]' : 'text-[#B84A4A]'
                }`}
              >
                PERMANENT REMOVAL
              </span>
              <h3 className="font-sans font-bold text-lg uppercase tracking-tight mb-2">
                DELETE CASE?
              </h3>
              <p
                className={`font-sans text-xs sm:text-sm leading-relaxed mb-6 ${
                  isDark ? 'text-[#EDEAE3]/65' : 'text-[#1A1C1E]/65'
                }`}
              >
                This cannot be undone. All forensic graph state and investigation logs for case{' '}
                <span className="font-mono font-semibold">{caseToDelete.id}</span> ({caseToDelete.title}) will be permanently removed.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCaseToDelete(null)}
                  className={`px-4 py-2 rounded-md font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                    isDark
                      ? 'border border-white/[0.10] bg-transparent text-[#EDEAE3]/70 hover:bg-white/[0.05] hover:text-white'
                      : 'border border-black/[0.10] bg-transparent text-[#1A1C1E]/70 hover:bg-black/[0.04] hover:text-black'
                  }`}
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className={`px-4 py-2 rounded-md font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#C85A5A]/20 border border-[#C85A5A]/50 text-[#EDEAE3] hover:bg-[#C85A5A]/30'
                      : 'bg-[#B84A4A]/15 border border-[#B84A4A]/40 text-[#7A2424] hover:bg-[#B84A4A]/25'
                  }`}
                >
                  DELETE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
