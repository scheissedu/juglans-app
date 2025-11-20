// packages/juglans-app/src/components/cards-p/TradeSuggestionCard/ConfidenceCircle.tsx
import { Component, createMemo } from 'solid-js';

interface ConfidenceCircleProps {
  percentage: number;
}

const ConfidenceCircle: Component<ConfidenceCircleProps> = (props) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  // 计算进度条的偏移量
  const offset = createMemo(() => circumference - (props.percentage / 100) * circumference);

  return (
    <div class="confidence-circle-container">
      <svg class="tradecard-progress-circle-svg" viewBox="0 0 44 44">
        <circle class="tradecard-progress-bg" cx="22" cy="22" r={radius} />
        <circle
          class="tradecard-progress-fg"
          cx="22"
          cy="22"
          r={radius}
          stroke-dasharray={circumference}
          stroke-dashoffset={offset()}
        />
      </svg>
      <div class="confidence-text-content">
        <span class="confidence-value">{props.percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
};

export default ConfidenceCircle;