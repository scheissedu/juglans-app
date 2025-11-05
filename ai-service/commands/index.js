// ai-service/commands/index.js

import { getTools } from '../tools/index.js';
import { exposedCommands } from './command-config.js';
import { pages } from '../tools/page-config.js';

const commandRegistry = new Map();

/**
 * Finds the canonical page name from an alias.
 * @param {string} pageAlias - The page name or alias provided by the user.
 * @returns {string|null} The canonical page name or null if not found.
 */
function resolvePageAlias(pageAlias) {
  const lowerAlias = pageAlias.toLowerCase();
  for (const pageName in pages) {
    if (pageName === lowerAlias || pages[pageName].aliases.map(a => a.toLowerCase()).includes(lowerAlias)) {
      return pageName;
    }
  }
  return null;
}

/**
 * Initializes the command registry based on exposed commands config.
 */
function initializeCommands() {
  const { basicTools } = getTools('en-US');
  const toolsMap = new Map(basicTools.map(tool => [tool.function.name, tool]));

  for (const [commandAlias, toolName] of Object.entries(exposedCommands)) {
    const tool = toolsMap.get(toolName);

    // Handler now accepts context
    const handler = (argsString, context) => {
      const args = argsString.trim().split(/\s+/).filter(arg => arg);

      switch (toolName || commandAlias) {
        case 'navigate_to_page':
          if (args.length === 1) {
            const pageName = resolvePageAlias(args[0]);
            if (pageName) {
              return {
                type: 'tool_call',
                tool_name: 'navigate_to_page',
                tool_params: { page: pageName },
              };
            } else {
              throw new Error(`Invalid page "${args[0]}". Valid pages are: ${Object.keys(pages).join(', ')}.`);
            }
          } else {
            throw new Error(`Invalid arguments. Usage: /${commandAlias} <page>`);
          }

        case 'generate_card':
          if (args.length === 0) {
            throw new Error('Missing card type. Usage: /card <card_type>');
          }
          const cardType = args[0];
          switch (cardType) {
            case 'my_positions':
              if (context?.myContext && Array.isArray(context.positions)) {
                return {
                  type: 'card_response',
                  card_type: 'my_positions',
                  card_data: context.positions,
                };
              } else {
                throw new Error('My Context (positions) is not available or invalid.');
              }
            default:
              throw new Error(`Unknown card type "${cardType}".`);
          }
        
        default:
          throw new Error(`Parser for command '${commandAlias}' is not implemented.`);
      }
    };
    commandRegistry.set(commandAlias, handler);
    console.log(`[Command Engine] Registered command: /${commandAlias}`);
  }
}

// Initialize on module load
initializeCommands();

/**
 * Executes a registered command.
 * @param {string} commandAlias - The user-typed command name (without '/').
 * @param {string} argsString - The arguments string.
 * @param {object} context - The context object from the frontend.
 * @returns {object|null} A structured response object or null if command not found.
 */
export function executeCommand(commandAlias, argsString, context) {
  const handler = commandRegistry.get(commandAlias);
  if (handler) {
    try {
      return handler(argsString, context);
    } catch (error) {
      throw error;
    }
  }
  return null;
}