// /klinecharts-workspace/ai-service/tools/create_trade_suggestion.js

export const createTradeSuggestionTool = {
  type: 'function',
  function: {
    name: 'create_trade_suggestion',
    description: '当用户明确表达交易意图时（例如买入、卖出、做多、做空），解析出所有必要的交易参数以生成一个完整的交易建议。',
    parameters: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: '交易对代码, 例如 BTC/USD, AAPL, BABA。' },
        direction: { type: 'string', enum: ['LONG', 'SHORT'], description: '交易方向。买入、做多应解析为 "LONG"；卖出、做空应解析为 "SHORT"。' },
        quantity: { type: 'number', description: '交易数量。' },
        orderType: { type: 'string', enum: ['market', 'limit'], description: '订单类型。市价单为 "market"，限价单为 "limit"。' },
        price: { type: 'number', description: '如果是限价单 (limit order)，此为指定的限价价格。' },
        leverage: { type: 'number', description: '建议使用的杠杆倍数，例如 10、20。' },
        stop_loss: { type: 'number', description: '建议的止损价格。' },
        take_profit: {
          type: 'array',
          description: '建议的止盈目标列表，可以有多个。',
          items: {
            type: 'object',
            properties: {
              price: { type: 'number', description: '止盈目标价格。' },
              portion_pct: { type: 'number', description: '在此价格止盈的仓位百分比（例如 50 表示 50%）。' }
            },
            required: ['price', 'portion_pct']
          }
        },
        summary: { type: 'string', description: '对用户交易意图的简短总结，例如 "市价买入 1 BTC"。' }
      },
      required: ['symbol', 'direction', 'quantity', 'orderType', 'summary', 'leverage', 'stop_loss', 'take_profit'],
    },
  },
};