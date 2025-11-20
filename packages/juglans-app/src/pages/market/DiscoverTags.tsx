// packages/juglans-app/src/pages/market/DiscoverTags.tsx
import { Component, For, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import '../MarketPage.css';

export interface DiscoverTag {
  label: string;
  searchTerm: string;
  icon?: Component<any>;
  iconProps?: object;
}

interface DiscoverTagsProps {
  tags: DiscoverTag[] | undefined;
  activeTag: string;
  onTagClick: (searchTerm: string) => void;
  title?: string;
  variant?: 'primary' | 'secondary';
}

const DiscoverTags: Component<DiscoverTagsProps> = (props) => {
  const variantClass = () => props.variant === 'primary' ? 'variant-primary' : 'variant-secondary';

  return (
    <Show when={props.tags && props.tags.length > 0}>
      <div class="discover-container" classList={{ [variantClass()]: true }}>
        <Show when={props.title}>
          <h3 class="discover-section-title">{props.title}</h3>
        </Show>
        <div class="discover-tags-wrapper">
          <For each={props.tags}>
            {(tag) => (
              <button 
                class="discover-tag"
                classList={{ active: props.activeTag === tag.searchTerm }}
                onClick={() => props.onTagClick(tag.searchTerm)}
              >
                <Show when={tag.icon}>
                  <span class="discover-tag-icon-wrapper">
                    <Dynamic 
                      component={tag.icon!} 
                      class="discover-tag-icon-svg" 
                      {...tag.iconProps} 
                    />
                  </span>
                </Show>
                <span class="discover-tag-label">{tag.label}</span>
              </button>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
};

export default DiscoverTags;