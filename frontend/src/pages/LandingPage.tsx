import React, { useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { AshwickBottomStrip } from '../components/AshwickBottomStrip';

export const LandingPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const darkVideoRef = useRef<HTMLVideoElement>(null);
  const lightVideoRef = useRef<HTMLVideoElement>(null);
  const prevThemeRef = useRef(theme);

  // 1. Initial Autoplay of both videos
  useEffect(() => {
    const darkVideo = darkVideoRef.current;
    const lightVideo = lightVideoRef.current;

    if (darkVideo) {
      darkVideo.playbackRate = 1.0;
      darkVideo.play().catch((err) => {
        console.warn("Dark video autoplay interaction check:", err);
      });
    }

    if (lightVideo) {
      lightVideo.playbackRate = 1.0;
      lightVideo.play().catch((err) => {
        console.warn("Light video autoplay interaction check:", err);
      });
    }
  }, []);

  // 2. Synchronized Rotation Loop: Cadence lock between visible and hidden video
  useEffect(() => {
    const syncCadence = setInterval(() => {
      const activeVideo = isDark ? darkVideoRef.current : lightVideoRef.current;
      const inactiveVideo = isDark ? lightVideoRef.current : darkVideoRef.current;

      if (!activeVideo || !inactiveVideo) return;

      // Keep both videos playing
      if (!activeVideo.paused && inactiveVideo.paused) {
        inactiveVideo.play().catch(() => {});
      }

      // Check drift between videos (duration is 9.400s on both)
      const duration = activeVideo.duration || 9.4;
      const drift = Math.abs(activeVideo.currentTime - inactiveVideo.currentTime);

      // If drift exceeds 50ms (and not during loop boundary wrap), align inactive to active
      if (drift > 0.05 && drift < duration - 0.2) {
        inactiveVideo.currentTime = activeVideo.currentTime;
      }
    }, 400);

    return () => {
      clearInterval(syncCadence);
    };
  }, [isDark]);

  // 3. Instantaneous currentTime handover on theme toggle
  useEffect(() => {
    if (prevThemeRef.current !== theme) {
      const outgoing = prevThemeRef.current === 'dark' ? darkVideoRef.current : lightVideoRef.current;
      const incoming = theme === 'dark' ? darkVideoRef.current : lightVideoRef.current;

      if (outgoing && incoming && !isNaN(outgoing.currentTime)) {
        // Immediately match incoming video's currentTime to outgoing
        incoming.currentTime = outgoing.currentTime;
        if (incoming.paused) {
          incoming.play().catch(() => {});
        }
      }
      prevThemeRef.current = theme;
    }
  }, [theme]);

  return (
    <div 
      className={`relative w-full h-[100dvh] overflow-hidden select-none transition-colors duration-300 ${
        isDark ? 'bg-[#080A0C]' : 'bg-[#F6F4EE]'
      }`}
    >
      
      {/* LAYER 1 (bottom) — DUAL BACKGROUND VIDEOS
          Both videos are mounted at all times, playing in lockstep.
          Cross-fade opacity over 300ms smoothly swaps between dark and light layers. */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Dark Video */}
        <video
          ref={darkVideoRef}
          src="/aegis-datura-loop.mp4"
          poster="/datura-poster.jpg"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300 ease-linear pointer-events-none ${
            isDark ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Light Video */}
        <video
          ref={lightVideoRef}
          src="/aegis-datura-loop-light.mp4"
          poster="/datura-poster-light.jpg"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300 ease-linear pointer-events-none ${
            !isDark ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {/* LAYER 2 (middle) — AMBIENT TREATMENT
          Subtle vignette matched to theme mode so text remains legible over the rotating flower. */}
      <div 
        className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-300 ${
          isDark ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(8, 10, 12, 0.2) 0%, rgba(8, 10, 12, 0.72) 100%)',
        }}
        aria-hidden="true"
      />
      <div 
        className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-300 ${
          !isDark ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(246, 244, 238, 0.05) 0%, rgba(246, 244, 238, 0.45) 100%)',
        }}
        aria-hidden="true"
      />

      {/* LAYER 3 (top) — OVERLAY CONTENT
          Shifted upward to open breathing room over the flower's petals.
          Typography responds cleanly between Dark and Light mode. */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center -translate-y-12 sm:-translate-y-16 px-4 text-center pointer-events-none">
        
        {/* AEGIS — Dominant Hero Display Wordmark */}
        <h1 
          className={`font-display text-[56px] sm:text-[68px] md:text-[76px] lg:text-[84px] font-extrabold tracking-[0.12em] uppercase leading-none select-none transition-colors duration-300 ${
            isDark 
              ? 'text-[#EDEAE3] drop-shadow-[0_2px_24px_rgba(0,0,0,0.95)]' 
              : 'text-[#1A1C1E]'
          }`}
        >
          AEGIS
        </h1>

        {/* AUTOMATED EVIDENCE GOVERNANCE & INTELLIGENCE SYSTEM */}
        <p 
          className={`font-mono text-[11px] sm:text-xs tracking-[0.14em] uppercase mt-3 max-w-xl transition-colors duration-300 ${
            isDark 
              ? 'text-[#EDEAE3]/80 drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]' 
              : 'text-[#1A1C1E]/85'
          }`}
        >
          AUTOMATED EVIDENCE GOVERNANCE &amp; INTELLIGENCE SYSTEM
        </p>

        {/* Reconstruct. Correlate. Resolve. (UPRIGHT, NO ITALIC) */}
        <p 
          className={`font-sans text-xs sm:text-[13px] tracking-widest mt-2.5 not-italic transition-colors duration-300 ${
            isDark 
              ? 'text-[#EDEAE3]/65 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]' 
              : 'text-[#1A1C1E]/70'
          }`}
        >
          Reconstruct. Correlate. Resolve.
        </p>

      </div>

      {/* LAYER 4 (pinned to bottom of viewport) — ASHWICK STRIP + FOOTER */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <AshwickBottomStrip />
      </div>

    </div>
  );
};
