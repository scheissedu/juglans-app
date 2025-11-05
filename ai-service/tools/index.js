// ai-service/tools/index.js

import { getCreateTradeSuggestionTool } from './create_trade_suggestion.js';
import { getNavigateToPageTool } from './navigate_to_page.js';
import { getEscalateToAdvancedModelTool } from './escalate_to_advanced_model.js';
import { getTranslations } from '../i18n/index.js';

/**
 * 根据语言环境获取工具集
 * @param {string} locale 
 * @returns {{basicTools: object[], advancedTools: object[]}}
 */
export function getTools(locale) {
  const t = getTranslations(locale).tools;

  const createTradeSuggestionTool = getCreateTradeSuggestionTool(t.create_trade_suggestion);
  const navigateToPageTool = getNavigateToPageTool(t.navigate_to_page);
  const escalateToAdvancedModelTool = getEscalateToAdvancedModelTool(t.escalate_to_advanced_model);

  const basicTools = [
    navigateToPageTool,
    createTradeSuggestionTool,
    escalateToAdvancedModelTool,
  ];

  // +++ 核心修正：为高级模型也提供导航工具 +++
  const advancedTools = [
    createTradeSuggestionTool,
    navigateToPageTool, // <--- 添加此行
  ];
  
  return { basicTools, advancedTools };
}