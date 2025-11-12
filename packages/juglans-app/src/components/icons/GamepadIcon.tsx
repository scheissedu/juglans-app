// packages/juglans-app/src/components/icons/GamepadIcon.tsx
import { Component } from 'solid-js';
const GamepadIcon: Component<{ class?: string }> = (props) => (
    <svg class={props.class} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 12h4m-2-2v4" />
        <path d="M15 13h-2v-2" />
        <path d="M18 10h-2v-2" />
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z" />
    </svg>
);
export default GamepadIcon;