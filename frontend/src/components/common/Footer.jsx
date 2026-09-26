import React from 'react';
import { ShieldCheck, Lock, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Footer Component
 * Standard Government of India institutional footer with security certificates, WCAG AA compliance, and disclaimers.
 */
export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 py-6 px-6 no-print">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left disclaimer */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>NIC Certified Security Audit</span>
          </div>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
          <span>WCAG 2.1 Level AA Compliant</span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
          <span>End-to-End TLS 1.3 Encrypted</span>
        </div>

        {/* Right copyright & links */}
        <div className="flex items-center gap-4 text-center">
          <span>
            Designed & Hosted by <strong>National Informatics Centre (NIC)</strong> for MoSPI
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">
            v4.2.8
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
