// packages/juglans-app/src/pages/ArticlePage.tsx
import { Component, createMemo, Show } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import { Dynamic } from 'solid-js/web';
import { articles } from '@/articles'; // Import our article registry
import './ArticlePage.css'; // We'll create this file next

const ArticlePage: Component = () => {
  const params = useParams();
  // For now, we hardcode the language. This could come from a global context.
  const lang = 'en'; 

  const article = createMemo(() => {
    return articles.get(params.slug);
  });

  return (
    <div class="article-page-container">
      <Show when={article()} fallback={<div class="article-not-found">Article not found.</div>}>
        {(art) => (
          <article class="article-content">
            <nav class="article-breadcrumb">
              <A href="/tutorials">Tutorials</A>
              <span>&nbsp;/&nbsp;</span>
              <span>Quick Tips</span>
            </nav>
            <h1 class="article-title">{art().title[lang]}</h1>
            <p class="article-description">{art().description[lang]}</p>
            <div class="article-divider" />
            <div class="article-body">
              <Dynamic component={art().Component} />
            </div>
          </article>
        )}
      </Show>
    </div>
  );
};

export default ArticlePage;