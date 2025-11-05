// ai-service/i18n/en-US.js
export const enUS = {
  languageName: 'English',
  tools: {
    create_trade_suggestion: {
      description: 'Parses all necessary trading parameters to generate a complete trade suggestion when the user clearly expresses a trading intent (e.g., buy, sell, long, short).',
      parameters: {
        symbol: 'The trading pair code, e.g., BTC/USD, AAPL, BABA.',
        direction: 'Trading direction. "buy", "long" should be parsed as "LONG"; "sell", "short" as "SHORT".',
        summary: 'A brief summary of the user\'s trading intent, e.g., "Market buy 1 BTC".'
      }
    },
    escalate_to_advanced_model: {
      description: 'Must be called when the user\'s request requires in-depth analysis, market opinion, complex reasoning, or any task beyond simple commands, to delegate the task to an advanced model.',
      parameters: {
        reason: 'Briefly explain why it is being escalated to the advanced model, e.g., "User requested market analysis" or "User\'s question is complex".',
        user_request: 'The user\'s original, unmodified, full request text.'
      }
    },
    navigate_to_page: {
      description: 'Called when the user wants to navigate to different pages of the application.',
      parameters: {
        page: 'The name of the target page, e.g., "market", "wallet", "chart".'
      }
    }
  }
};