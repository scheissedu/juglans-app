// packages/juglans-app/src/components/cards-p/TradeSuggestionCard/views/PredictionTradeView.tsx
import { Component } from 'solid-js';
import { TradeViewProps } from './types';
import { PredictionTradeSuggestion } from '../types';

const PredictionTradeView: Component<TradeViewProps<PredictionTradeSuggestion>> = (props) => {
  const pProps = () => props.data;
  return (
    <>
      <div class="product-identifier">PREDICTION MARKET</div>
       <div class="trade-parameters prediction-grid">
          <button class={`trade-direction ${pProps().direction === 'BUY' ? 'long' : 'short'}`}>
            {pProps().direction} {pProps().outcome}
          </button>
          <div class="param-item">
            <label>Price/Chance</label>
            <div class="param-value">{(pProps().price * 100).toFixed(0)}¢</div>
          </div>
          <div class="param-item">
            <label>Quantity</label>
            <div class="param-value">{pProps().quantity} Shares</div>
          </div>
       </div>
    </>
  );
};
export default PredictionTradeView;