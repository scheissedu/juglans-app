import { Component, createSignal, For, Show, onCleanup, createMemo } from 'solid-js';
import './ModelSelector.css';

export interface Model {
  id: string;
  name: string;
  provider: string;
  logo: string;
}

interface ModelSelectorProps {
  models: Model[];
  selectedModelId: string;
  onModelSelect: (modelId: string) => void;
}

const ModelSelector: Component<ModelSelectorProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  let containerRef: HTMLDivElement | undefined;

  // +++ 核心修正：使用 createMemo 明确地创建响应式派生状态 +++
  const selectedModel = createMemo(() => 
    props.models.find(m => m.id === props.selectedModelId)
  );

  const handleSelect = (model: Model) => {
    props.onModelSelect(model.id);
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
      <button class="current-model-btn action-btn" onClick={() => setIsOpen(!isOpen())}>
        {/* +++ 核心修正：直接使用我们创建的 memo +++ */}
        <Show 
          when={selectedModel()} 
          fallback={<div class="model-logo-placeholder"/>}
        >
          <img src={selectedModel()!.logo} alt={selectedModel()!.provider} class="model-logo" />
        </Show>
      </button>

      <Show when={isOpen()}>
        <div class="model-dropdown">
          <For each={props.models}>
            {(model) => (
              <div
                class="model-item"
                classList={{ selected: model.id === props.selectedModelId }}
                onClick={() => handleSelect(model)}
              >
                <img src={model.logo} alt={model.provider} class="model-logo-small" />
                <div class="model-info">
                  <span class="provider">{model.provider}</span>
                  <span class="name">{model.name}</span>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default ModelSelector;