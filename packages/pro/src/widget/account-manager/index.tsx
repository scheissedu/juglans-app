// /klinecharts-workspace/packages/pro/src/widget/account-manager/index.tsx

import { Component, createSignal, For, Show, Accessor } from 'solid-js';
import { Table, TableColumn } from '../../component';
import { useBroker } from '../../api/BrokerAPIContext';
import { Position, Order, AccountInfo } from '../../types';

import PencilIcon from '../../component/icons/PencilIcon';
import CloseIcon from '../../component/icons/CloseIcon';
import ModifyPositionModal from './ModifyPositionModal';
import AccountSummary from './AccountSummary';

// +++ 新增 Props 类型定义 +++
export interface AccountManagerProps {
  accountInfo: Accessor<AccountInfo | null>;
  positions: Accessor<Position[]>;
  orders: Accessor<Order[]>;
  refetchPositions: () => void;
}

const AccountManager: Component<AccountManagerProps> = (props) => {
  const brokerApi = useBroker();
  const [activeTab, setActiveTab] = createSignal<'positions' | 'orders' | 'summary' | 'log'>('positions');
  
  const [modifyModalVisible, setModifyModalVisible] = createSignal(false);
  const [selectedPosition, setSelectedPosition] = createSignal<Position | null>(null);

  const tabs = [
    { key: 'positions', title: 'Positions' },
    { key: 'orders', title: 'Orders' },
    { key: 'log', title: 'Notifications log' },
  ];
  
  const handleModifyClick = (position: Position) => {
    setSelectedPosition(position);
    setModifyModalVisible(true);
  };

  const handleCloseClick = (positionId: string) => {
    if (confirm('Are you sure you want to close this position?')) {
      brokerApi?.closePosition(positionId).then(() => {
        setTimeout(() => props.refetchPositions(), 500); // 使用 prop 中的 refetch
      }).catch(err => {
        console.error("Failed to close position:", err);
        alert("Failed to close position.");
      });
    }
  };
  
  const handleConfirmModify = (sl_tp: { stopLoss?: number; takeProfit?: number }) => {
    const pos = selectedPosition();
    if (pos && brokerApi) {
        brokerApi.modifyPosition(pos.id, sl_tp).then(() => {
            setTimeout(() => props.refetchPositions(), 500); // 使用 prop 中的 refetch
        }).catch(err => {
            console.error("Failed to modify position:", err);
            alert("Failed to modify position.");
        });
    }
  };

  const positionColumns: TableColumn[] = [
    { key: 'symbol', title: 'Symbol', dataIndex: 'symbol' },
    { key: 'side', title: 'Side', dataIndex: 'side', render: (record: Position) => (
      <span style={{ color: record.side === 'long' ? '#2DC08E' : '#F92855' }}>
        {record.side.toUpperCase()}
      </span>
    )},
    { key: 'qty', title: 'Qty', dataIndex: 'qty', align: 'right' },
    { key: 'avgPrice', title: 'Avg Fill Price', dataIndex: 'avgPrice', align: 'right' },
    { key: 'last', title: 'Last', dataIndex: 'last', align: 'right', render: (r: any) => r.last?.toFixed(2) ?? 'N/A' },
    { key: 'profit', title: 'Profit', dataIndex: 'unrealizedPnl', align: 'right', render: (r: Position) => (
      <span style={{ color: (r.unrealizedPnl ?? 0) >= 0 ? '#2DC08E' : '#F92855' }}>
        {r.unrealizedPnl?.toFixed(2) ?? '0.00'}
      </span>
    )},
    { key: 'stopLoss', title: 'Stop Loss', dataIndex: 'stopLoss', align: 'right' },
    { key: 'takeProfit', title: 'Take Profit', dataIndex: 'takeProfit', align: 'right' },
    {
      key: 'actions',
      title: 'Actions',
      align: 'right',
      render: (record: Position) => (
        <div class="position-actions">
          <button onClick={() => handleModifyClick(record)}><PencilIcon /></button>
          <button onClick={() => handleCloseClick(record.id)}><CloseIcon /></button>
        </div>
      )
    }
  ];

  return (
    <>
      <div class="klinecharts-pro-account-manager">
        {/* +++ 从 props 读取数据 +++ */}
        <AccountSummary info={props.accountInfo()} />
        <div class="tabs">
          <For each={tabs}>
            {(tab) => (
              <button
                class={`tab-item ${activeTab() === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.title}
              </button>
            )}
          </For>
        </div>
        <div class="tab-content">
          <Show when={activeTab() === 'positions'}>
            <Table
              columns={positionColumns}
              dataSource={props.positions()}
            />
          </Show>
          <Show when={activeTab() === 'orders'}>
            <div style={{ padding: '20px', 'text-align': 'center' }}>Orders will be displayed here.</div>
          </Show>
          <Show when={activeTab() === 'log'}>
            <div style={{ padding: '20px', 'text-align': 'center' }}>Notification log will be displayed here.</div>
          </Show>
        </div>
      </div>
      <Show when={modifyModalVisible()}>
        <ModifyPositionModal
          position={selectedPosition()}
          onClose={() => setModifyModalVisible(false)}
          onConfirm={handleConfirmModify}
        />
      </Show>
    </>
  );
};

export default AccountManager;