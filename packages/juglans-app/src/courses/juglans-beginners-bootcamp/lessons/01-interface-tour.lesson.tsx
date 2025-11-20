// packages/juglans-app/src/courses/juglans-beginners-bootcamp/lessons/01-interface-tour.lesson.tsx
import { Component } from 'solid-js';
import type { Lesson } from '@/courses/types';

const Content: Component = () => (
  <>
    <p>Welcome to Juglans! Let's get you familiar with the main areas of the application. Understanding the layout is the first step to mastering your trading analysis.</p>
    <h2>The Main Layout</h2>
    <ul>
      <li><strong>Chart Area:</strong> This is the large central part of your screen where the financial chart is displayed. All your analysis happens here.</li>
      <li><strong>AI Assistant:</strong> Located on the right side, this is your AI-powered copilot for trading. You can ask it questions, give it commands, and get instant analysis.</li>
      <li><strong>Top Navigation Bar:</strong> At the top, you can switch between Chart Modes (Light/Pro), select different exchanges, and access your profile.</li>
      <li><strong>Main Sidebar:</strong> Access all major pages like Market, Wallet, and News by clicking the grid icon in the top-left corner.</li>
    </ul>
    <p>Spend a moment clicking around these areas to see how they work. In the next lessons, we'll dive deeper into each one.</p>
  </>
);

export const InterfaceTourLesson: Lesson = {
  slug: 'interface-tour',
  title: 'Tour of the Interface',
  type: 'article',
  duration: '3 min read',
  Component: Content,
};