// packages/juglans-app/src/components/cards-p/TradeSuggestionCard/views/OptionTradeView.tsx
import { Component } from 'solid-js';
import { TradeViewProps } from './types';
import { OptionTradeSuggestion } from '../types';

const OptionTradeView: Component<TradeViewProps<OptionTradeSuggestion>> = (props) => {
  const oProps = () => props.data;
  return (
    <>
      <div class="product-identifier">OPTIONS</div>
      <div class="trade-parameters option-grid">
        <button class={`trade-direction ${oProps().direction === 'BUY' ? 'long' : 'short'}`}>
          {oProps().direction} {oProps().optionType}
        </button>
        <div class="param-item">
          <label>Strike</label>
          <div class="param-value">{oProps().strike.toLocaleString()}</div>
        </div>
        <div class="param-item">
          <label>Expiry</label>
          <div class="param-value">{oProps().expiry}</div>
        </div>
        <div class="param-item">
          <label>Quantity</label>
          <div class="param-value">{oProps().quantity} Contracts</div>
        </div>
      </div>
    </>
  );
};
export default OptionTradeView;