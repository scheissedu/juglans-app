// packages/juglans-app/src/components/common/Sparkline.tsx
import { Component, createMemo, Show } from 'solid-js';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}

const Sparkline: Component<SparklineProps> = (props) => {
  const width = props.width || 100;
  const height = props.height || 30;
  const strokeWidth = props.strokeWidth || 2;
  const padding = strokeWidth; // 防止线条被裁剪

  const path = createMemo(() => {
    const data = props.data;
    if (!data || data.length < 2) return '';

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;

    // 如果所有价格都一样（一条直线），处理除以0的情况
    if (range === 0) {
      return `M0 ${height / 2} L${width} ${height / 2}`;
    }

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
      // Y轴翻转：SVG原点在左上角，而价格高点应该在上方
      const normalizedValue = (value - min) / range;
      const y = height - padding - (normalizedValue * (height - padding * 2));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M${points.join(' L')}`;
  });

  return (
    <Show when={props.data && props.data.length > 0}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} overflow="visible">
        <path
          d={path()}
          fill="none"
          stroke={props.color || 'currentColor'}
          stroke-width={strokeWidth}
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </Show>
  );
};

export default Sparkline;