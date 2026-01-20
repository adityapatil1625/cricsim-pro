/**
 * Footer.jsx
 * Copyright footer component for CricSim - Pro
 */

import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-t from-slate-950 via-slate-900/50 to-slate-900/0 border-t border-white/5 py-8 md:py-12 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8">
          {/* Brand Section */}
          <div className="text-center md:text-left">
            <h3 className="text-lg md:text-xl font-broadcast text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-yellow-500 mb-2">
              CricSim Pro
            </h3>
            <p className="text-xs md:text-sm text-slate-400">
              Elite T20 Cricket Simulation Platform
            </p>
          </div>

          {/* Features Section */}
          <div className="text-center">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3">Features</h4>
            <ul className="space-y-1 text-xs text-slate-500">
              <li>Quick Play & Tournament</li>
              <li>IPL Auction Mode</li>
              <li>Multiplayer Online</li>
              <li>Real-time Stats</li>
            </ul>
          </div>

          {/* Developer Section */}
          <div className="text-center md:text-right">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3">Developer</h4>
            <p className="text-sm">
              <span className="text-white font-semibold">Aditya Patil</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Crafted with 🏏 for Cricket Enthusiasts</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs md:text-sm text-slate-500 text-center sm:text-left">
            © {currentYear} <span className="text-brand-gold font-semibold">CricSim - Pro</span>. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-slate-500">
            <a href="#" className="hover:text-brand-gold transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-gold transition-colors">Terms</a>
            <a href="#" className="hover:text-brand-gold transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
