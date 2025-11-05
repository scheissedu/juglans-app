// /klinecharts-workspace/packages/pro/src/widget/trade-panel/index.tsx

import { Component, createSignal, Show, For } from 'solid-js';
import { Input, Checkbox, Button } from '../../component';
import { OrderSide, OrderType } from '../../types';
import { useBroker } from '../../api/BrokerAPIContext';

const TradePanel: Component = () => {
  const brokerApi = useBroker();

  // Form state signals
  const [side, setSide] = createSignal<OrderSide>(OrderSide.Sell);
  const [orderType, setOrderType] = createSignal<OrderType>(OrderType.Market);
  const [quantity, setQuantity] = createSignal(1);
  const [limitPrice, setLimitPrice] = createSignal('');

  const [takeProfitActive, setTakeProfitActive] = createSignal(false);
  const [takeProfitPrice, setTakeProfitPrice] = createSignal('');

  const [stopLossActive, setStopLossActive] = createSignal(false);
  const [stopLossPrice, setStopLossPrice] = createSignal('');
  
  const orderTypes: OrderType[] = [OrderType.Market, OrderType.Limit, OrderType.Stop];

  const handlePlaceOrder = () => {
    if (!brokerApi) {
      alert("Broker API not connected.");
      return;
    }
    // Basic validation
    if (quantity() <= 0) {
      alert("Quantity must be greater than 0.");
      return;
    }
    // TODO: Build and send order via BrokerAPI
    console.log("Placing order:", {
      side: side(),
      type: orderType(),
      quantity: quantity(),
      limitPrice: orderType() === 'limit' ? limitPrice() : undefined,
      tp: takeProfitActive() ? takeProfitPrice() : undefined,
      sl: stopLossActive() ? stopLossPrice() : undefined
    });
  };

  return (
    <div class="klinecharts-pro-trade-panel">
      <div class="klinecharts-pro-trade-panel-header">
        <h2>AAPL</h2>
        {/* Placeholder for menu and close button */}
      </div>

      <div class="klinecharts-pro-trade-panel-side-switch">
        <button
          class={`side-btn sell ${side() === OrderSide.Sell ? 'active' : ''}`}
          onClick={() => setSide(OrderSide.Sell)}
        >
          <div>SELL</div>
          <div class="price">267.91</div>
        </button>
        <button
          class={`side-btn buy ${side() === OrderSide.Buy ? 'active' : ''}`}
          onClick={() => setSide(OrderSide.Buy)}
        >
          <div>BUY</div>
          <div class="price">267.94</div>
        </button>
      </div>

      <div class="klinecharts-pro-trade-panel-order-type-tabs">
        <For each={orderTypes}>
          {(type) => (
            <button
              class={`type-btn ${orderType() === type ? 'active' : ''}`}
              onClick={() => setOrderType(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          )}
        </For>
      </div>
      
      <Show when={orderType() === OrderType.Limit || orderType() === OrderType.Stop}>
        <div class="klinecharts-pro-trade-panel-form-item">
          <label>Price</label>
          <Input 
            value={limitPrice()} 
            onChange={setLimitPrice}
          />
        </div>
      </Show>

      <div class="klinecharts-pro-trade-panel-form-item">
        <label>Units</label>
        <Input 
          value={quantity()}
          onChange={val => setQuantity(Number(val))}
        />
      </div>

      <div class="klinecharts-pro-trade-panel-form-item">
        <div class="exit-item">
          <Checkbox checked={takeProfitActive()} onChange={setTakeProfitActive} label="Take profit" />
          <Show when={takeProfitActive()}>
            <Input 
              value={takeProfitPrice()}
              onChange={setTakeProfitPrice}
              placeholder="Price"
            />
          </Show>
        </div>
      </div>

      <div class="klinecharts-pro-trade-panel-form-item">
        <div class="exit-item">
          <Checkbox checked={stopLossActive()} onChange={setStopLossActive} label="Stop loss" />
          <Show when={stopLossActive()}>
            <Input
              value={stopLossPrice()}
              onChange={setStopLossPrice}
              placeholder="Price"
            />
          </Show>
        </div>
      </div>
      
      <div class="action-button-container">
        <Button class={side()} onClick={handlePlaceOrder}>
          {`${side() === 'buy' ? 'Buy' : 'Sell'} ${quantity()} AAPL ${orderType().toUpperCase()}`}
        </Button>
      </div>
    </div>
  );
};

export default TradePanel;