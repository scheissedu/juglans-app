import { render } from 'solid-js/web';
import { Chart, KLineData, Nullable, SymbolInfo, Period } from '@klinecharts/core';
import { ChartProLight, ChartProLightOptions } from './types';
import ChartProLightComponent from './KLineChart.light';
import './index.less';

export default class KLineChartLight implements ChartProLight {
  private _container: Nullable<HTMLElement> = null;
  private _chart: Nullable<Chart> = null;
  private _unmount: () => void = () => {};

  constructor(options: ChartProLightOptions) {
    const { container } = options;
    if (typeof container === 'string') {
      this._container = document.getElementById(container);
    } else {
      this._container = container;
    }

    if (!this._container) {
      throw new Error('Container not found');
    }

    const symbol: SymbolInfo = typeof options.symbol === 'string' 
      ? { ticker: options.symbol } 
      : options.symbol;

    this._unmount = render(() => 
      <ChartProLightComponent 
        {...options}
        symbol={symbol}
        ref={(c) => { this._chart = c; }}
      />, 
      this._container!
    );
  }

  getChart(): Chart | null {
    return this._chart;
  }

  updateData(data: KLineData): void {
    this._chart?.updateData(data);
  }

  destroy(): void {
    if (this._container) {
      this._unmount();
      this._container.innerHTML = '';
      this._chart = null;
      this._container = null;
    }
  }
}

export * from './types';