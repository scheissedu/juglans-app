// /klinecharts-workspace/packages/pro/src/component/resizer/index.tsx

import { Component, JSX } from 'solid-js';

export interface ResizerProps {
  class?: string;
  style?: JSX.CSSProperties | string;
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
}

const Resizer: Component<ResizerProps> = (props) => {
  const handlePointerDown = (downEvent: PointerEvent) => {
    downEvent.preventDefault();
    downEvent.stopPropagation();
    
    (downEvent.target as HTMLElement).setPointerCapture(downEvent.pointerId);

    // +++ 核心修改：引入 lastPos 来追踪上一次的位置 +++
    let lastPos = props.direction === 'horizontal' ? downEvent.clientY : downEvent.clientX;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const currentPos = props.direction === 'horizontal' ? moveEvent.clientY : moveEvent.clientX;
      // +++ 核心修改：计算增量偏移 (delta) +++
      const delta = currentPos - lastPos;
      
      // 发送增量偏移
      props.onResize(delta);

      // +++ 核心修改：更新上一次的位置 +++
      lastPos = currentPos;
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      (upEvent.target as HTMLElement).releasePointerCapture(upEvent.pointerId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      class={`klinecharts-pro-resizer ${props.direction} ${props.class ?? ''}`}
      style={props.style}
      onPointerDown={handlePointerDown}
    />
  );
};

export default Resizer;