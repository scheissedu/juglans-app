// packages/juglans-app/src/components/cards-p/TradeSuggestionCard/TradeSuggestionDetailView.tsx
import { Component, createMemo, createEffect, createSignal, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Dynamic } from 'solid-js/web';
import { CardComponentProps } from '../types';
import { TradeSuggestionData, FuturesTradeSuggestion, LocalTradeState, OrderParams, OrderSide } from './types';
import { useAppContext } from '@/context/AppContext';
import TradeConfirmModal from './TradeConfirmModal';
import AITrendingUpIcon from '@/components/icons/AITrendingUpIcon';
import ConfidenceCircle from './ConfidenceCircle';
// 导入新的子视图
import FuturesTradeView from './views/FuturesTradeView';
import OptionTradeView from './views/OptionTradeView';
import PredictionTradeView from './views/PredictionTradeView';
import './styles/TradeSuggestionCard.css';

// 创建视图注册表
const viewRegistry = {
  FUTURES: FuturesTradeView,
  OPTION: OptionTradeView,
  PREDICTION: PredictionTradeView,
};

const TradeSuggestionDetailView: Component<CardComponentProps<TradeSuggestionData>> = (props) => {
  const [appState] = useAppContext();
  const [isPreviewing, setIsPreviewing] = createSignal(true);
  const [confirmModalVisible, setConfirmModalVisible] = createSignal(false);

  const [trade, setTrade] = createStore<LocalTradeState>({
    marketType: null,
    status: 'SUGGESTED',
    orderType: 'market',
    size: 0,
    sizeUnit: 'BASE',
    takeProfits: [],
    isAdvancedOpen: false,
    reduceOnly: false,
  });

  createEffect(() => {
    const suggestion = props.node.attrs.data;
    if (!suggestion) return;

    if (suggestion.marketType === 'FUTURES') {
      const fut = suggestion as FuturesTradeSuggestion;
      setTrade({
        marketType: 'FUTURES',
        status: 'SUGGESTED',
        direction: fut.direction === 'LONG' ? 'buy' : 'sell',
        orderType: fut.orderType ?? 'market',
        size: fut.quantity ?? 0,
        sizeUnit: 'BASE',
        price: fut.entry_price,
        triggerPrice: undefined,
        leverage: fut.leverage,
        marginMode: 'ISOLATED',
        stopLoss: fut.stop_loss,
        takeProfits: Array.isArray(fut.take_profit) ? JSON.parse(JSON.stringify(fut.take_profit)) : [],
        isAdvancedOpen: false,
        reduceOnly: false,
        symbol: fut.symbol,
      });
    }
    // TODO: Add initialization for OPTION and PREDICTION market types
  });

  const handleConfirmOrder = async () => {
    setConfirmModalVisible(false);
    if (!appState.brokerApi) return;
    
    if (trade.marketType === 'FUTURES') {
      const latestPrice = () => {
        const chart = (appState.chart as ChartPro)?.getChart();
        if (!chart) return 0;
        const dataList = chart.getDataList();
        return dataList.length > 0 ? dataList[dataList.length - 1]?.close ?? 0 : 0;
      };

      const sizeInBaseCurrency = () => {
        const price = trade.orderType === 'market' ? latestPrice() : (trade.price || 0);
        if (!price || price === 0) return 0;
        if (trade.sizeUnit === 'BASE') return trade.size;
        return trade.size / price;
      };

      const orderParams: OrderParams = {
        symbol: trade.symbol!,
        side: trade.direction as OrderSide,
        type: trade.orderType,
        qty: sizeInBaseCurrency(),
        price: trade.orderType === 'limit' ? trade.price : undefined,
        triggerPrice: trade.orderType === 'stop' ? trade.triggerPrice : undefined,
        stopLoss: trade.stopLoss && trade.stopLoss > 0 ? trade.stopLoss : undefined,
        takeProfit: trade.takeProfits.length > 0 && trade.takeProfits[0].price > 0 ? trade.takeProfits[0].price : undefined,
        // Pass leverage and reduceOnly as extra properties, as MockBrokerAPI expects them
        leverage: trade.leverage,
        reduceOnly: trade.reduceOnly,
      };
      try {
        await appState.brokerApi.placeOrder(orderParams);
        setTrade('status', 'SUCCESS');
      } catch (error) {
        setTrade('status', 'FAILED');
        console.error("Order placement failed:", error);
      }
    } else {
      console.log("Placing order for:", trade);
    }
  };

  const suggestion = () => props.node.attrs.data;
  const ViewComponent = createMemo(() => viewRegistry[suggestion().marketType]);

  const simplifiedInstrumentName = createMemo(() => {
    const s = suggestion();
    if (s.marketType === 'FUTURES') {
      const sym = (s as FuturesTradeSuggestion).symbol || '';
      const parts = sym.split(/[:.@]/);
      if (parts.length >= 4) {
        return `${parts[1]}/${parts[3].split('_')[0]} PERP`;
      }
      return sym;
    }
    return '';
  });

  return (
    <div class="message ai-message">
      <div class="message-content" style={{ "border-color": "var(--primary-highlight)" }}>
        <div class="trade-suggestion-card">
          <div class="trade-header">
            <div class="suggestion-title-group">
              <div class="suggestion-main-title">
                <AITrendingUpIcon class="title-icon" />
                <span>AI Suggestion</span>
              </div>
              <div class="suggestion-instrument-subtitle">{simplifiedInstrumentName()}</div>
            </div>
            <ConfidenceCircle percentage={((suggestion().confidence_score ?? 0.85) * 100)} />
          </div>
          <div class="trade-summary">{suggestion().summary}</div>
          
          <Show when={ViewComponent()} fallback={<div>Unsupported market type</div>}>
            <Dynamic 
              component={ViewComponent()!} 
              data={suggestion()} 
              tradeStore={[trade, setTrade]} 
              appState={appState}
              isPreviewing={isPreviewing()}
            />
          </Show>

          <div class="trade-actions">
             <Show when={suggestion().marketType === 'FUTURES'}>
              <button class="trade-btn preview-btn" onClick={() => setIsPreviewing(!isPreviewing())}>
                {isPreviewing() ? 'Hide' : 'Show'}
              </button>
            </Show>
            <button class="trade-btn decline" onClick={() => setTrade('status', 'DECLINED')}>Decline</button>
            <button class="trade-btn place-trade" onClick={() => setConfirmModalVisible(true)}>Check</button>
          </div>
        </div>
      </div>
      <Show when={confirmModalVisible()}>
        <TradeConfirmModal
          // @ts-ignore
          tradeDetails={{}} 
          theme={'dark'}
          onClose={() => setConfirmModalVisible(false)}
          onConfirm={handleConfirmOrder}
        />
      </Show>
    </div>
  );
};

export default TradeSuggestionDetailView;