// packages/juglans-app/src/components/icons/OptionsIcon.tsx
import { Component } from 'solid-js';

const OptionsIcon: Component<{ class?: string }> = (props) => (
  <svg class={props.class} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
    <path d="M12 18v-6" />
  </svg>
);

export default OptionsIcon;