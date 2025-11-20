// packages/juglans-app/src/articles/index.ts
import type { Article } from './types';
import { CandlestickArticle } from './what-is-a-candlestick';
// To add a new article, import it here...
// import { MyNewArticle } from './my-new-article';

// We use a Map for efficient lookup by slug
export const articles = new Map<string, Article>([
  [CandlestickArticle.slug, CandlestickArticle],
  // ...and add it to the map here.
  // [MyNewArticle.slug, MyNewArticle],
]);