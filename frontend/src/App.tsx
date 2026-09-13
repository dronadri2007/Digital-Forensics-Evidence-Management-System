import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { CasesPage, CaseItem } from './pages/CasesPage';
import { InvestigationRoomPage } from './pages/InvestigationRoomPage';
import { NewInvestigationPage } from './pages/NewInvestigationPage';
import { AboutPage } from './pages/AboutPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { InfoModal } from './components/InfoModal';
import {
  loadStoredCases,
  saveStoredCases,
  generateMockCase,
  archiveCase,
  deleteCase,
  WildcardConfig,
} from './services/caseService';

const AppContent: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  });

  // Track previous path for /about and 404 Back button (defaults to /cases)
  const [previousPath, setPreviousPath] = useState<string>('/cases');

  const [cases, setCases] = useState<CaseItem[]>(() => loadStoredCases());

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Global escape key listener to dismiss info modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isInfoOpen) {
          setIsInfoOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInfoOpen]);

  const navigate = (path: string) => {
    if (currentPath !== '/about' && path === '/about') {
      setPreviousPath(currentPath);
    }
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const handleStartCase = (scenarioId: string, wildcardConfig?: WildcardConfig) => {
    const newCase = generateMockCase(scenarioId, cases, wildcardConfig);
    const updatedCases = [newCase, ...cases];
    setCases(updatedCases);
    saveStoredCases(updatedCases);
    navigate(`/cases/${newCase.id}`);
  };

  const handleUpdateCaseStatus = (
    caseId: string,
    status: 'INVESTIGATION ACTIVE' | 'INVESTIGATION COMPLETE'
  ) => {
    setCases((prevCases) => {
      const updated = prevCases.map((c) =>
        c.id === caseId ? { ...c, status } : c
      );
      saveStoredCases(updated);
      return updated;
    });
  };

  const handleArchiveCase = (caseId: string, isArchived: boolean) => {
    const updated = archiveCase(caseId, isArchived);
    setCases(updated);
  };

  const handleDeleteCase = (caseId: string) => {
    const updated = deleteCase(caseId);
    setCases(updated);
  };

  const isLanding = currentPath === '/';
  const isAbout = currentPath === '/about';
  const isCasesList = currentPath === '/cases';
  const isNewInvestigation = currentPath === '/cases/new';
  const caseMatch = currentPath.match(/^\/cases\/([^/]+)$/);
  const isInvestigation = Boolean(caseMatch) && !isNewInvestigation;
  const currentCaseId = isInvestigation && caseMatch ? caseMatch[1] : undefined;
  const isNotFound = !isLanding && !isAbout && !isCasesList && !isNewInvestigation && !isInvestigation;
  const isInternal = isCasesList || isNewInvestigation || isInvestigation || isAbout || isNotFound;

  return (
    <div 
      className={`relative w-full h-[100dvh] ${
        isCasesList || isNewInvestigation || isAbout || isNotFound ? 'overflow-y-auto' : 'overflow-hidden'
      } transition-colors duration-300 ${
        isDark ? 'bg-[#080A0C] text-[#EDEAE3]' : 'bg-[#F6F4EE] text-[#1A1C1E]'
      } selection:bg-slate-700 selection:text-white`}
    >
      {/* Fixed Top Navbar (Internal config for /cases, /cases/new, /about, /cases/:id, and 404; landing config for /) */}
      <Navbar
        isInternalPage={isInternal}
        onBack={() => {
          if (isAbout || isNotFound) {
            navigate(previousPath || '/cases');
          } else if (isInvestigation || isNewInvestigation) {
            navigate('/cases');
          } else {
            navigate('/');
          }
        }}
        onGetStarted={() => navigate('/cases')}
        onInfoClick={() => navigate('/about')}
        onNavigate={navigate}
      />

      {/* Content View */}
      <main className="w-full h-full">
        {isAbout ? (
          <AboutPage onNavigate={navigate} />
        ) : isInvestigation ? (
          <InvestigationRoomPage
            caseId={currentCaseId}
            cases={cases}
            onNavigateBack={() => navigate('/cases')}
            onUpdateCaseStatus={handleUpdateCaseStatus}
          />
        ) : isNewInvestigation ? (
          <NewInvestigationPage onStartCase={handleStartCase} />
        ) : isCasesList ? (
          <CasesPage 
            cases={cases}
            onNewInvestigation={() => navigate('/cases/new')}
            onOpenCase={(id) => navigate(`/cases/${id}`)}
            onArchiveCase={handleArchiveCase}
            onDeleteCase={handleDeleteCase}
          />
        ) : isLanding ? (
          <LandingPage />
        ) : (
          <NotFoundPage onNavigate={navigate} />
        )}
      </main>

      {/* Info Modal */}
      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
