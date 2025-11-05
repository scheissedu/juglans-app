import {
  BrokerAPI, BrokerCallbacks, Order, OrderParams, Position, AccountInfo,
  Execution, InstrumentInfo, SymbolInfo, OrderStatus, OrderSide, PositionSide
} from '@klinecharts/pro';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface MockBrokerState {
  accountInfo: AccountInfo;
  positions: Position[];
  orders: Order[];
  executions: Execution[];
  nextOrderId: number;
  nextPositionId: number;
}

const LOCAL_STORAGE_KEY = 'klinecharts_pro_mock_broker_state';

export class MockBrokerAPI implements BrokerAPI {
  private _callbacks: BrokerCallbacks | null = null;
  private _state: MockBrokerState = this._loadState();
  private _lastPrices: Map<string, number> = new Map();

  private _loadState(): MockBrokerState {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        console.log('[MockBroker] Loaded state from localStorage.');
        const state = JSON.parse(savedState);
        return {
          ...this._getDefaultState(),
          ...state,
          accountInfo: {
            ...this._getDefaultState().accountInfo,
            ...(state.accountInfo || {})
          }
        };
      }
    } catch (e) {
      console.error("[MockBroker] Failed to load state from localStorage", e);
    }
    return this._getDefaultState();
  }

  private _saveState() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this._state));
    } catch (e) {
      console.error("[MockBroker] Failed to save state to localStorage", e);
    }
  }

  private _getDefaultState(): MockBrokerState {
    return {
      accountInfo: {
        id: 'mock_account_001', name: 'Demo Account', currency: 'USD',
        balance: 100000, equity: 100000, realizedPnl: 0, unrealizedPnl: 0,
        margin: 0, orderMargin: 0, availableFunds: 100000
      },
      positions: [], orders: [], executions: [],
      nextOrderId: 1, nextPositionId: 1,
    };
  }

  private _recalculateAccountMetrics() {
    let totalUnrealizedPnl = 0;
    let totalMargin = 0;

    this._state.positions.forEach(pos => {
      const lastPrice = this._lastPrices.get(pos.symbol) ?? pos.avgPrice;
      const pnl = (lastPrice - pos.avgPrice) * pos.qty * (pos.side === 'long' ? 1 : -1);
      pos.unrealizedPnl = pnl;
      totalUnrealizedPnl += pnl;
      totalMargin += (pos.avgPrice * pos.qty) / (pos.leverage ?? 10);
    });

    const accountInfo = this._state.accountInfo;
    accountInfo.unrealizedPnl = totalUnrealizedPnl;
    accountInfo.equity = accountInfo.balance + totalUnrealizedPnl;
    accountInfo.margin = totalMargin;
    accountInfo.orderMargin = 0;
    accountInfo.availableFunds = accountInfo.equity - accountInfo.margin - accountInfo.orderMargin;

    this._callbacks?.onAccountInfoUpdate(this._state.accountInfo);
  }
  
  updatePrice(symbol: string, price: number) {
    this._lastPrices.set(symbol, price);

    let positionsUpdated = false;
    this._state.positions.forEach(pos => {
      if (pos.symbol === symbol) {
        this._callbacks?.onPositionUpdate({ ...pos, unrealizedPnl: (price - pos.avgPrice) * pos.qty * (pos.side === 'long' ? 1 : -1) });
        positionsUpdated = true;
      }
    });

    if (positionsUpdated) {
        this._recalculateAccountMetrics();
        this._saveState();
    }
  }
  
  connect() { console.log('[MockBroker] Connected.'); }
  disconnect() { console.log('[MockBroker] Disconnected.'); }
  subscribe(callbacks: BrokerCallbacks) { 
    this._callbacks = callbacks;
    this._callbacks.onAccountInfoUpdate(this._state.accountInfo);
    this._state.positions.forEach(p => this._callbacks?.onPositionUpdate(p));
    this._state.orders.forEach(o => this._callbacks?.onOrderUpdate(o));
  }
  unsubscribe() { this._callbacks = null; }

  async getAccountInfo(): Promise<AccountInfo> { await sleep(200); return Promise.resolve(this._state.accountInfo); }
  async getPositions(): Promise<Position[]> { await sleep(300); return Promise.resolve(this._state.positions); }
  async getOrders(): Promise<Order[]> { await sleep(250); return Promise.resolve(this._state.orders); }
  async getExecutions(): Promise<Execution[]> { await sleep(400); return Promise.resolve(this._state.executions); }
  async getInstrumentInfo(symbol: SymbolInfo): Promise<InstrumentInfo> {
    await sleep(100);
    return Promise.resolve({ symbol: symbol.ticker, pricePrecision: 2, qtyPrecision: 4, minQty: 0.0001, maxQty: 10000, lotSize: 0.0001 });
  }

  async placeOrder(orderParams: OrderParams): Promise<void> {
    console.log('[MockBroker] Placing order with full params:', orderParams);
    await sleep(200);

    const newOrder: Order = {
      ...orderParams,
      id: `mock_order_${this._state.nextOrderId++}`,
      timestamp: Date.now(),
      status: OrderStatus.Working,
      price: orderParams.price ?? this._lastPrices.get(orderParams.symbol) ?? 0
    };
    this._state.orders.unshift(newOrder);
    this._callbacks?.onOrderUpdate(newOrder);

    setTimeout(() => {
      const fillPrice = newOrder.type === 'market' ? (this._lastPrices.get(newOrder.symbol) ?? 0) : newOrder.price;
      if(fillPrice === 0) {
        newOrder.status = OrderStatus.Rejected;
        this._callbacks?.onOrderUpdate({ ...newOrder });
        return;
      }
      newOrder.status = OrderStatus.Filled;
      newOrder.filledQty = newOrder.qty;
      newOrder.avgFillPrice = fillPrice;
      this._callbacks?.onOrderUpdate({ ...newOrder });
      
      const execution: Execution = {
        id: `exec_${newOrder.id}`, orderId: newOrder.id, symbol: newOrder.symbol,
        price: fillPrice, qty: newOrder.qty, side: newOrder.side,
        timestamp: Date.now(), fee: newOrder.qty * 0.001 * fillPrice,
      };
      this._state.executions.unshift(execution);
      this._callbacks?.onExecution(execution);

      const posSide = newOrder.side === OrderSide.Buy ? PositionSide.Long : PositionSide.Short;
      const existingPosition = this._state.positions.find(p => p.symbol === newOrder.symbol && p.side === posSide);
      
      if (existingPosition) {
        const totalQty = existingPosition.qty + newOrder.qty;
        existingPosition.avgPrice = ((existingPosition.avgPrice * existingPosition.qty) + (fillPrice * newOrder.qty)) / totalQty;
        existingPosition.qty = totalQty;
        this._callbacks?.onPositionUpdate(existingPosition);
      } else {
        const newPosition: Position = {
          id: `pos_${this._state.nextPositionId++}`, symbol: newOrder.symbol,
          side: posSide, qty: newOrder.qty, avgPrice: fillPrice, 
          stopLoss: orderParams.stopLoss, takeProfit: orderParams.takeProfit,
          leverage: (orderParams as any).leverage ?? 10
        };
        this._state.positions.unshift(newPosition);
        this._callbacks?.onPositionUpdate(newPosition);
      }
      this._recalculateAccountMetrics();
      this._saveState();
    }, 1000);
  }

  async closePosition(positionId: string, qty?: number): Promise<void> { /* ... (unchanged) ... */ }
  async modifyPosition(positionId: string, sl_tp: { stopLoss?: number; takeProfit?: number }): Promise<void> { /* ... (unchanged) ... */ }
  async modifyOrder(order: OrderParams): Promise<void> { /* Not implemented */ }
  async cancelOrder(orderId: string): Promise<void> { /* Not implemented */ }
}