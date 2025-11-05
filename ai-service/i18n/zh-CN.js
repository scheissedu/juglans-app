// ai-service/i18n/zh-CN.js
export const zhCN = {
  languageName: '简体中文',
  tools: {
    create_trade_suggestion: {
      description: '当用户明确表达交易意图时（例如买入、卖出、做多、做空），解析出所有必要的交易参数以生成一个完整的交易建议。',
      parameters: {
        symbol: '交易对代码, 例如 BTC/USD, AAPL, BABA。',
        direction: '交易方向。买入、做多应解析为 "LONG"；卖出、做空应解析为 "SHORT"。',
        summary: '对用户交易意图的简短总结，例如 "市价买入 1 BTC"。'
      }
    },
    escalate_to_advanced_model: {
      description: '当用户的请求需要深入分析、市场观点、复杂推理或任何超出简单指令范围的任务时，必须调用此工具将任务转交给高级模型处理。',
      parameters: {
        reason: '简要说明为什么要转交给高级模型，例如 "用户要求进行市场分析" 或 "用户的问题很复杂"。',
        user_request: '用户原始的、未经修改的完整请求文本。'
      }
    },
    navigate_to_page: {
      description: '当用户想要导航到应用的不同页面时调用。',
      parameters: {
        page: '目标页面的名称。例如 "市场", "钱包", "图表"。'
      }
    }
  }
};