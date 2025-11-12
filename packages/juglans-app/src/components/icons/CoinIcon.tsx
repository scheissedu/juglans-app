// packages/juglans-app/src/components/icons/CoinIcon.tsx
import { Component } from 'solid-js';

const CoinIcon: Component<{ class?: string }> = (props) => (
  <svg class={props.class} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="8" />
    <line x1="3" y1="3" x2="21" y2="21" />
  </svg>
);

export default CoinIcon;