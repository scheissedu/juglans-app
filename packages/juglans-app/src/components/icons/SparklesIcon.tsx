// packages/juglans-app/src/components/icons/SparklesIcon.tsx
import { Component } from 'solid-js';

const SparklesIcon: Component<{ class?: string }> = (props) => (
  <svg class={props.class} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 3 L14 8 L19 9 L15 13 L16 18 L12 15 L8 18 L9 13 L5 9 L10 8 z"/>
  </svg>
);
export default SparklesIcon;