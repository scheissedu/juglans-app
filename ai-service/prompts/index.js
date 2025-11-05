// ai-service/prompts/index.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prompts = new Map();

/**
 * 动态加载当前目录下所有的 .prompt.js 文件
 */
async function loadPrompts() {
  const files = fs.readdirSync(__dirname);
  for (const file of files) {
    if (file.endsWith('.prompt.js')) {
      try {
        const module = await import(`./${file}`);
        const prompt = module.default;
        if (prompt && prompt.name) {
          prompts.set(prompt.name, prompt);
          console.log(`[Prompt Loader] Loaded prompt: ${prompt.name}`);
        }
      } catch (e) {
        console.error(`[Prompt Loader] Error loading prompt from ${file}:`, e);
      }
    }
  }
}

/**
 * 获取一个本地化的 prompt 内容
 * @param {string} name - The name of the prompt (e.g., 'fast-model-router')
 * @param {string} locale - The desired locale (e.g., 'en-US')
 * @returns {string | null}
 */
export function getPrompt(name, locale = 'en-US') {
  const prompt = prompts.get(name);
  if (!prompt) {
    return null;
  }
  return prompt.i18n[locale] || prompt.i18n['en-US'] || Object.values(prompt.i18n)[0] || '';
}

// 立即执行加载
loadPrompts();