// packages/juglans-app/src/courses/juglans-beginners-bootcamp/lessons/02-chart-basics.lesson.tsx
import type { Lesson } from '@/courses/types';
import { CandlestickArticle } from '@/articles/what-is-a-candlestick'; // Reuse the article!

export const ChartBasicsLesson: Lesson = {
  slug: 'chart-basics',
  title: CandlestickArticle.title.en,
  type: 'article',
  duration: '5 min read',
  Component: CandlestickArticle.Component, // Use the component directly
};