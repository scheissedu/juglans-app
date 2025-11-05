import { Component, createMemo, createEffect, onCleanup, For, createSignal, Show } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { ActionType } from '@klinecharts/core';
import TradeConfirmModal from '../../modals/TradeConfirmModal';
import EditableValue from '../EditableValue';
import { 
  TakeProfitTarget, 
  OrderParams, 
  OrderSide, 
  OrderType, 
  ChartPro,
  Switch
} from '@klinecharts/pro';
import { useAppContext } from '../../../context/AppContext';
import { useBrokerState } from '@klinecharts/pro';
import './TradeSuggestionCard.css';

type SizeUnit = 'BASE' | 'QUOTE';
type MarginMode = 'ISOLATED' | 'CROSSED';
type CardStatus = 'SUGGESTED' | 'MODIFIED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'DECLINED';

interface LocalTradeState {
  productType: 'SPOT' | 'FUTURES';
  status: CardStatus;
  direction: OrderSide;
  orderType: OrderType;
  size: number;
  sizeUnit: SizeUnit;
  price?: number;
  triggerPrice?: number;
  leverage?: number;
  marginMode?: MarginMode;
  stopLoss?: number;
  takeProfits: TakeProfitTarget[];
  isAdvancedOpen: boolean;
  reduceOnly: boolean;
}

interface TradeSuggestionCardProps {
  suggestion: any;
  chartPro: ChartPro | null;
  onPlaceOrder: (order: OrderParams) => Promise<void>;
}

const ORDER_TYPES: OrderType[] = ['market', 'limit', 'stop'];

const TradeSuggestionCard: Component<TradeSuggestionCardProps> = (props) => {
  const [appState] = useAppContext();
  const [brokerState] = useBrokerState();
  const [isPreviewing, setIsPreviewing] = createSignal(true);
  const [confirmModalVisible, setConfirmModalVisible] = createSignal(false);

  const [trade, setTrade] = createStore<LocalTradeState>({
    productType: 'FUTURES',
    status: 'SUGGESTED',
    direction: 'buy',
    orderType: 'market',
    size: 0,
    sizeUnit: 'BASE',
    leverage: 1,
    marginMode: 'ISOLATED',
    stopLoss: 0,
    takeProfits: [],
    isAdvancedOpen: false,
    reduceOnly: false,
  });

  createEffect(() => {
    const suggestion = props.suggestion.trade_suggestion;
    if (!suggestion) return;
    const takeProfitsArray = Array.isArray(suggestion.take_profit) ? suggestion.take_profit : [];
    const cleanTakeProfits = JSON.parse(JSON.stringify(takeProfitsArray));
    setTrade({
      productType: props.suggestion.productType ?? 'FUTURES',
      status: 'SUGGESTED',
      direction: suggestion.direction === 'LONG' ? 'buy' : 'sell',
      orderType: suggestion.orderType ?? 'market',
      size: suggestion.quantity,
      sizeUnit: 'BASE',
      price: suggestion.price,
      triggerPrice: suggestion.stopPrice,
      leverage: suggestion.leverage,
      marginMode: 'ISOLATED',
      stopLoss: suggestion.stop_loss,
      takeProfits: cleanTakeProfits,
      isAdvancedOpen: false,
      reduceOnly: false,
    });
  });

  const isLong = createMemo(() => trade.direction === 'buy');

  const latestPrice = createMemo(() => {
    const chart = props.chartPro?.getChart();
    if (!chart) return 0;
    const dataList = chart.getDataList();
    return dataList[dataList.length - 1]?.close ?? 0;
  });

  const sizeInBaseCurrency = createMemo(() => {
    const price = trade.orderType === 'market' ? latestPrice() : trade.price;
    if (!price || price === 0) return 0;
    if (trade.sizeUnit === 'BASE') {
      return trade.size;
    }
    return trade.size / price;
  });

  const liquidationPrice = createMemo(() => {
    if (trade.productType !== 'FUTURES' || !trade.leverage || trade.leverage === 0) return null;
    const entryPrice = trade.orderType === 'market' ? latestPrice() : trade.price;
    if (!entryPrice || entryPrice === 0) return null;
    if (trade.marginMode === 'ISOLATED') {
      if (isLong()) { return entryPrice * (1 - (1 / trade.leverage)); } 
      else { return entryPrice * (1 + (1 / trade.leverage)); }
    } else {
      const accountInfo = brokerState.accountInfo;
      if (!accountInfo || typeof accountInfo.availableFunds !== 'number') return null;
      const positionValue = sizeInBaseCurrency() * entryPrice;
      const initialMargin = positionValue / trade.leverage;
      const priceChange = (accountInfo.availableFunds + initialMargin) / sizeInBaseCurrency();
      if (isLong()) { return entryPrice - priceChange; } 
      else { return entryPrice + priceChange; }
    }
  });
  
  const riskRewardRatio = createMemo(() => {
    const entry = trade.orderType === 'market' ? latestPrice() : trade.price;
    const sl = trade.stopLoss;
    if (!entry || !sl || sl === 0 || !Array.isArray(trade.takeProfits) || trade.takeProfits.length === 0) return 'N/A';
    const risk = Math.abs(entry - sl);
    if (risk === 0) return 'N/A';
    const weightedReward = trade.takeProfits.reduce((acc, tp) => acc + (Math.abs(tp.price - entry) * (tp.portion_pct / 100)), 0);
    if (weightedReward === 0) return 'N/A';
    const ratio = weightedReward / risk;
    return `${ratio.toFixed(2)}:1`;
  });

  const updateValue = (key: keyof LocalTradeState, value: any, setModified = true) => {
    setTrade(key as any, value);
    if (setModified) {
      setTrade('status', 'MODIFIED');
    }
  };

  const updateTakeProfit = (index: number, field: 'price' | 'portion_pct', value: number) => {
    setTrade('takeProfits', index, field, value);
    setTrade('status', 'MODIFIED');
  };
  
  const toggleDirection = () => updateValue('direction', trade.direction === 'buy' ? 'sell' : 'buy');
  const toggleMarginMode = () => updateValue('marginMode', trade.marginMode === 'ISOLATED' ? 'CROSSED' : 'ISOLATED');
  const toggleSizeUnit = () => {
    const price = trade.orderType === 'market' ? latestPrice() : trade.price;
    if (!price || price === 0) return;
    const currentSize = trade.size;
    if (trade.sizeUnit === 'QUOTE') {
      updateValue('size', currentSize / price);
      setTrade('sizeUnit', 'BASE');
    } else {
      updateValue('size', currentSize * price);
      setTrade('sizeUnit', 'QUOTE');
    }
  };
  
  const handleConfirmOrder = async () => {
    setConfirmModalVisible(false);
    setTrade('status', 'PENDING');
    const orderParams: OrderParams = {
      symbol: appState.symbol.ticker,
      side: trade.direction,
      type: trade.orderType,
      qty: sizeInBaseCurrency(),
      price: trade.orderType === 'limit' ? trade.price : undefined,
      stopPrice: trade.orderType === 'stop' ? trade.triggerPrice : undefined,
      stopLoss: trade.stopLoss,
      takeProfit: trade.takeProfits[0]?.price,
      reduceOnly: trade.reduceOnly,
      timeInForce: 'GTC', // Hardcoded for now
    };
    try {
      await props.onPlaceOrder(orderParams);
      setTrade('status', 'SUCCESS');
    } catch (error) {
      console.error("Order placement failed:", error);
      setTrade('status', 'FAILED');
      alert("Order placement failed. Check console for details.");
    }
  };

  const currentTradeDetails = createMemo(() => {
    const entry = trade.orderType === 'market' ? latestPrice() : trade.price;
    return {
      symbol: appState.symbol.ticker,
      direction: trade.direction === 'buy' ? 'LONG' : 'SHORT',
      leverage: trade.leverage,
      entry_price: entry,
      stop_loss: trade.stopLoss,
      take_profit: trade.takeProfits,
      position_size_usd: trade.sizeUnit === 'QUOTE' ? trade.size : trade.size * (entry || 0),
    };
  });

  const currentTheme = createMemo(() => (props.chartPro?.getTheme() as 'light' | 'dark') ?? 'dark');

  createEffect(() => {
    const chart = props.chartPro?.getChart();
    if (chart && isPreviewing()) {
      const overlayIdPrefix = `trade_suggestion_${props.suggestion.id || Date.now()}`;
      const entry = trade.orderType === 'market' ? latestPrice() : trade.price;
      const overlaysToCreate: any[] = [];
      if (entry) { overlaysToCreate.push({ name: 'priceLine', id: `${overlayIdPrefix}_entry`, groupId: overlayIdPrefix, lock: false, points: [{ value: entry }], styles: { line: { color: isLong() ? '#2DC08E' : '#F92855' } } }); }
      if (trade.stopLoss && trade.stopLoss > 0) { overlaysToCreate.push({ name: 'priceLine', id: `${overlayIdPrefix}_sl`, groupId: overlayIdPrefix, lock: false, points: [{ value: trade.stopLoss }], styles: { line: { color: 'orange', style: 'dashed' } } }); }
      if (Array.isArray(trade.takeProfits)) {
        trade.takeProfits.forEach((tp, i) => { 
          if (tp.price > 0) { 
            overlaysToCreate.push({ name: 'priceLine', id: `${overlayIdPrefix}_tp_${i}`, groupId: overlayIdPrefix, lock: false, points: [{ value: tp.price }], styles: { line: { color: '#BFFF00', style: 'dashed' } } }); 
          } 
        });
      }
      const liqPrice = liquidationPrice();
      if (liqPrice) { overlaysToCreate.push({ name: 'priceLine', id: `${overlayIdPrefix}_liq`, groupId: overlayIdPrefix, lock: true, points: [{ value: liqPrice }], styles: { line: { color: '#FF0000', style: 'dotted' } } }); }
      if (overlaysToCreate.length > 0) { chart.createOverlay(overlaysToCreate); }
      const handleDrag = (event: any) => {
        const { overlay } = event;
        if (overlay.groupId === overlayIdPrefix && overlay.points[0]?.value) {
            const newPrice = overlay.points[0].value;
            const idParts = overlay.id.split('_');
            const type = idParts[idParts.length - (idParts.includes('tp') ? 2 : 1)];
            switch (type) {
                case 'entry': if (trade.orderType === 'limit') { updateValue('price', newPrice); } break;
                case 'sl': updateValue('stopLoss', newPrice); break;
                case 'tp': const index = parseInt(idParts[idParts.length - 1], 10); updateTakeProfit(index, 'price', newPrice); break;
            }
        }
      };
      chart.subscribeAction(ActionType.OnOverlayDragEnd, handleDrag);
      onCleanup(() => {
        if (chart) {
          chart.removeOverlay({ groupId: overlayIdPrefix });
          chart.unsubscribeAction(ActionType.OnOverlayDragEnd, handleDrag);
        }
      });
    }
  });

  return (
    <>
      <div class="message ai-message">
        <div class="message-content" style={{ "border-color": "var(--primary-highlight)" }}>
          <div class="trade-suggestion-card">
            <div class="trade-header">
              <span>📈 AI Futures Suggestion</span>
              <Show when={trade.status === 'SUGGESTED'} fallback={<span>Confidence: --%</span>}>
                <span>Confidence: {(props.suggestion.confidence_score * 100).toFixed(0)}%</span>
              </Show>
            </div>
            <div class="trade-summary">{props.suggestion.summary ?? '市价买入 1 BTC'}</div>
            <div class="product-identifier">PERPETUAL FUTURES</div>
            <div class="trade-parameters">
              <button class={`trade-direction ${isLong() ? 'long' : 'short'}`} onClick={toggleDirection}>
                {isLong() ? 'LONG' : 'SHORT'}
              </button>
              <div class="param-item">
                <label>Leverage</label>
                <div class="param-value">
                  <EditableValue value={trade.leverage ?? 1} onUpdate={v => updateValue('leverage', v)} />x
                </div>
              </div>
              <div class="param-item">
                <label>Size</label>
                <div class="param-value">
                  <EditableValue value={trade.sizeUnit === 'BASE' ? trade.size.toPrecision(4) : trade.size.toFixed(2)} onUpdate={v => updateValue('size', v)} />
                  <button class="unit-toggle" onClick={toggleSizeUnit}>
                    {trade.sizeUnit === 'QUOTE' ? appState.symbol.ticker.split('-')[1] : appState.symbol.ticker.split('-')[0]}
                  </button>
                </div>
              </div>
            </div>
            <Show when={trade.productType === 'FUTURES'}>
              <div class="margin-mode-toggle">
                <button class={trade.marginMode === 'ISOLATED' ? 'active' : ''} onClick={toggleMarginMode}>Isolated</button>
                <button class={trade.marginMode === 'CROSSED' ? 'active' : ''} onClick={toggleMarginMode}>Cross</button>
              </div>
            </Show>

            <div class="order-type-selector">
              <For each={ORDER_TYPES}>
                {(type) => (
                  <button
                    class={trade.orderType === type ? 'active' : ''}
                    onClick={() => updateValue('orderType', type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                )}
              </For>
            </div>
            
            <div class="trade-levels">
              <Show when={trade.orderType === 'market'}>
                <div><span>Entry Price:</span> <span>~ {latestPrice().toFixed(2)}</span></div>
              </Show>
              <Show when={trade.orderType === 'limit'}>
                <div><span>Price:</span> <span><EditableValue value={trade.price ?? ''} onUpdate={v => updateValue('price', v)} placeholder='Limit Price'/></span></div>
              </Show>
              <Show when={trade.orderType === 'stop'}>
                <div><span>Trigger Price:</span> <span><EditableValue value={trade.triggerPrice ?? ''} onUpdate={v => updateValue('triggerPrice', v)} placeholder='Stop Price'/></span></div>
              </Show>

              <div class="sl"><span>Stop Loss:</span> <span><EditableValue value={trade.stopLoss ?? ''} onUpdate={v => updateValue('stopLoss', v)} placeholder='SL Price'/></span></div>
              <For each={trade.takeProfits}>
                {(tp, i) => (
                  <div class="tp">
                    <span>Take Profit {i() + 1}:</span>
                    <div class="tp-values">
                      <EditableValue value={tp.price.toFixed(2)} onUpdate={(v) => updateTakeProfit(i(), 'price', v)} />
                      <div class="tp-portion">
                        <span>(</span>
                        <EditableValue value={tp.portion_pct} onUpdate={(v) => updateTakeProfit(i(), 'portion_pct', v)} suffix="%" />
                        <span>)</span>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>

            <div class="advanced-options-toggle" onClick={() => updateValue('isAdvancedOpen', !trade.isAdvancedOpen)}>
              <span>Advanced</span>
              <svg class={`arrow ${trade.isAdvancedOpen ? 'open' : ''}`} viewBox="0 0 8 6"><path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1.5"/></svg>
            </div>
            <Show when={trade.isAdvancedOpen}>
              <div class="advanced-options-content">
                <div class="form-item">
                  <label>Time in Force</label>
                  <div class="option-text">GTC (Good-Til-Canceled)</div>
                </div>
                <div class="form-item">
                  <label>Reduce-Only</label>
                  <Switch open={trade.reduceOnly} onChange={() => updateValue('reduceOnly', !trade.reduceOnly)} />
                </div>
              </div>
            </Show>
            
            <div class="derived-info">
              <span>Risk/Reward: <strong>{riskRewardRatio()}</strong></span>
              <Show when={liquidationPrice()} fallback={<span>Est. Liq. Price: <strong>--</strong></span>}>
                {lp => <span>Est. Liq. Price: <strong>{lp()!.toFixed(2)}</strong></span>}
              </Show>
            </div>
            <div class="trade-actions">
              <button class="trade-btn preview-btn" onClick={() => setIsPreviewing(!isPreviewing())}>
                {isPreviewing() ? 'Hide Preview' : 'Show Preview'}
              </button>
              <Show 
                when={trade.status === 'SUGGESTED' || trade.status === 'MODIFIED' || trade.status === 'FAILED'}
                fallback={
                  <div class="trade-status">{trade.status}</div>
                }
              >
                <button class="trade-btn decline" onClick={() => setTrade('status', 'DECLINED')}>Decline</button>
                <button class="trade-btn place-trade" onClick={() => setConfirmModalVisible(true)}>Place Trade</button>
              </Show>
            </div>
            <div class="trade-disclaimer">⚠️ AI-generated suggestion. Use at your own risk.</div>
          </div>
        </div>
      </div>
      <Show when={confirmModalVisible()}>
        <TradeConfirmModal
          tradeDetails={currentTradeDetails()}
          theme={currentTheme()}
          onClose={() => setConfirmModalVisible(false)}
          onConfirm={handleConfirmOrder}
        />
      </Show>
    </>
  );
};

export default TradeSuggestionCard;