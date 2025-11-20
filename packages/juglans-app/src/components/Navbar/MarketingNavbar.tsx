// packages/juglans-app/src/components/Navbar/MarketingNavbar.tsx
import { Component } from 'solid-js';
import { A } from '@solidjs/router';
import './MarketingNavbar.css';

const MarketingNavbar: Component = () => {
  return (
    <nav class="marketing-navbar">
      <div class="nav-left">
        <div class="nav-logo-icon">
          {/* 模拟图片中的波浪线 Logo */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12c2.5-3 5.5-3 8 0s5.5 3 8 0 5.5-3 8 0" />
          </svg>
        </div>
        <span class="nav-logo-text">Juglans</span>
      </div>
      
      <div class="nav-center">
        <a href="#" class="nav-link">What is Vibe Trading</a>
        <a href="#" class="nav-link">Products</a>
        <a href="#" class="nav-link">Company</a>
        <a href="#" class="nav-link">Learn</a>
        <a href="#" class="nav-link">Support</a>
      </div>
      
      <div class="nav-right">
        {/* 点击 Launch App 跳转到应用主页 */}
        <A href="/" class="launch-app-btn">Launch App</A>
      </div>
    </nav>
  );
};

export default MarketingNavbar;