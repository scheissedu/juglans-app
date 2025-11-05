// /klinecharts-workspace/packages/pro/src/widget/account-manager/AccountSummary.tsx

import { Component, Show } from 'solid-js';
import type { AccountInfo } from '../../types';

interface AccountSummaryProps {
  info: AccountInfo | null;
}

const formatCurrency = (value: number | undefined) => {
  return value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00';
};

const DataPoint: Component<{ label: string, value: string | number, color?: string }> = (props) => (
  <div class="summary-item">
    <div class="label">{props.label}</div>
    <div class="value" style={{ color: props.color }}>{props.value}</div>
  </div>
);

const AccountSummary: Component<AccountSummaryProps> = (props) => {
  return (
    <div class="klinecharts-pro-account-summary">
      <div class="summary-grid">
        <DataPoint label="账户余额" value={formatCurrency(props.info?.balance)} />
        <DataPoint label="净值" value={formatCurrency(props.info?.equity)} />
        <DataPoint label="已实现P&L" value={formatCurrency(props.info?.realizedPnl)} />
        <DataPoint 
          label="未实现盈亏" 
          value={formatCurrency(props.info?.unrealizedPnl)} 
          color={(props.info?.unrealizedPnl ?? 0) < 0 ? '#F92855' : '#2DC08E'}
        />
        <DataPoint label="账户保证金" value={formatCurrency(props.info?.margin)} />
        <DataPoint label="可用资金" value={formatCurrency(props.info?.availableFunds)} />
        <DataPoint label="订单保证金" value={formatCurrency(props.info?.orderMargin)} />
      </div>
    </div>
  );
};

export default AccountSummary;