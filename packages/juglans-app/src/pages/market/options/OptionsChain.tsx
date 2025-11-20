// packages/juglans-app/src/pages/market/options/OptionsChain.tsx
import { Component, createSignal, createResource, For, Show, createMemo, createEffect } from 'solid-js';
import { Loading } from '@klinecharts/pro';
import UnifiedDatafeed from '@/api/datafeed/UnifiedDatafeed';
import OptionsChainRow from './OptionsChainRow';
import type { OptionData, ProcessedOptionsChain } from '@/types';
import './OptionsChain.css';

const datafeed = new UnifiedDatafeed();

interface OptionsChainProps {
  underlyingAsset: string;
}

const formatExpiryLabel = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase();
};

const OptionsChain: Component<OptionsChainProps> = (props) => {
  const [rawOptionsData] = createResource(
    () => props.underlyingAsset,
    datafeed.getRawOptionsData.bind(datafeed)
  );

  const expiryDates = createMemo(() => {
    const data = rawOptionsData();
    if (!data) return [];
    
    const expirySet = new Set<string>();
    for (const opt of data) {
      if (!opt.instId) continue;
      const parts = opt.instId.split('-');
      if (parts.length === 5) {
        const dateStr = parts[2];
        const formattedDate = `20${dateStr.slice(0, 2)}-${dateStr.slice(2, 4)}-${dateStr.slice(4, 6)}`;
        expirySet.add(formattedDate);
      }
    }
    return Array.from(expirySet).sort();
  });

  const [selectedExpiry, setSelectedExpiry] = createSignal<string>();

  createEffect(() => {
    const dates = expiryDates();
    if (dates.length > 0 && !selectedExpiry()) {
      setSelectedExpiry(dates[0]);
    }
  });

  const processedData = createMemo<ProcessedOptionsChain | null>(() => {
    const data = rawOptionsData();
    const expiry = selectedExpiry();
    if (!data || !expiry) return null;

    const expiryFilter = expiry.replace(/-/g, '').slice(-6);
    const chain: ProcessedOptionsChain = new Map();
    const optionsForExpiry = data.filter((opt: any) => opt.instId && opt.instId.includes(`-${expiryFilter}-`));

    for (const opt of optionsForExpiry) {
      const parts = opt.instId.split('-');
      if (parts.length !== 5) continue;

      const strike = parseFloat(parts[3]); 
      if (isNaN(strike)) continue;

      const typeCharacter = parts[4].toLowerCase();

      if (!chain.has(strike)) {
        chain.set(strike, {});
      }

      const bid = parseFloat(opt.bidPx || "0");
      const ask = parseFloat(opt.askPx || "0");
      const mark = (bid > 0 && ask > 0) ? (bid + ask) / 2 : (bid || ask);

      const optionData: OptionData = {
        instrumentId: opt.instId,
        last: parseFloat(opt.last || "0"),
        bid: bid,
        ask: ask,
        iv: parseFloat(opt.volLv || "0") * 100,
        delta: parseFloat(opt.delta || "0"),
        mark: mark,
        vega: parseFloat(opt.vega || "0"),
        bidSize: parseFloat(opt.bidSz || "0"),
        askSize: parseFloat(opt.askSz || "0"),
      };

      const entry = chain.get(strike)!;
      if (typeCharacter === 'c') {
        entry.call = optionData;
      } else if (typeCharacter === 'p') {
        entry.put = optionData;
      }
    }
    
    return chain;
  });

  const sortedStrikes = createMemo(() => {
    const data = processedData();
    if (!data) return [];
    return Array.from(data.keys()).sort((a, b) => a - b);
  });

  const instrumentFamily = () => `${props.underlyingAsset}-USD`;

  return (
    <div class="options-chain-container">
      <div class="options-chain-header">
        <Show when={!rawOptionsData.loading} fallback={<Loading />}>
          <div class="expiry-selector-wrapper">
            <button class="instrument-family-selector">
              <span>{instrumentFamily()}</span>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"></path></svg>
            </button>
            <div class="expiry-selector">
              <For each={expiryDates()}>
                {(date) => (
                  <button 
                    class="expiry-tab"
                    classList={{ active: selectedExpiry() === date }}
                    onClick={() => setSelectedExpiry(date)}
                  >
                    {formatExpiryLabel(date)}
                  </button>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>

      <div class="options-chain-grid-wrapper">
        <Show when={!rawOptionsData.loading && processedData()} fallback={<Loading />}>
          {(data) => (
            <Show when={sortedStrikes().length > 0} fallback={<div style="text-align: center; padding: 40px; color: var(--light-gray);">No options data for this expiry.</div>}>
              <div class="options-chain-grid">
                <div class="options-chain-grid-header">
                  <div class="calls-header">
                    <div class="header-cell" style="text-align: left;">Bid Sz</div>
                    <div class="header-cell">Bid</div>
                    <div class="header-cell">Mark</div>
                    <div class="header-cell">Ask</div>
                    <div class="header-cell">Ask Sz</div>
                    <div class="header-cell">Delta</div>
                    <div class="header-cell">Vega</div>
                  </div>
                  <div class="header-cell strike-header">Strike</div>
                  <div class="puts-header">
                    <div class="header-cell">Vega</div>
                    <div class="header-cell">Delta</div>
                    <div class="header-cell">Ask Sz</div>
                    <div class="header-cell">Ask</div>
                    <div class="header-cell">Mark</div>
                    <div class="header-cell">Bid</div>
                    <div class="header-cell">Bid Sz</div>
                  </div>
                </div>
                
                <For each={sortedStrikes()}>
                  {(strike) => (
                    <OptionsChainRow 
                      strike={strike}
                      call={data().get(strike)?.call}
                      put={data().get(strike)?.put}
                    />
                  )}
                </For>
              </div>
            </Show>
          )}
        </Show>
      </div>
    </div>
  );
};

export default OptionsChain;