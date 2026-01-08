/**
 * CricketFacts.jsx
 * Display random cricket facts with auto-rotation
 * 
 * Props:
 * - autoRotate: Boolean to auto-rotate facts every N seconds (default: true)
 * - rotateInterval: Interval in ms to rotate facts (default: 10000)
 */

import React, { useState, useEffect } from 'react';
import { getRandomFact } from '../../data/cricketFacts';

const CricketFacts = ({ autoRotate = true, rotateInterval = 10000 }) => {
  const [fact, setFact] = useState(getRandomFact());
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-rotate facts
  useEffect(() => {
    if (!autoRotate) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setFact(getRandomFact());
        setIsAnimating(false);
      }, 300);
    }, rotateInterval);

    return () => clearInterval(interval);
  }, [autoRotate, rotateInterval]);

  const handleRefresh = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setFact(getRandomFact());
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="glass-panel rounded-2xl p-4 bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 hover:border-brand-gold/30 transition-all">
      <div className="flex items-start gap-3">
        {/* Icon - Lightbulb SVG */}
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="text-[10px] uppercase font-bold text-amber-400 tracking-widest mb-1">
            Cricket Fact
          </div>
          <p
            className={`text-sm text-slate-200 leading-relaxed transition-all duration-300 ${
              isAnimating ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {fact}
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isAnimating}
          className="flex-shrink-0 mt-1 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Get another fact"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isAnimating ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CricketFacts;
