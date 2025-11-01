// /klinecharts-workspace/packages/preview/src/ModelSelector.tsx

import { Component, createSignal, For, Show, onCleanup } from 'solid-js';
import './ModelSelector.css';

// +++ MODIFIED: Added 'logo' property +++
export interface Model {
  id: string;
  name: string;
  provider: string;
  logo: string;
}

interface ModelSelectorProps {
  models: Model[];
  selectedModel: Model;
  onModelSelect: (model: Model) => void;
}

const ModelSelector: Component<ModelSelectorProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  let containerRef: HTMLDivElement | undefined;

  const handleSelect = (model: Model) => {
    props.onModelSelect(model);
    setIsOpen(false);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (containerRef && !containerRef.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  document.addEventListener('click', handleClickOutside, true);
  onCleanup(() => document.removeEventListener('click', handleClickOutside, true));

  return (
    <div class="model-selector" ref={containerRef}>
      <button class="current-model" onClick={() => setIsOpen(!isOpen())}>
        {/* +++ MODIFIED: Replaced text with logo image +++ */}
        <img 
          src={props.selectedModel.logo} 
          alt={props.selectedModel.provider} 
          class="provider-logo"
        />
        <div class="model-name">{props.selectedModel.name}</div>
        <svg class={`arrow ${isOpen() ? 'open' : ''}`} viewBox="0 0 8 6"><path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1.5"/></svg>
      </button>
      <Show when={isOpen()}>
        <div class="model-dropdown">
          <For each={props.models}>
            {(model) => (
              <div
                class="model-item"
                classList={{ selected: model.id === props.selectedModel.id }}
                onClick={() => handleSelect(model)}
              >
                <span class="provider">{model.provider}</span>
                <span class="name">{model.name}</span>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default ModelSelector;