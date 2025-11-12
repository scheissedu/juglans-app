// packages/juglans-app/src/components/icons/AlienIcon.tsx
import { Component } from 'solid-js';
const AlienIcon: Component<{ class?: string }> = (props) => (
    <svg class={props.class} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a8 8 0 0 0-8 8c0 4.418 3.582 8 8 8s8-3.582 8-8a8 8 0 0 0-8-8z" />
        <path d="M7 12c0 2.76 2.24 5 5 5s5-2.24 5-5" />
        <circle cx="8.5" cy="11.5" r="1.5" fill="currentColor" />
        <circle cx="15.5" cy="11.5" r="1.5" fill="currentColor" />
    </svg>
);
export default AlienIcon;