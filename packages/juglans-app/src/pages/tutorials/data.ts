// packages/juglans-app/src/pages/tutorials/data.ts

// --- 类型定义 ---
export type TipCategory = 'basic' | 'crypto' | 'stocks' | 'predict';

export interface TutorialTip {
  slug: string; // Changed from id to slug for URL routing
  title: string;
  description: string;
  image: string;
  category: TipCategory[];
}

// NOTE: Course, Unit, and Lesson types have been moved to src/courses/types.ts

// --- 模拟数据 ---

export const quickTipsData: TutorialTip[] = [
  {
    slug: 'what-is-a-candlestick',
    title: 'What is a Candlestick?',
    description: 'Learn to read the most fundamental chart type in trading. Understand open, high, low, and close.',
    image: '/svgs/stock-prices.svg',
    category: ['basic', 'crypto', 'stocks'],
  },
  {
    slug: 'how-to-use-ai-assistant',
    title: 'How to use the AI Assistant?',
    description: 'Master your AI copilot. Learn about commands, context, and how to get the best analysis.',
    image: '/svgs/artificial-intelligence.svg',
    category: ['basic'],
  },
  {
    slug: 'drawing-a-trend-line',
    title: 'Drawing a Trend Line',
    description: 'A step-by-step guide to identifying and drawing effective trend lines on your chart.',
    image: '/svgs/growth-curve.svg',
    category: ['basic', 'stocks'],
  },
  {
    slug: 'understanding-macd',
    title: 'Understanding MACD',
    description: 'Dive into one of the most popular momentum indicators to spot trend changes.',
    image: '/svgs/detailed-analysis.svg',
    category: ['crypto', 'stocks'],
  },
];

// The old 'coursesData' array has been removed from this file.