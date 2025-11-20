import { Component, onMount, onCleanup } from 'solid-js';

// 声明全局 Turnstile 类型
declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
      }) => string | undefined;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
}

const TurnstileWidget: Component<TurnstileProps> = (props) => {
  let turnstileContainer: HTMLDivElement | undefined;
  let widgetId: string | undefined;

  onMount(() => {
    // 使用轮询来安全地等待 Turnstile 脚本加载
    const intervalId = setInterval(() => {
      if (turnstileContainer && window.turnstile) {
        clearInterval(intervalId); // 脚本已加载，停止轮询
        try {
          // 使用显式渲染方法
          widgetId = window.turnstile.render(turnstileContainer, {
            sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
            callback: (token: string) => {
              console.log("[TurnstileWidget] Success callback triggered.");
              props.onSuccess(token);
            },
            'expired-callback': () => {
              console.log("[TurnstileWidget] Token expired.");
              props.onSuccess(''); // 传递空 token 表示已过期
            },
            'error-callback': () => {
              console.error("[TurnstileWidget] Widget error callback triggered.");
              props.onError?.();
            },
          });
        } catch (e) {
          console.error("[TurnstileWidget] Failed to render widget:", e);
          props.onError?.();
        }
      }
    }, 100); // 每 100ms 检查一次

    // 在组件卸载时进行清理
    onCleanup(() => {
      clearInterval(intervalId);
      // 如果小部件已渲染，调用官方的清理函数
      if (widgetId && window.turnstile?.remove) {
        console.log(`[TurnstileWidget] Cleaning up widget: ${widgetId}`);
        window.turnstile.remove(widgetId);
      }
    });
  });

  // 返回一个简单的 div 作为 Turnstile 小部件的挂载点
  return <div ref={turnstileContainer} />;
};

export default TurnstileWidget;