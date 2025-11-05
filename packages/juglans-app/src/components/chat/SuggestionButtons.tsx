// packages/juglans-app/src/components/chat/SuggestionButtons.tsx (Corrected)

import { Component, For } from 'solid-js';

interface SuggestionButtonsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

const SuggestionButtons: Component<SuggestionButtonsProps> = (props) => {
  return (
    <div class="suggestion-buttons">
      <For each={props.suggestions}>
        {(suggestion) => (
          <button 
            class="suggestion-button"
            onClick={() => props.onSuggestionClick(suggestion)}
          >
            {suggestion}
          </button>
        )}
      </For>
    </div>
  );
};

// --- 关键修正：确保这一行存在 ---
export default SuggestionButtons;