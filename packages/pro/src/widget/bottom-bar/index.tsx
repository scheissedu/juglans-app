// /klinecharts-workspace/packages/pro/src/widget/bottom-bar/index.tsx

import { Component } from 'solid-js';
import i18n from '../../i18n';

export interface BottomBarProps {
  locale: string;
  accountManagerVisible: boolean;
  tradePanelVisible: boolean;
  onAccountManagerClick: () => void;
  onTradeClick: () => void;
}

const BottomBar: Component<BottomBarProps> = (props) => {
  return (
    <div class="klinecharts-pro-bottom-bar">
      <div class="klinecharts-pro-bottom-bar-left">
        <button
          // Use classList for dynamic classes
          classList={{ 
            'item': true, 
            'active': props.accountManagerVisible 
          }}
          onClick={props.onAccountManagerClick}
        >
          Account Manager
        </button>
        <button
          classList={{
            'item': true,
            'active': props.tradePanelVisible
          }}
          onClick={props.onTradeClick}
        >
          Trade
        </button>
      </div>
    </div>
  );
};

export default BottomBar;