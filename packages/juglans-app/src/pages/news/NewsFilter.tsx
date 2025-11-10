// packages/juglans-app/src/pages/news/NewsFilter.tsx
import { Component, For } from 'solid-js';

interface NewsFilterProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

const NewsFilter: Component<NewsFilterProps> = (props) => {
  return (
    <div class="news-filter-container">
      <div class="news-filter-list">
        <For each={props.categories}>
          {(category) => (
            <button
              class="filter-chip"
              classList={{ active: props.activeCategory === category }}
              onClick={() => props.onSelectCategory(category)}
            >
              {/* 将首字母大写，使其显示更美观 */}
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          )}
        </For>
      </div>
    </div>
  );
};

export default NewsFilter;