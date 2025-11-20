// packages/juglans-app/src/pages/news/NewsListItem.tsx
import { Component, Show } from 'solid-js';
import type { NewsArticle } from '@/types';

function formatDisplayDate(dateString?: string | number): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface NewsListItemProps {
  article: NewsArticle;
}

const NewsListItem: Component<NewsListItemProps> = (props) => {
  const headline = () => props.article.title || props.article.headline || 'Untitled';
  const link = () => props.article.link || props.article.url || '#';
  const source = () => props.article.creator || props.article.source || 'Unknown Source';
  const date = () => props.article.pubDate || (props.article.datetime ? new Date(props.article.datetime * 1000).toISOString() : '');
  
  // 1. 定义一条模拟的 AI 总结
  const mockSummary = "AI Summary Placeholder";

  return (
    <a 
      href={link()} 
      target="_blank" 
      rel="noopener noreferrer" 
      class="news-list-item"
    >
      <Show when={props.article.image}>
        <div class="news-card-image-wrapper">
          <img src={props.article.image} alt="" class="news-card-image" loading="lazy" />
        </div>
      </Show>
      
      <div class="news-list-item-content">
        <div class="news-list-item-meta">
          <span class="news-list-item-source">{source()}</span>
          <span>•</span>
          <span class="news-list-item-time">{formatDisplayDate(date())}</span>
        </div>
        <h3 class="news-list-item-headline">{headline()}</h3>

        {/* 2. 添加 AI 总结的气泡 */}
        {/* TODO: 之后将 'true' 替换为 'props.article.aiSummary' */}
        <Show when={true}>
          <div class="ai-summary-bubble">
            <img src="/deepseek.png" alt="AI" class="ai-summary-logo" />
            <p class="ai-summary-text">{mockSummary}</p>
          </div>
        </Show>
      </div>
    </a>
  );
};

export default NewsListItem;