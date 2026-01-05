/**
 * Footer.jsx
 * Copyright footer component for CricSim - Pro
 */

import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 border-t border-slate-700 text-center py-4 px-4">
      <div className="max-w-7xl mx-auto">
        <p className="text-slate-400 text-sm">
          © {currentYear} <span className="text-brand-gold font-semibold">CricSim - Pro</span> by <span className="text-white font-semibold">Aditya Patil</span>. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
