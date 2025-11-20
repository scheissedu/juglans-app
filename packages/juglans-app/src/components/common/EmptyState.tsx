// packages/juglans-app/src/components/common/EmptyState.tsx
import { Component } from 'solid-js';
import './EmptyState.css'; // 我们将为它创建一个简单的 CSS 文件

interface EmptyStateProps {
  message: string;
  subMessage?: string;
}

const EmptyState: Component<EmptyStateProps> = (props) => {
  return (
    <div class="empty-state-container">
      <div class="empty-state-icon">
        {/* 一个简单的盒子图标 */}
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 6.25A3.75 3.75 0 0016.25 2.5H7.75A3.75 3.75 0 004 6.25v11.5A3.75 3.75 0 007.75 21.5h8.5A3.75 3.75 0 0020 17.75V6.25zm-2.5 0a1.25 1.25 0 011.25 1.25v.25H6.5V7.5A1.25 1.25 0 017.75 6.25h8.5zm0 11.5a1.25 1.25 0 01-1.25 1.25h-8.5a1.25 1.25 0 01-1.25-1.25V10h11v7.75z" />
        </svg>
      </div>
      <p class="empty-state-message">{props.message}</p>
      {props.subMessage && <p class="empty-state-sub-message">{props.subMessage}</p>}
    </div>
  );
};

export default EmptyState;