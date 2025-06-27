import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, changeLanguage, getCurrentLanguage } from '../i18n';
import '../styles/LanguageSwitcher.css';

interface LanguageSwitcherProps {
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const currentLanguage = getCurrentLanguage();

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      setIsOpen(false);
      
      // 可选：显示切换成功的提示
      console.log(`Language switched to: ${languageCode}`);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const currentLangInfo = supportedLanguages.find(lang => lang.code === currentLanguage);

  return (
    <div className={`language-switcher ${className}`}>
      <button
        className="language-switcher-button"
        onClick={() => setIsOpen(!isOpen)}
        title={t('toolbar.languageSwitch')}
      >
        <span className="language-icon">🌐</span>
        <span className="language-text">{currentLangInfo?.nativeName || 'Language'}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className="language-dropdown">
          {supportedLanguages.map((language) => (
            <button
              key={language.code}
              className={`language-option ${currentLanguage === language.code ? 'active' : ''}`}
              onClick={() => handleLanguageChange(language.code)}
            >
              <span className="language-native-name">{language.nativeName}</span>
              <span className="language-english-name">({language.name})</span>
            </button>
          ))}
        </div>
      )}
      
      {/* 点击外部关闭下拉菜单 */}
      {isOpen && (
        <div 
          className="language-dropdown-overlay" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageSwitcher;
