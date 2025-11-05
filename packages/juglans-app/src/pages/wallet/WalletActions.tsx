import { Component } from 'solid-js';
import './Wallet.css';

interface WalletActionsProps {
  onSendClick: () => void;
  onReceiveClick: () => void;
}

const WalletActions: Component<WalletActionsProps> = (props) => {
  return (
    <div class="wallet-actions-container">
      <button class="wallet-action-btn send" onClick={props.onSendClick}>
        <svg viewBox="0 0 24 24"><path d="M13 19V7.83l4.88 4.88c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L12.7 4.7a.996.996 0 00-1.41 0L4.7 11.3c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L11 7.83V19c0 .55.45 1 1 1s1-.45 1-1z"/></svg>
        <span>Send</span>
      </button>
      <button class="wallet-action-btn receive" onClick={props.onReceiveClick}>
        <svg viewBox="0 0 24 24"><path d="M11 5v11.17l-4.88-4.88c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0l6.59-6.59c.39-.39.39-1.02 0-1.41a.996.996 0 00-1.41 0L13 16.17V5c0-.55-.45-1-1-1s-1 .45-1 1z"/></svg>
        <span>Receive</span>
      </button>
    </div>
  );
};

export default WalletActions;