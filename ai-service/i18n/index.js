// ai-service/i18n/index.js
import { enUS } from './en-US.js';
import { zhCN } from './zh-CN.js';

const translations = {
  'en-US': enUS,
  'zh-CN': zhCN,
};

/**
 * 获取指定语言的翻译文本
 * @param {string} locale - 'en-US' or 'zh-CN'
 * @returns {object}
 */
export function getTranslations(locale) {
  // 默认回退到英文
  return translations[locale] || translations['en-US'];
}