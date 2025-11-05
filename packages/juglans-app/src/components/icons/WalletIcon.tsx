import { Component } from 'solid-js';

const WalletIcon: Component = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 12V8H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
    <path d="M4 6v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
    <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h2v-4h-2z" />
  </svg>
);

export default WalletIcon;