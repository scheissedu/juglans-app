// /klinecharts-workspace/ai-service/tools/index.js

import { createTradeSuggestionTool } from './create_trade_suggestion.js';

// 未来可以添加更多工具
// import { anotherTool } from './another_tool.js';

const tools = [
  createTradeSuggestionTool,
  // anotherTool,
];

export default tools;