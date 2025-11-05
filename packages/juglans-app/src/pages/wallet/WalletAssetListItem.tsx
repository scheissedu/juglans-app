import { Component } from 'solid-js';
import CryptoIcon from '../../components/icons/CryptoIcon';
import './Wallet.css';

interface WalletAssetListItemProps {
  symbol: string;
  name: string;
  usdValue: number;
  amount: number;
}

const WalletAssetListItem: Component<WalletAssetListItemProps> = (props) => {
  return (
    <div class="wallet-asset-item">
      <div class="asset-info">
        <CryptoIcon symbol={props.symbol} />
        <div class="asset-names">
          <div class="asset-short-name">{props.symbol}</div>
          <div class="asset-long-name">{props.name}</div>
        </div>
      </div>
      
      {/* Mini-chart placeholder */}
      <div class="mini-chart-placeholder">
         <svg viewBox="0 0 100 30" class="sparkline">
            <path d="M0,15 L10,12 L20,18 L30,15 L40,12 L50,8 L60,15 L70,20 L80,15 L90,18 L100,22" fill="none" stroke="#2DC08E" stroke-width="2"/>
        </svg>
      </div>

      <div class="asset-balance">
        <div class="asset-usd-value">${props.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="asset-amount">{props.amount.toFixed(4)} {props.symbol}</div>
      </div>
    </div>
  );
};

export default WalletAssetListItem;