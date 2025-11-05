import { Component, For } from 'solid-js';
import '../MarketPage.css';

export interface DiscoverTag {
  icon: string;
  label: string;
  searchTerm: string;
}

interface DiscoverTagsProps {
  tags: DiscoverTag[];
  onTagClick: (searchTerm: string) => void;
}

const DiscoverTags: Component<DiscoverTagsProps> = (props) => {
  return (
    <div class="discover-container">
      <div class="discover-header">
        <h2>Discover investments</h2>
      </div>
      <div class="discover-tags-wrapper">
        <For each={props.tags}>
          {(tag) => (
            <button class="discover-tag" onClick={() => props.onTagClick(tag.searchTerm)}>
              <span class="discover-tag-icon">{tag.icon}</span>
              <span class="discover-tag-label">{tag.label}</span>
            </button>
          )}
        </For>
      </div>
    </div>
  );
};

export default DiscoverTags;