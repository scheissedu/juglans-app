import {
  BrokerAPI, BrokerCallbacks, Order, OrderParams, Position, AccountInfo,
  Execution, InstrumentInfo, SymbolInfo, OrderStatus, OrderSide, PositionSide, AssetBalance
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

export class MockBrokerAPI implements BrokerAPI {
  // --- 核心修改 1: 添加一个私有成员变量来存储 localStorage 的 key ---
  private _localStorageKey: string;
  
  private _callbacks: BrokerCallbacks | null = null;
  private _state: MockBrokerState;
  private _lastPrices: Map<string, number> = new Map();

  // --- 核心修改 2: 添加构造函数来接收动态的 storageKey ---
  constructor(storageKey: string) {
    this._localStorageKey = storageKey;
    this._state = this._loadState();
    console.log(`[MockBrokerAPI] Initialized with storage key: ${this._localStorageKey}`);
  }

  private _loadState(): MockBrokerState {
    const defaultState = this._getDefaultState();
    try {
      // --- 核心修改 3: 使用动态的 key 从 localStorage 加载数据 ---
      const savedStateString = localStorage.getItem(this._localStorageKey);
      if (savedStateString) {
        console.log(`[MockBroker] Loaded state from localStorage using key: ${this._localStorageKey}`);
        const savedState = JSON.parse(savedStateString);
        // Safely merge saved state with default state to handle new fields
        return {
          ...defaultState,
          ...savedState,
          accountInfo: {
            ...defaultState.accountInfo,
            ...(savedState.accountInfo || {}),
            balances: { // Ensure balances object exists
                ...defaultState.accountInfo.balances,
                ...(savedState.accountInfo?.balances || {}),
            }
          },
        };
      }
    } catch (e) {
      console.error("[MockBroker] Failed to load state from localStorage", e);
    }
    return defaultState;
  }

  private _saveState() {
    try {
      // --- 核心修改 4: 使用动态的 key 保存数据到 localStorage ---
      localStorage.setItem(this._localStorageKey, JSON.stringify(this._state));
    } catch (e) {
      console.error("[MockBroker] Failed to save state to localStorage", e);
    }
  }

  private _getDefaultState(): MockBrokerState {
    const initialUSDT = 100000;
    return {
      accountInfo: {
        id: 'mock_account_001', name: 'Demo Account', currency: 'USD',
        balance: initialUSDT, equity: initialUSDT, realizedPnl: 0, unrealizedPnl: 0,
        margin: 0, orderMargin: 0, availableFunds: initialUSDT,
        balances: {
          'USDT': { free: initialUSDT, locked: 0, total: initialUSDT }
        }
      },
      positions: [], orders: [], executions: [],
      nextOrderId: 1, nextPositionId: 1,
    };
  }
  
  // 其余所有方法保持不变...
  private _recalculateAccountMetrics() {
    const accountInfo = this._state.accountInfo;
    
    let totalSpotBalance = 0;
    for (const symbol in accountInfo.balances) {
        const balance = accountInfo.balances[symbol];
        if (symbol === 'USDT' || symbol === 'USD') {
            totalSpotBalance += balance.total;
        } else {
            const price = this._lastPrices.get(`${symbol}-USDT`) ?? 0;
            totalSpotBalance += balance.total * price;
        }
    }
    accountInfo.balance = totalSpotBalance;

    let totalUnrealizedPnl = 0;
    let totalMargin = 0;
    this._state.positions.forEach(pos => {
      const lastPrice = this._lastPrices.get(pos.symbol) ?? pos.avgPrice;
      const pnl = (lastPrice - pos.avgPrice) * pos.qty * (pos.side === 'long' ? 1 : -1);
      pos.unrealizedPnl = pnl;
      totalUnrealizedPnl += pnl;
      totalMargin += (pos.avgPrice * pos.qty) / (pos.leverage ?? 10);
    });
    
    accountInfo.unrealizedPnl = totalUnrealizedPnl;
    accountInfo.equity = accountInfo.balance + totalUnrealizedPnl;
    accountInfo.margin = totalMargin;
    accountInfo.orderMargin = 0; // Simplified for now
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

  async deposit(asset: string, amount: number): Promise<void> {
    await sleep(500);
    if (amount <= 0) {
      throw new Error("Deposit amount must be positive.");
    }
    
    if (!this._state.accountInfo.balances[asset]) {
      this._state.accountInfo.balances[asset] = { free: 0, locked: 0, total: 0 };
    }
    const balance = this._state.accountInfo.balances[asset];
    balance.free += amount;
    balance.total += amount;
    
    console.log(`[MockBroker] Deposited ${amount} ${asset}. New balance:`, balance);
    this._recalculateAccountMetrics();
    this._callbacks?.onAccountInfoUpdate(this._state.accountInfo);
    this._saveState();
  }

  async withdraw(asset: string, amount: number): Promise<void> {
    await sleep(500);
    const balance = this._state.accountInfo.balances[asset];
    if (!balance || balance.free < amount || amount <= 0) {
      throw new Error("Insufficient funds for withdrawal.");
    }
    
    balance.free -= amount;
    balance.total -= amount;
    
    console.log(`[MockBroker] Withdrew ${amount} ${asset}. New balance:`, balance);
    this._recalculateAccountMetrics();
    this._callbacks?.onAccountInfoUpdate(this._state.accountInfo);
    this._saveState();
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