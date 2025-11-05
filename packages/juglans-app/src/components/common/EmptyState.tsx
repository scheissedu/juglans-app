import { Component } from 'solid-js';
import './EmptyState.css';

interface EmptyStateProps {
  message: string;
}

const EmptyState: Component<EmptyStateProps> = (props) => {
  return (
    <div class="empty-state-container">
      <div class="empty-state-icon">
        <svg viewBox="0 0 24 24"><path d="M20 6.25A3.75 3.75 0 0016.25 2.5H7.75A3.75 3.75 0 004 6.25v11.5A3.75 3.75 0 007.75 21.5h8.5A3.75 3.75 0 0020 17.75V6.25zm-2.5 0a1.25 1.25 0 011.25 1.25v.25H6.5V7.5A1.25 1.25 0 017.75 6.25h8.5zm0 11.5a1.25 1.25 0 01-1.25 1.25h-8.5a1.25 1.25 0 01-1.25-1.25V10h11v7.75z"></path><path d="M12.625 13.375h-1.25v-1.25a.625.625 0 10-1.25 0v1.25H8.875a.625.625 0 100 1.25h1.25v1.25a.625.625 0 101.25 0v-1.25h1.25a.625.625 0 100-1.25z"></path></svg>
      </div>
      <p class="empty-state-message">{props.message}</p>
      <p class="empty-state-sub-message">Get started by making a trade or depositing assets.</p>
    </div>
  );
};

export default EmptyState;