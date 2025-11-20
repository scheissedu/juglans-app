// packages/juglans-app/src/components/cards-p/TradeSuggestionCard/views/FuturesTradeView.tsx
import { Component, createMemo, createEffect, onCleanup, For, Show } from 'solid-js';
import { produce } from 'solid-js/store';
import { ActionType } from '@klinecharts/core';
import { TradeViewProps } from './types';
import { FuturesTradeSuggestion, LocalTradeState, OrderSide, OrderType } from '../types';
import EditableValue from '../../EditableValue';
import { ChartPro, Switch as ProSwitch, KLineChartPro } from '@klinecharts/pro';

const ORDER_TYPES: OrderType[] = ['market', 'limit', 'stop'];

const FuturesTradeView: Component<TradeViewProps<FuturesTradeSuggestion>> = (props) => {
  const [trade, setTrade] = props.tradeStore;
  const appState = props.appState;

  // --- 所有 futures 相关的 hooks 和函数都移到这里 ---
  const isLong = createMemo(() => trade.direction === 'buy');
  
  const latestPrice = createMemo(() => {
    const chart = (appState.chart as ChartPro)?.getChart();
    if (!chart) return 0;
    const dataList = chart.getDataList();
    return dataList[dataList.length - 1]?.close ?? 0;
  });

  const sizeInBaseCurrency = createMemo(() => {
    const price = trade.orderType === 'market' ? latestPrice() : trade.price;
    if (!price || price === 0) return 0;
    if (trade.sizeUnit === 'BASE') return trade.size;
    return trade.size / price;
  });

  const liquidationPrice = createMemo(() => {
    if (!trade.leverage || trade.leverage === 0) return null;
    const entryPrice = trade.orderType === 'market' ? latestPrice() : trade.price;
    if (!entryPrice || entryPrice === 0) return null;
    if (trade.marginMode === 'ISOLATED') {
      return isLong() ? entryPrice * (1 - (1 / trade.leverage)) : entryPrice * (1 + (1 / trade.leverage));
    } else {
      const accountInfo = appState.accountInfo;
      if (!accountInfo?.availableFunds) return null;
      const positionValue = sizeInBaseCurrency() * entryPrice;
      const initialMargin = positionValue / trade.leverage;
      const priceChange = (accountInfo.availableFunds + initialMargin) / sizeInBaseCurrency();
      return isLong() ? entryPrice - priceChange : entryPrice + priceChange;
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
    if (setModified) setTrade('status', 'MODIFIED');
  };

  const updateTakeProfit = (index: number, field: 'price' | 'portion_pct', value: number) => {
    setTrade('takeProfits', produce(tps => { if(tps[index]) tps[index][field] = value; }));
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

  createEffect(() => {
    const chart = (appState.chart as ChartPro)?.getChart();
    if (chart && props.isPreviewing) {
      const overlayIdPrefix = `trade_suggestion_preview_${Date.now()}`;
      const entry = trade.orderType === 'market' ? latestPrice() : trade.price;
      const overlaysToCreate: any[] = [];
      
      if (entry) overlaysToCreate.push({ name: 'priceLine', id: `${overlayIdPrefix}_entry`, groupId: overlayIdPrefix, lock: false, points: [{ value: entry }], styles: { line: { color: isLong() ? '#2DC08E' : '#F92855' } } });
      if (trade.stopLoss && trade.stopLoss > 0) overlaysToCreate.push({ name: 'priceLine', id: `${overlayIdPrefix}_sl`, groupId: overlayIdPrefix, lock: false, points: [{ value: trade.stopLoss }], styles: { line: { color: 'orange', style: 'dashed' } } });
      trade.takeProfits.forEach((tp, i) => { if (tp.price > 0) overlaysToCreate.push({ name: 'priceLine', id: `${overlayIdPrefix}_tp_${i}`, groupId: overlayIdPrefix, lock: false, points: [{ value: tp.price }], styles: { line: { color: '#BFFF00', style: 'dashed' } } }); });
      const liqPrice = liquidationPrice();
      if (liqPrice) overlaysToCreate.push({ name: 'priceLine', id: `${overlayIdPrefix}_liq`, groupId: overlayIdPrefix, lock: true, points: [{ value: liqPrice }], styles: { line: { color: '#FF0000', style: 'dotted' } } });

      if (overlaysToCreate.length > 0) chart.createOverlay(overlaysToCreate);
      
      onCleanup(() => { chart.removeOverlay({ groupId: overlayIdPrefix }); });
    }
  });

  const suggestionSymbolParts = createMemo(() => {
    const sym = props.data.symbol || '';
    const parts = sym.split(/[:.@]/);
    if (parts.length >= 4) { return { base: parts[1], quote: parts[3].split('_')[0] }; }
    return { base: 'BASE', quote: 'QUOTE' };
  });

  return (
    <>
      <div class="product-identifier">PERPETUAL FUTURES</div>
      <div class="trade-parameters">
        <button class={`trade-direction ${isLong() ? 'long' : 'short'}`} onClick={toggleDirection}>{isLong() ? 'LONG' : 'SHORT'}</button>
        <div class="param-item">
          <label>Leverage</label>
          <div class="param-value"><EditableValue value={trade.leverage ?? 1} onUpdate={v => updateValue('leverage', v)} />x</div>
        </div>
        <div class="param-item">
          <label>Size</label>
          <div class="param-value">
            <EditableValue value={trade.sizeUnit === 'BASE' ? (trade.size || 0).toPrecision(4) : (trade.size || 0).toFixed(2)} onUpdate={v => updateValue('size', v)} />
            <button class="unit-toggle" onClick={toggleSizeUnit}>
              {trade.sizeUnit === 'QUOTE' ? suggestionSymbolParts().quote : suggestionSymbolParts().base}
            </button>
          </div>
        </div>
      </div>
      <div class="margin-mode-toggle">
        <button classList={{ active: trade.marginMode === 'ISOLATED' }} onClick={toggleMarginMode}>Isolated</button>
        <button classList={{ active: trade.marginMode === 'CROSSED' }} onClick={toggleMarginMode}>Cross</button>
      </div>
      <div class="order-type-selector">
        <For each={ORDER_TYPES}>{(type) => (<button classList={{ active: trade.orderType === type }} onClick={() => updateValue('orderType', type)}>{type.charAt(0).toUpperCase() + type.slice(1)}</button>)}</For>
      </div>
      <div class="trade-levels">
        <Show when={trade.orderType === 'market'}><div><span>Entry Price:</span> <span>~ {latestPrice().toFixed(2)}</span></div></Show>
        <Show when={trade.orderType === 'limit'}><div><span>Price:</span> <span><EditableValue value={trade.price ?? ''} onUpdate={v => updateValue('price', v)} placeholder='Limit Price'/></span></div></Show>
        <Show when={trade.orderType === 'stop'}><div><span>Trigger Price:</span> <span><EditableValue value={trade.triggerPrice ?? ''} onUpdate={v => updateValue('triggerPrice', v)} placeholder='Stop Price'/></span></div></Show>
        <div class="sl"><span>Stop Loss:</span> <span><EditableValue value={trade.stopLoss ?? ''} onUpdate={v => updateValue('stopLoss', v)} placeholder='SL Price'/></span></div>
        <For each={trade.takeProfits}>{(tp, i) => (<div class="tp"><span>Take Profit {i() + 1}:</span><div class="tp-values"><EditableValue value={(tp.price || 0).toFixed(2)} onUpdate={(v) => updateTakeProfit(i(), 'price', v)} /><div class="tp-portion"><span>(</span><EditableValue value={tp.portion_pct} onUpdate={(v) => updateTakeProfit(i(), 'portion_pct', v)} suffix="%" /><span>)</span></div></div></div>)}</For>
      </div>
      <div class="advanced-options-toggle" onClick={() => updateValue('isAdvancedOpen', !trade.isAdvancedOpen)}>
        <span>Advanced</span>
        <svg class={`arrow ${trade.isAdvancedOpen ? 'open' : ''}`} viewBox="0 0 8 6"><path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1.5"/></svg>
      </div>
      <Show when={trade.isAdvancedOpen}>
        <div class="advanced-options-content">
          <div class="form-item"><label>Time in Force</label><div class="option-text">GTC (Good-Til-Canceled)</div></div>
          <div class="form-item"><label>Reduce-Only</label><ProSwitch checked={trade.reduceOnly} onChange={() => updateValue('reduceOnly', !trade.reduceOnly)} /></div>
        </div>
      </Show>
      <div class="derived-info">
        <span>Risk/Reward: <strong>{riskRewardRatio()}</strong></span>
        <Show when={liquidationPrice()} fallback={<span>Est. Liq. Price: <strong>--</strong></span>}>{lp => <span>Est. Liq. Price: <strong>{lp()!.toFixed(2)}</strong></span>}</Show>
      </div>
    </>
  );
};

export default FuturesTradeView;