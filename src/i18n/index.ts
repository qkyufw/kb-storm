import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入语言资源
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

// 语言资源配置
const resources = {
  'zh-CN': {
    translation: zhCN
  },
  'en-US': {
    translation: enUS
  }
};

// 支持的语言列表
export const supportedLanguages = [
  { code: 'zh-CN', name: '中文', nativeName: '中文' },
  { code: 'en-US', name: 'English', nativeName: 'English' }
];

// 获取默认语言
const getDefaultLanguage = (): string => {
  // 优先使用本地存储的语言设置
  const savedLanguage = localStorage.getItem('kb-storm-language');
  if (savedLanguage && supportedLanguages.some(lang => lang.code === savedLanguage)) {
    return savedLanguage;
  }
  
  // 其次使用浏览器语言
  const browserLanguage = navigator.language;
  if (browserLanguage.startsWith('zh')) {
    return 'zh-CN';
  }
  
  // 默认使用中文
  return 'zh-CN';
};

// 初始化i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: getDefaultLanguage(),
    fallbackLng: 'zh-CN',
    
    // 语言检测配置
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'kb-storm-language'
    },
    
    interpolation: {
      escapeValue: false // React已经默认转义
    },
    
    // 开发模式下显示调试信息
    debug: process.env.NODE_ENV === 'development'
  });

// 语言切换函数
export const changeLanguage = (languageCode: string): Promise<any> => {
  localStorage.setItem('kb-storm-language', languageCode);
  return i18n.changeLanguage(languageCode);
};

// 获取当前语言
export const getCurrentLanguage = (): string => {
  return i18n.language || 'zh-CN';
};

// 获取当前语言的显示名称
export const getCurrentLanguageName = (): string => {
  const currentLang = getCurrentLanguage();
  const language = supportedLanguages.find(lang => lang.code === currentLang);
  return language?.nativeName || '中文';
};

export default i18n;
