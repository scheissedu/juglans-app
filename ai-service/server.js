// ai-service/server.js

import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getTools } from './tools/index.js';
import { getPrompt } from './prompts/index.js';
import { executeCommand } from './commands/index.js';

function extractTextFromTiptapJson(jsonContent) {
  if (!jsonContent || typeof jsonContent !== 'object' || !Array.isArray(jsonContent.content)) {
    return (jsonContent || '').toString();
  }
  let text = '';
  function traverse(nodes) {
    for (const node of nodes) {
      if (node.type === 'text' && node.text) {
        text += node.text;
      }
      if (node.content) {
        traverse(node.content);
      }
    }
  }
  traverse(jsonContent.content);
  return text;
}

dotenv.config();

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(cors());

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiFlash = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

function buildSystemContext(context) {
  let systemContent = '';
  if (context && context.symbol) {
    systemContent += `The user is currently viewing the chart for **${context.symbol.ticker}**. When parsing trading intents, if the user does not specify a trading pair, default to this one.\n`;
  }
  if (context.marketContext) {
    systemContent += `\n### Market Context\n`;
    systemContent += `1. **Ticker Information**: ${JSON.stringify(context.symbol)}\n`;
    systemContent += `2. **Last 100 K-line bars**: ${JSON.stringify(context.klineData)}\n`;
  }
  if (context.myContext) {
    systemContent += `\n### My Context\n`;
    systemContent += `1. **Account Information**: ${JSON.stringify(context.accountInfo)}\n`;
    systemContent += `2. **Current Positions**: ${JSON.stringify(context.positions)}\n`;
  }
  return systemContent;
}

async function callAdvancedModel(res, history, context, modelName, locale) {
  console.log(`[Advanced Model] Called. Using model: ${modelName} with locale: ${locale}`);
  
  const { advancedTools } = getTools(locale);
  
  let advancedSystemContent = getPrompt('advanced-trading-assistant', locale);
  if (context.symbol?.ticker) {
    advancedSystemContent += `\n\nYour instructions for the user are about the symbol: **${context.symbol.ticker}**.`;
  }
  advancedSystemContent += buildSystemContext(context);
  
  const messages = history.map(msg => ({ 
    role: msg.role === 'user' ? 'user' : 'assistant', 
    content: extractTextFromTiptapJson(msg.text) 
  }));

  try {
    const stream = await deepseek.chat.completions.create({
      model: modelName || 'deepseek-chat',
      messages: [
        { role: 'system', content: advancedSystemContent },
        ...messages
      ],
      tools: advancedTools,
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
        
        console.log('[Advanced Model] Finished tool call intent:', fullToolCall.function);

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
    console.error('[Advanced Model] Error calling API:', error);
    if (!res.headersSent) res.status(500).json({ error: 'AI service encountered an error.' });
    else res.end();
  }
}

async function callFastModel(res, history, context, modelName, locale) {
  console.log(`[Fast Model] Called. Using model: ${modelName} with locale: ${locale}`);
  const { basicTools } = getTools(locale);
  const fastModelSystemPrompt = getPrompt('fast-model-router', locale);
  const lastMessageText = extractTextFromTiptapJson(history[history.length - 1].text);
  
  try {
    const result = await geminiFlash.generateContent({
      contents: [{ role: 'user', parts: [{ text: lastMessageText }] }],
      tools: [{ functionDeclarations: basicTools.map(t => t.function) }],
      systemInstruction: { parts: [{ text: fastModelSystemPrompt }] },
    });
    
    const response = result.response;
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const toolName = call.name;
      const toolParams = call.args;

      console.log(`[Fast Model] Intent identified. Tool call: ${toolName}`);
      
      if (toolName === 'escalate_to_advanced_model') {
        await callAdvancedModel(res, history, context, 'deepseek-chat', locale);
      } else {
        res.json({
          type: 'tool_call',
          tool_name: toolName,
          tool_params: toolParams,
        });
      }
    } else {
      const text = response.text();
      console.log(`[Fast Model] Direct reply: ${text}`);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.write(text);
      res.end();
    }
  } catch (error) {
    console.error('[Fast Model] Error during triage:', error);
    console.log('[Fallback] Fast model failed, escalating to advanced model as a fallback.');
    await callAdvancedModel(res, history, context, 'deepseek-chat', locale);
  }
}

app.post('/api/chat', async (req, res) => {
  const { history, context, model, locale = 'en-US' } = req.body;

  if (!history || !Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid history' });
  }
  
  const lastMessageText = extractTextFromTiptapJson(history[history.length - 1].text);

  if (lastMessageText.startsWith('/')) {
    const match = lastMessageText.match(/^\/(\w+)\s*(.*)/);
    if (match) {
      const [, commandName, argsString] = match;
      console.log(`[Command Engine] Attempting to execute command: /${commandName}`);
      try {
        const commandResult = executeCommand(commandName, argsString, context);
        if (commandResult) {
          console.log('[Command Engine] Command executed, returning structured response.');
          return res.json(commandResult);
        } else {
          const unknownCommandMsg = `Unknown command: /${commandName}`;
          console.log(`[Command Engine] ${unknownCommandMsg}`);
          return res.status(200).setHeader('Content-Type', 'text/plain; charset=utf-8').end(unknownCommandMsg);
        }
      } catch (error) {
        const errorMsg = `Error: ${error.message}`;
        console.error(`[Command Engine] Error executing command: ${errorMsg}`);
        return res.status(200).setHeader('Content-Type', 'text/plain; charset=utf-8').end(errorMsg);
      }
    }
  }

  if (model === 'gemini-1.5-flash-latest') {
    await callFastModel(res, history, context, model, locale);
  } else {
    await callAdvancedModel(res, history, context, model, locale);
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 AI assistant server is running on http://localhost:${PORT}`);
});