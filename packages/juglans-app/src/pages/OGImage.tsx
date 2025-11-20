// src/pages/OGImage.tsx
import { Component } from 'solid-js';

const OGImage: Component = () => {
  const styles = `
    .og-image {
        width: 1200px;
        height: 630px;
        background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 80px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transform: scale(0.8); /* Scale down to fit better in the viewport */
    }
    .bg-pattern { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.03; background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, #BFFF00 2px, #BFFF00 3px), repeating-linear-gradient(90deg, transparent, transparent 2px, #BFFF00 2px, #BFFF00 3px); background-size: 60px 60px; }
    .glow-orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.15; }
    .glow-1 { width: 600px; height: 600px; background: #BFFF00; top: -200px; right: -100px; }
    .glow-2 { width: 400px; height: 400px; background: #7CFF00; bottom: -150px; left: -100px; }
    .content { position: relative; z-index: 2; }
    .logo-section { display: flex; align-items: center; gap: 16px; margin-bottom: 50px; }
    .logo-icon { width: 64px; height: 64px; background-color: #BFFF00; border-radius: 12px; display: flex; justify-content: center; align-items: center; padding: 12px; box-shadow: 0 0 40px rgba(191, 255, 0, 0.4); }
    .logo-icon svg { width: 100%; height: 100%; }
    .wavy-line { stroke: #121212; stroke-width: 3; stroke-linecap: round; fill: none; }
    .node-dot { fill: #121212; }
    .logo-text { font-family: 'Inter', sans-serif; font-size: 42px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px; }
    .badge { display: inline-flex; align-items: center; padding: 14px 28px; background: rgba(191, 255, 0, 0.08); border: 2px solid #BFFF00; border-radius: 50px; margin-bottom: 40px; backdrop-filter: blur(10px); }
    .badge-text { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 500; background: linear-gradient(135deg, #BFFF00 0%, #D4FF5C 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .badge-highlight { font-weight: 700; color: #BFFF00; }
    .main-title { font-family: 'Inter', sans-serif; font-size: 56px; font-weight: 800; color: #FFFFFF; line-height: 1.3; margin-bottom: 28px; letter-spacing: -1.5px; }
    .highlight { background: linear-gradient(135deg, #BFFF00 0%, #7CFF00 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .subtitle { font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 400; color: rgba(255, 255, 255, 0.7); line-height: 1.5; max-width: 800px; }
    .deco-line { position: absolute; bottom: 80px; right: 80px; width: 200px; height: 3px; background: linear-gradient(90deg, transparent 0%, #BFFF00 100%); border-radius: 2px; }
    .corner-accent { position: absolute; bottom: 60px; right: 60px; width: 12px; height: 12px; background: #BFFF00; border-radius: 50%; box-shadow: 0 0 20px rgba(191, 255, 0, 0.6); }
  `;
  
  return (
    <>
      <style>{styles}</style>
      <div class="og-image">
        <div class="bg-pattern"></div>
        <div class="glow-orb glow-1"></div>
        <div class="glow-orb glow-2"></div>
        <div class="content">
          <div class="logo-section">
            <div class="logo-icon">
              <svg viewBox="0 0 44 24" xmlns="http://www.w3.org/2000/svg">
                <circle class="node-dot" cx="4" cy="12" r="3"/>
                <circle class="node-dot" cx="22" cy="12" r="3"/>
                <circle class="node-dot" cx="40" cy="12" r="3"/>
                <path class="wavy-line" d="M4 12 Q 13 4, 22 12 T 40 12"/>
              </svg>
            </div>
            <span class="logo-text">Juglans</span>
          </div>
          <div class="badge">
            <span class="badge-text">The World's First <span class="badge-highlight">Vibe Trading App</span></span>
          </div>
          <h1 class="main-title">
            Empower Your Trading Decisions<br/>
            with <span class="highlight">Natural Language</span>
          </h1>
          <p class="subtitle">
            Say goodbye to complex charts. Just ask.
          </p>
        </div>
        <div class="deco-line"></div>
        <div class="corner-accent"></div>
      </div>
    </>
  );
};

export default OGImage;