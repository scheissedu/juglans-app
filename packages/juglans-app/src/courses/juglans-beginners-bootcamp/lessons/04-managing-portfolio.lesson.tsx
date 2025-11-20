// packages/juglans-app/src/courses/juglans-beginners-bootcamp/lessons/04-managing-portfolio.lesson.tsx
import { Component } from 'solid-js';
import type { Lesson } from '@/courses/types';

const Content: Component = () => (
  <>
    <p>The Wallet page is your central hub for managing your mock portfolio. It gives you a complete overview of your assets and trading performance.</p>
    <h2>Key Sections</h2>
    <ul>
      <li><strong>Total Balance:</strong> A summary of your total account equity and its change over time.</li>
      <li><strong>Assets Tab:</strong> A detailed list of all the assets you hold, including their current quantity and USD value.</li>
      <li><strong>Positions Tab:</strong> Shows all your currently open leveraged positions, including entry price, quantity, and unrealized profit or loss (P/L).</li>
    </ul>
    <h2>Funding Your Account</h2>
    <p>Since this is a demo environment, you can add funds at any time. Navigate to the Wallet page and click the <strong>+ Mock Deposit</strong> button to add a variety of test assets to your account instantly.</p>
  </>
);

export const ManagingPortfolioLesson: Lesson = {
  slug: 'managing-portfolio',
  title: 'Managing Your Mock Portfolio',
  type: 'article',
  duration: '4 min read',
  Component: Content,
};