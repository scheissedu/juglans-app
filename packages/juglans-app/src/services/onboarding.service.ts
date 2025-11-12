// packages/juglans-app/src/services/onboarding.service.ts
import introJs from 'intro.js';
import 'intro.js/introjs.css';
import './onboarding.css'; // 我们将创建自定义样式

const ONBOARDING_COMPLETED_KEY = 'juglans_onboarding_completed';

/**
 * 检查用户是否已完成 Onboarding 教程
 */
export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
}

/**
 * 标记 Onboarding 教程为已完成
 */
function completeOnboarding() {
  localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
}

/**
 * 启动 Onboarding 教程
 */
export function startOnboarding() {
  const intro = introJs();

  intro.setOptions({
    steps: [
      {
        title: 'Welcome to Juglans!',
        intro: "Ready for a quick tour to master the basics? It'll only take a minute.",
      },
      {
        element: document.querySelector('.chart-page-wrapper') as HTMLElement,
        title: 'The Chart Area',
        intro: 'This is your main chart. You can pan by dragging and zoom with your mouse wheel.',
        position: 'right',
      },
      {
        element: document.querySelector('.klinecharts-pro-period-bar .symbol') as HTMLElement,
        title: 'Switch Assets',
        intro: 'Click here to search for and switch between different assets, like stocks or other cryptos.',
        position: 'bottom',
      },
      {
        element: document.querySelector('.chat-area-wrapper') as HTMLElement,
        title: 'Your AI Assistant',
        intro: 'This is your AI copilot. Ask it anything! Try typing a command like <b>"Analyze BTC-USDT"</b>.',
        position: 'top',
      },
      {
        element: document.querySelector('.klinecharts-pro-bottom-bar') as HTMLElement,
        title: 'Account Manager',
        intro: 'After you trade, you can view your open positions, orders, and account details here.',
        position: 'top',
      },
      {
        title: "You're All Set!",
        intro: "You've learned the basics. Now you can explore on your own or visit our upcoming Tutorial Center for more courses.",
      },
    ],
    // 自定义样式和按钮
    showBullets: false,
    showProgress: true,
    nextLabel: 'Next →',
    prevLabel: '← Back',
    doneLabel: 'Done',
    tooltipClass: 'juglans-tooltip',
    highlightClass: 'juglans-highlight',
  });

  intro.oncomplete(completeOnboarding);
  intro.onexit(completeOnboarding); // 如果用户中途退出，也标记为完成，避免下次骚扰

  intro.start();
}