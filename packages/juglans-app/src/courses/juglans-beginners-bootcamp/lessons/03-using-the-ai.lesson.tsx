// packages/juglans-app/src/courses/juglans-beginners-bootcamp/lessons/03-using-the-ai.lesson.tsx
import { Component } from 'solid-js';
import type { Lesson } from '@/courses/types';

const Content: Component = () => (
  <>
    <p>Your AI Assistant is designed to be your trading copilot. You can interact with it using natural language or special commands.</p>
    <h2>Asking Questions</h2>
    <p>Simply type a question into the chat box, like "What's the current trend for BTC?" or "Analyze the recent volume." The AI will use the chart context to give you an informed answer.</p>
    <h2>Using Commands</h2>
    <p>For faster actions, use the <code>@</code> symbol to bring up a list of available commands. This is useful for attaching data to your message.</p>
    <ul>
      <li>Try typing <code>@Recent 100 Bars</code> to attach the latest K-line data to your prompt.</li>
      <li>Use <code>@My Positions</code> to ask the AI about your current open trades.</li>
    </ul>
    <p>The AI can also proactively give you trade suggestions in the form of interactive cards. You can adjust the parameters and execute trades directly from the chat.</p>
  </>
);

export const UsingAILesson: Lesson = {
  slug: 'using-the-ai',
  title: 'Using the AI Assistant',
  type: 'article',
  duration: '7 min read',
  Component: Content,
};