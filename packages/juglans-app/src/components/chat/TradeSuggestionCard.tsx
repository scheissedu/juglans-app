import { Component, createMemo, createEffect, onCleanup, For, createSignal, Show } from 'solid-js';
import { Chart, ActionType } from '@klinecharts/core';
import { createStore, produce } from 'solid-js/store';
import TradeConfirmModal from '../modals/TradeConfirmModal';
import EditableValue from './EditableValue';
import { TakeProfitTarget, TradeSuggestion, OrderParams, OrderSide, OrderType, ChartPro } from '@klinecharts/pro';

interface TradeSuggestionCardProps {
  suggestion: TradeSuggestion;
  chartPro: ChartPro | null;
  onPlaceOrder: (order: OrderParams) => Promise<void>;
}

const TradeSuggestionCard: Component<TradeSuggestionCardProps> = (props) => {
  const [direction, setDirection] = createSignal<'LONG' | 'SHORT'>('LONG');
  const [leverage, setLeverage] = createSignal(0);
  const [positionSize, setPositionSize] = createSignal(0);
  const [entryPrice, setEntryPrice] = createSignal(0);
  const [stopLoss, setStopLoss] = createSignal(0);
  const [takeProfits, setTakeProfits] = createStore<TakeProfitTarget[]>([]);
  const [isModified, setIsModified] = createSignal(false);
  const [orderType, setOrderType] = createSignal<OrderType>(OrderType.Market);

  const [isPreviewing, setIsPreviewing] = createSignal(true);
  const [actionTaken, setActionTaken] = createSignal<'PLACED' | 'DECLINED' | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = createSignal(false);

  let overlayIdPrefix = '';

  createEffect(() => {
    const trade = props.suggestion.trade_suggestion;
    setDirection(trade.direction);
    setLeverage(trade.leverage);
    setPositionSize(trade.position_size_usd);
    setEntryPrice(trade.entry_price);
    setStopLoss(trade.stop_loss);
    setTakeProfits(trade.take_profit);
    setIsModified(false);
    setActionTaken(null);
    setOrderType(trade.price ? OrderType.Limit : OrderType.Market);
  });

  const isLong = createMemo(() => direction() === 'LONG');

  const riskRewardRatio = createMemo(() => {
    const entry = entryPrice();
    const sl = stopLoss();
    const tps = takeProfits;
    if (!entry || !sl || sl === 0 || sl === entry || tps.length === 0) return 'N/A';
    const risk = Math.abs(entry - sl);
    if (risk === 0) return 'N/A';
    const weightedReward = tps.reduce((acc, tp) => acc + (Math.abs(tp.price - entry) * (tp.portion_pct / 100)), 0);
    if (weightedReward === 0) return 'N/A';
    const ratio = weightedReward / risk;
    return `${ratio.toFixed(2)}:1`;
  });

  const onValueUpdate = <T,>(setter: (v: T) => void) => (newValue: T) => {
    setter(newValue);
    setIsModified(true);
  };
  
  const updateTakeProfit = (index: number, field: 'price' | 'portion_pct', value: number) => {
    setTakeProfits(produce(tps => { tps[index][field] = value; }));
    setIsModified(true);
  };
  
  const handleConfirmOrder = async () => {
    setConfirmModalVisible(false);
    const proChart = props.chartPro;
    if (!proChart) return;
    
    const chart = proChart.getChart();
    if (!chart) return;
    
    const orderParams: OrderParams = {
      symbol: proChart.getSymbol().ticker,
      side: isLong() ? OrderSide.Buy : OrderSide.Sell,
      type: orderType(),
      qty: positionSize(),
      price: orderType() === OrderType.Limit ? entryPrice() : undefined,
      stopLoss: stopLoss() > 0 ? stopLoss() : undefined,
      takeProfit: takeProfits.length > 0 && takeProfits[0].price > 0 ? takeProfits[0].price : undefined,
    };
    
    try {
      await props.onPlaceOrder(orderParams);
      setActionTaken('PLACED');
    } catch (error) {
      console.error("Order placement failed:", error);
      alert("Order placement failed. Check console for details.");
    }
  };

  createEffect(() => {
    const chart = props.chartPro?.getChart();
    if (chart && isPreviewing()) {
      overlayIdPrefix = `trade_suggestion_${Date.now()}`;
      
      const overlaysToCreate: any[] = [
        { name: 'priceLine', id: `${overlayIdPrefix}_entry`, groupId: overlayIdPrefix, lock: false, points: [{ value: entryPrice() }], styles: { line: { color: isLong() ? '#2DC08E' : '#F92855' } } },
      ];
      if (stopLoss() > 0) {
        overlaysToCreate.push({ name: 'priceLine', id: `${overlayIdPrefix}_sl`, groupId: overlayIdPrefix, lock: false, points: [{ value: stopLoss() }], styles: { line: { color: '#888888', style: 'dashed' } } });
      }
      takeProfits.forEach((tp, i) => {
        if (tp.price > 0) {
           overlaysToCreate.push({
            name: 'priceLine', id: `${overlayIdPrefix}_tp_${i}`, groupId: overlayIdPrefix, lock: false,
            points: [{ value: tp.price }], styles: { line: { color: '#BFFF00', style: 'dashed' } },
          });
        }
      });

      chart.createOverlay(overlaysToCreate);
      
      const handleDrag = (event: any) => {
        const { overlay } = event;
        if (overlay.groupId === overlayIdPrefix && overlay.points[0]?.value) {
            const newPrice = overlay.points[0].value;
            const idParts = overlay.id.split('_');
            const type = idParts[idParts.length - (idParts.includes('tp') ? 2 : 1)];

            switch (type) {
                case 'entry':
                    onValueUpdate(setEntryPrice)(newPrice);
                    break;
                case 'sl':
                    onValueUpdate(setStopLoss)(newPrice);
                    break;
                case 'tp':
                    const index = parseInt(idParts[idParts.length - 1], 10);
                    updateTakeProfit(index, 'price', newPrice);
                    break;
            }
        }
      };

      chart.subscribeAction(ActionType.OnOverlayDragEnd, handleDrag);
      
      onCleanup(() => {
        chart.removeOverlay({ groupId: overlayIdPrefix });
        chart.unsubscribeAction(ActionType.OnOverlayDragEnd, handleDrag);
      });
    }
  });

  const currentTradeDetails = createMemo(() => {
    const proChart = props.chartPro;
    return {
      symbol: proChart?.getSymbol().ticker ?? props.suggestion.trade_suggestion.symbol ?? 'N/A',
      direction: direction(),
      leverage: leverage(),
      entry_price: entryPrice(),
      stop_loss: stopLoss(),
      take_profit: takeProfits.slice(),
      position_size_usd: positionSize(),
    };
  });

  return (
    <>
      <div class="message ai-message">
        <div class="message-content" style={{ "border-color": "var(--primary-highlight)" }}>
          <div class="trade-suggestion-card">
            <div class="trade-header">
              <span>📈 {props.suggestion.strategy_name}</span>
              <Show when={!isModified()} fallback={<span>Confidence: --%</span>}>
                <span>Confidence: {(props.suggestion.confidence_score * 100).toFixed(0)}%</span>
              </Show>
            </div>
            <div class="trade-summary">{props.suggestion.summary}</div>
            <div class="trade-details">
              <button class={`trade-direction ${isLong() ? 'long' : 'short'}`} onClick={onValueUpdate(setDirection)(isLong() ? 'SHORT' : 'LONG')}>
                {direction()}
              </button>
              <div class="trade-param">Leverage: <strong><EditableValue value={leverage()} onUpdate={onValueUpdate(leverage)} suffix="x" /></strong></div>
              <div class="trade-param">Size: <strong><EditableValue value={positionSize()} onUpdate={onValueUpdate(setPositionSize)} suffix=" USD" /></strong></div>
            </div>
            <div class="trade-levels">
              <div><span>Entry Price:</span> <span><EditableValue value={entryPrice().toFixed(2)} onUpdate={onValueUpdate(setEntryPrice)} prefix="~ " /></span></div>
              <div class="sl"><span>Stop Loss:</span> <span><EditableValue value={stopLoss().toFixed(2)} onUpdate={onValueUpdate(setStopLoss)} /></span></div>
              <For each={takeProfits}>
                {(tp, i) => (
                  <div class="tp">
                    <span>Take Profit {i() + 1}:</span>
                    <span>
                      <EditableValue value={tp.price.toFixed(2)} onUpdate={(v) => updateTakeProfit(i(), 'price', v)} />
                      (<EditableValue value={tp.portion_pct} onUpdate={(v) => updateTakeProfit(i(), 'portion_pct', v)} suffix="%" />)
                    </span>
                  </div>
                )}
              </For>
            </div>
            <div class="trade-rr">Risk/Reward Ratio: <strong>{riskRewardRatio()}</strong></div>
            <div class="trade-actions">
              <button class="trade-btn preview" onClick={() => setIsPreviewing(!isPreviewing())}>
                {isPreviewing() ? 'Hide Preview' : 'Show Preview'}
              </button>
              <Show when={actionTaken()} fallback={<>
                <button class="trade-btn decline" onClick={() => setActionTaken('DECLINED')}>Decline</button>
                <button class="trade-btn place-trade" onClick={() => setConfirmModalVisible(true)}>Place Trade</button>
              </>}>
                {status => <div class="trade-status">Status: {status()}</div>}
              </Show>
            </div>
            <div class="trade-disclaimer">⚠️ AI-generated suggestion. Use at your own risk.</div>
          </div>
        </div>
      </div>
      <Show when={confirmModalVisible()}>
        <TradeConfirmModal
          tradeDetails={currentTradeDetails()}
          onClose={() => setConfirmModalVisible(false)}
          onConfirm={handleConfirmOrder}
        />
      </Show>
    </>
  );
};

export default TradeSuggestionCard;