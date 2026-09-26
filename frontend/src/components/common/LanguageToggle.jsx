import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Languages } from 'lucide-react';

/**
 * LanguageToggle Component
 * Quick pill switch between English and Hindi
 */
export const LanguageToggle = () => {
  const { lang, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title="Toggle Language / भाषा बदलें"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-all shadow-sm"
    >
      <Languages className="w-3.5 h-3.5 text-orange-500" />
      <span className="font-semibold">{lang === 'en' ? 'हिन्दी' : 'English'}</span>
    </button>
  );
};

export default LanguageToggle;
