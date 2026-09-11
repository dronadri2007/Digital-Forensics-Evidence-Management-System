import React from 'react';
import { X } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-white/[0.12] bg-[#0D1117] dark:bg-[#0D1117] bg-white p-6 sm:p-8 text-slate-200 dark:text-slate-200 text-slate-800 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-md border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/[0.2] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Content */}
        <div className="mb-6">
          <span className="font-mono text-[10px] tracking-ultra-wide uppercase text-slate-400">
            SYSTEM DOSSIER &amp; SPECIFICATION
          </span>
          <h2 id="modal-title" className="font-sans text-2xl font-bold text-slate-100 dark:text-slate-100 text-slate-900 mt-1">
            AEGIS System Architecture
          </h2>
          <p className="font-mono text-xs text-slate-400 mt-1">
            Automated Evidence Governance &amp; Intelligence System
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-slate-300 dark:text-slate-300 text-slate-600 font-sans leading-relaxed">
          <section>
            <h3 className="font-mono text-xs font-semibold uppercase text-slate-100 dark:text-slate-100 text-slate-900 mb-1.5">
              1. AEGIS Mission
            </h3>
            <p>
              AEGIS is an institutional digital-forensics intelligence architecture engineered to model, govern, and reconstruct complex investigative evidence networks within synthetic urban simulation sandboxes.
            </p>
          </section>

          <section>
            <h3 className="font-mono text-xs font-semibold uppercase text-slate-100 dark:text-slate-100 text-slate-900 mb-1.5">
              2. Ashwick Synthetic Sandbox
            </h3>
            <p>
              All evidence nodes, telephone intercepts, financial ledgers, and surveillance feeds operate strictly within the synthetic municipality of Ashwick Town. This isolates investigative machine intelligence within a rigorous, deterministic playground.
            </p>
          </section>

          <section>
            <h3 className="font-mono text-xs font-semibold uppercase text-slate-100 dark:text-slate-100 text-slate-900 mb-1.5">
              3. Visual &amp; Algorithmic Philosophy
            </h3>
            <p>
              Designed with quiet, institutional forensic restraint. Eliminates speculative sci-fi tropes in favor of clear typography, mathematical graph topology, and continuous rotational symmetry embodied by the sacred Datura mark.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-4 border-t border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono uppercase tracking-wider rounded border border-white/[0.12] text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            Dismiss
          </button>
        </div>

      </div>
    </div>
  );
};
