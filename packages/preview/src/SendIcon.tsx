// /klinecharts-workspace/packages/preview/src/SendIcon.tsx

import { Component } from 'solid-js';

const SendIcon: Component = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    // 将 stroke="currentColor" 改为 CSS 变量
    // 但在这个场景下，父按钮的 color 已经是 #fff，所以保持 currentColor 也可以
    stroke="currentColor" 
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export default SendIcon;