// packages/juglans-app/src/components/cards-p/SymbolInfoCard/SymbolInfoSummaryView.tsx
import { Component, Show } from 'solid-js';
import { CardComponentProps } from '../types';
import { SymbolInfoCardData } from './types';
import AssetIcon from '@/components/icons/AssetIcon';
import '../styles/SummaryCard.css';

const SymbolInfoSummaryView: Component<CardComponentProps<SymbolInfoCardData>> = (props) => {
  const symbolInfo = () => props.node.attrs.data;
  const baseSymbol = () => (symbolInfo().shortName ?? symbolInfo().ticker).split('-')[0];
  const assetType = () => (symbolInfo().market === 'stocks' ? 'stock' : 'crypto');

  const summaryText = () => {
    const info = symbolInfo();
    return `Exchange: ${info.exchange || 'N/A'}, Type: ${info.type || 'N/A'}`;
  };

  return (
    <div class="summary-card-wrapper">
      <div class="summary-card">
        <div class="card-header">
          <span class="header-title">
            <AssetIcon symbol={baseSymbol()} assetType={assetType()} />
            {symbolInfo().ticker}
          </span>
          <Show when={props.deleteNode}>
            <button
              class="card-remove-btn"
              onClick={(e) => { e.stopPropagation(); props.deleteNode?.(); }}
            >
              ×
            </button>
          </Show>
        </div>
        <div class="summary-content">
          {summaryText()}
        </div>
      </div>
    </div>
  );
};

export default SymbolInfoSummaryView;