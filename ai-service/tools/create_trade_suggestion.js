// ai-service/tools/create_trade_suggestion.js

export function getCreateTradeSuggestionTool(t) {
  return {
    type: 'function',
    function: {
      name: 'create_trade_suggestion',
      description: t.description,
      parameters: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: t.parameters.symbol },
          direction: { type: 'string', enum: ['LONG', 'SHORT'], description: t.parameters.direction },
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
          summary: { type: 'string', description: t.parameters.summary }
        },
        required: ['symbol', 'direction', 'quantity', 'orderType', 'summary', 'leverage', 'stop_loss', 'take_profit'],
      },
    },
  };
}