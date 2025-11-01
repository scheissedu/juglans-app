// /klinecharts-workspace/ai-service/server.js

import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import cors from 'cors';
import tools from './tools/index.js'; // +++ 导入模块化的工具 +++

dotenv.config();

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(cors());

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

app.post('/api/chat', async (req, res) => {
  const { history, context, model } = req.body;

  if (!history || !Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid history in request body' });
  }

  const lastMessage = history[history.length - 1];
  const attachments = lastMessage.attachments || [];
  
  let systemContent = `你是一个专业的金融交易助手。你的主要任务是根据用户的指令执行操作。
  
行为准则:
1.  **识别交易意图**: 如果用户的消息包含明确的交易指令（如买、卖、做多、做空），你 **必须** 调用 \`create_trade_suggestion\` 工具来响应。**你必须提供所有必填参数**，包括根据市场情况给出的合理的 \`stop_loss\`、\`take_profit\` 和 \`leverage\`。不要用任何文本进行确认或提问，直接调用工具。
2.  **分析请求**: 如果用户要求进行市场分析，并且提供了K线数据或其他附件，请基于这些数据进行详细分析，并以纯文本格式回答。
3.  **一般性问题**: 对于其他一般性问题，请直接用文本回答。

`;

  if (context && context.symbol) {
    systemContent += `用户当前正在查看的图表是 **${context.symbol.ticker}**。在解析交易意图时，如果用户没有明确指定交易对，请默认使用这个。\n`;
  }

  // +++ 新增：处理 Market Context 和 My Context +++
  if (context.marketContext) {
    systemContent += `\n### 市场上下文 (Market Context)\n`;
    systemContent += `1. **Ticker信息**: ${JSON.stringify(context.symbol)}\n`;
    systemContent += `2. **最近100条K线**: ${JSON.stringify(context.klineData)}\n`;
  }
  if (context.myContext) {
    systemContent += `\n### 个人上下文 (My Context)\n`;
    systemContent += `1. **账户信息**: ${JSON.stringify(context.accountInfo)}\n`;
    systemContent += `2. **当前持仓**: ${JSON.stringify(context.positions)}\n`;
  }

  if (attachments && attachments.length > 0) {
    systemContent += '\n用户额外附加了以下数据供你分析：\n';
    attachments.forEach((att, index) => {
      if (att.type === 'kline') {
        systemContent += `- 附件${index + 1}: 一段关于 ${att.symbol} 在 ${att.period} 周期下的K线数据。数据内容: ${att.data}\n`;
      }
      if (att.type === 'position') {
        systemContent += `- 附件${index + 1}: 用户的当前持仓列表。数据内容: ${att.data}\n`;
      }
    });
  }

  const messages = history.map(msg => {
    const getTextFromContent = (content) => {
      if (!content || !content.content) return '';
      return content.content.map(node => {
        if (node.type === 'text') return node.text;
        if (node.content) return getTextFromContent(node);
        return '';
      }).join('\n');
    };

    let messageText = '';
    if (msg.text) {
        messageText = getTextFromContent(msg.text);
    }
    
    if (msg.type === 'tool_call') {
        return null;
    }

    return {
      role: msg.role,
      content: messageText,
    };
  }).filter(Boolean);


  try {
    const stream = await deepseek.chat.completions.create({
      model: model || 'deepseek-chat',
      messages: [
        { role: 'system', content: systemContent },
        ...messages
      ],
      tools: tools, // +++ 使用导入的 tools +++
      tool_choice: 'auto',
      stream: true,
    });

    let isToolCall = false;
    let toolCallChunks = [];

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      if (delta?.tool_calls) {
        isToolCall = true;
        if (chunk.choices[0].delta.tool_calls) {
          toolCallChunks = toolCallChunks.concat(JSON.parse(JSON.stringify(chunk.choices[0].delta.tool_calls)));
        }
      } else if (delta?.content && !isToolCall) {
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.setHeader('Transfer-Encoding', 'chunked');
        }
        res.write(delta.content);
      }
      
      const finishReason = chunk.choices[0]?.finish_reason;
      if (finishReason === 'tool_calls') {
        const fullToolCall = toolCallChunks.reduce((acc, chunkPart) => {
            if(!acc.function) acc.function = { name: '', arguments: '' };
            if (chunkPart.id) acc.id = chunkPart.id;
            if (chunkPart.type) acc.type = chunkPart.type;
            if (chunkPart.function) {
                if(chunkPart.function.name) acc.function.name = chunkPart.function.name;
                if(chunkPart.function.arguments) acc.function.arguments += chunkPart.function.arguments;
            }
            return acc;
        }, { function: { name: '', arguments: '' } });
        
        console.log('AI (DeepSeek) finished tool call intent:', fullToolCall.function);

        res.json({
          type: 'tool_call',
          tool_name: fullToolCall.function.name,
          tool_params: JSON.parse(fullToolCall.function.arguments),
        });
        return;
      }
    }

    if (!isToolCall && !res.headersSent) {
      res.json({ type: 'text', content: '' });
    } else if (!isToolCall) {
      res.end();
    }

  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'AI service encountered an error.' });
    } else {
      res.end();
    }
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 AI assistant server is running on http://localhost:${PORT}`);
});