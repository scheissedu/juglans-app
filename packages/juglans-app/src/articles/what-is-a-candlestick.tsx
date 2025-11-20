// packages/juglans-app/src/articles/what-is-a-candlestick.tsx
import { Component } from 'solid-js';
import type { Article } from './types';
import InlineSvg from '@/components/common/InlineSvg';

const ArticleComponent: Component = () => {
  return (
    <>
      <p>
        A candlestick chart is a type of financial chart for tracking the movement of securities. It has its origins in the Japanese rice trade and is now a cornerstone of modern technical analysis.
      </p>
      
      <InlineSvg src="/svgs/stock-prices.svg" class="article-hero-svg" />

      <h2>The Four Key Prices</h2>
      <p>
        Each candlestick represents a specific time period (e.g., one day, one hour) and displays four key pieces of information:
      </p>
      <ul>
        <li><strong>Open:</strong> The price at the beginning of the period.</li>
        <li><strong>High:</strong> The highest price reached during the period.</li>
        <li><strong>Low:</strong> The lowest price reached during the period.</li>
        <li><strong>Close:</strong> The price at the end of the period.</li>
      </ul>

      <h2>Reading the Colors</h2>
      <p>
        The color of the candlestick's body tells you about the price direction during that period. In Juglans:
      </p>
      <ul>
        <li>A <strong style="color: var(--primary-highlight)">Green/Lime</strong> candle means the price closed higher than it opened (a bullish period).</li>
        <li>A <strong style="color: #F92855">Red</strong> candle means the price closed lower than it opened (a bearish period).</li>
      </ul>
      <p>
        The "wicks" or "shadows" (the thin lines extending from the body) show the full range between the high and low prices.
      </p>
    </>
  );
};

export const CandlestickArticle: Article = {
  slug: 'what-is-a-candlestick',
  title: {
    en: 'What is a Candlestick?',
    zh: '什么是K线？',
  },
  description: {
    en: 'Learn to read the most fundamental chart type in trading. Understand open, high, low, and close.',
    zh: '学习解读交易中最基础的图表类型。理解开盘价、最高价、最低价和收盘价。',
  },
  image: '/svgs/stock-prices.svg',
  category: ['basic', 'crypto', 'stocks'],
  Component: ArticleComponent,
};