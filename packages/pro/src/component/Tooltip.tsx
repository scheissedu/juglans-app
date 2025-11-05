import { Component, JSX, createSignal } from 'solid-js';
import { Portal } from 'solid-js/web';
import './Tooltip.css';

interface TooltipProps {
  content: JSX.Element;
  children: JSX.Element;
}

const Tooltip: Component<TooltipProps> = (props) => {
  const [visible, setVisible] = createSignal(false);
  const [position, setPosition] = createSignal({ top: 0, left: 0 });
  let triggerRef: HTMLDivElement | undefined;

  const showTooltip = () => {
    if (triggerRef) {
      const rect = triggerRef.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
      setVisible(true);
    }
  };

  const hideTooltip = () => setVisible(false);

  return (
    <div ref={triggerRef} onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
      {props.children}
      <Show when={visible()}>
        <Portal>
          <div 
            class="klinecharts-pro-tooltip"
            style={{
              top: `${position().top}px`,
              left: `${position().left}px`,
            }}
          >
            {props.content}
          </div>
        </Portal>
      </Show>
    </div>
  );
};

export default Tooltip;