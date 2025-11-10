// packages/juglans-app/src/pages/news/NewsList.tsx
import { Component, For, Show } from 'solid-js';
import type { NewsArticle } from '@/types';
import NewsListItem from './NewsListItem';
import { Loading, Empty } from '@klinecharts/pro';

interface NewsListProps {
  articles: NewsArticle[] | undefined;
  loading: boolean;
}

const NewsList: Component<NewsListProps> = (props) => {
  return (
    <Show when={!props.loading} fallback={<Loading />}>
      <Show when={props.articles && props.articles.length > 0} fallback={<Empty />}>
        <div class="news-list-container">
          <For each={props.articles}>
            {(article) => <NewsListItem article={article} />}
          </For>
        </div>
      </Show>
    </Show>
  );
};

export default NewsList;