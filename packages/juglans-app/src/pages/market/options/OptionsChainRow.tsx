// packages/juglans-app/src/pages/market/options/OptionsChainRow.tsx
import { Component, Show, For } from 'solid-js';
import type { OptionData } from '@/types';

interface OptionsChainRowProps {
  strike: number;
  call?: OptionData;
  put?: OptionData;
}

const formatPrice = (num: number | undefined) => num?.toFixed(4) ?? '--';
// --- 核心修复：为 vega 和 delta 使用不同的小数位数 ---
const formatGreek = (num: number | undefined, decimals = 4) => {
    if (num === undefined || num === null) return '--';
    return num.toFixed(decimals);
};
const formatSize = (num: number | undefined) => num?.toLocaleString() ?? '--';

const OptionsChainRow: Component<OptionsChainRowProps> = (props) => {
  return (
    <div class="options-chain-row">
      <div class="call-option-cells">
        <Show when={props.call} fallback={<For each={Array(7)}>{() => <div class="option-cell">--</div>}</For>}>
          <div class="option-cell" style="text-align: left;">{formatSize(props.call!.bidSize)}</div>
          <div class="option-cell bid-price">{formatPrice(props.call!.bid)}</div>
          <div class="option-cell">{formatPrice(props.call!.mark)}</div>
          <div class="option-cell ask-price">{formatPrice(props.call!.ask)}</div>
          <div class="option-cell">{formatSize(props.call!.askSize)}</div>
          <div class="option-cell">{formatGreek(props.call!.delta)}</div>
          <div class="option-cell">{formatGreek(props.call!.vega, 2)}</div> {/* Vega 保留两位小数 */}
        </Show>
      </div>
      
      <div class="strike-price-cell">
        {props.strike.toLocaleString()}
      </div>

      <div class="put-option-cells">
        <Show when={props.put} fallback={<For each={Array(7)}>{() => <div class="option-cell">--</div>}</For>}>
          <div class="option-cell">{formatGreek(props.put!.vega, 2)}</div> {/* Vega 保留两位小数 */}
          <div class="option-cell">{formatGreek(props.put!.delta)}</div>
          <div class="option-cell">{formatSize(props.put!.askSize)}</div>
          <div class="option-cell ask-price">{formatPrice(props.put!.ask)}</div>
          <div class="option-cell">{formatPrice(props.put!.mark)}</div>
          <div class="option-cell bid-price">{formatPrice(props.put!.bid)}</div>
          <div class="option-cell" style="text-align: left;">{formatSize(props.put!.bidSize)}</div>
        </Show>
      </div>
    </div>
  );
};

export default OptionsChainRow;