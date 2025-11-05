import { Component } from 'solid-js';

// 1. 定义 props 类型，允许接收一个可选的 class 字符串
interface IconProps {
  class?: string;
}

const RefreshIcon: Component<IconProps> = (props) => (
  // 2. 将 props.class 应用到 <svg> 元素上
  <svg 
    class={props.class} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    stroke-width="2" 
    stroke-linecap="round" 
    stroke-linejoin="round"
  >
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L20.5 10" />
    <path d="M20.49 15a9 9 0 01-14.85 3.36L3.5 14" />
  </svg>
);

export default RefreshIcon;