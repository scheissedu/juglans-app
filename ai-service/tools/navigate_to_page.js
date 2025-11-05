// ai-service/tools/navigate_to_page.js
import { pages } from './page-config.js';

export function getNavigateToPageTool(t) {
  // 从 page-config.js 动态生成枚举列表和描述
  const pageNames = Object.keys(pages);
  
  // 构建一个更丰富的描述，包含所有页面的信息，帮助AI做决策
  const pageDescriptions = pageNames.map(name => 
    `"${name}" (aliases: ${pages[name].aliases.join(', ')}): ${pages[name].description}`
  ).join('; ');

  return {
    type: 'function',
    function: {
      name: 'navigate_to_page',
      description: t.description, // "当用户想要导航到应用的不同页面时调用。"
      parameters: {
        type: 'object',
        properties: {
          page: {
            type: 'string',
            enum: pageNames, // <-- 动态生成的枚举
            description: `${t.parameters.page} ${pageDescriptions}` // <-- 动态生成的详细描述
          },
        },
        required: ['page'],
      },
    },
  };
}