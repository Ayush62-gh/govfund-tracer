import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { translations } from '../data/translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('mplads_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('mplads_lang', lang);
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  /**
   * Translation lookup helper
   * @param {string} key 
   * @param {string} defaultText 
   * @returns {string}
   */
  const t = (key, defaultText = '') => {
    const dict = translations[lang] || translations.en;
    if (dict[key]) return dict[key];
    if (translations.en[key]) return translations.en[key];
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
