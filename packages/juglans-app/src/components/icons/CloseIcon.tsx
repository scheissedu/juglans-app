// packages/juglans-app/src/components/icons/CloseIcon.tsx
import { Component } from 'solid-js';

// --- 核心修正：添加 props 类型并应用 class ---
const CloseIcon: Component<{ class?: string }> = (props) => (
  <svg 
    class={props.class} // 应用传递进来的 class
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    stroke-width="2" 
    stroke-linecap="round" 
    stroke-linejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default CloseIcon;