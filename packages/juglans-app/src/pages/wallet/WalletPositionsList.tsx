// packages/juglans-app/src/pages/wallet/WalletPositionsList.tsx

import { Component, createSignal, Show } from 'solid-js';
// --- 核心修正：从 @klinecharts/pro 导入所需的所有内容 ---
import { Table, useBroker, type TableColumn, type Position } from '@klinecharts/pro';
import EmptyState from '../../components/common/EmptyState';
import PencilIcon from '../../components/icons/PencilIcon';
import CloseIcon from '../../components/icons/CloseIcon';
import ModifyPositionModal from '../../components/modals/ModifyPositionModal';

interface WalletPositionsListProps {
  positions: Position[];
  onRefetch: () => void;
}

const WalletPositionsList: Component<WalletPositionsListProps> = (props) => {
  const brokerApi = useBroker();
  const [modifyModalVisible, setModifyModalVisible] = createSignal(false);
  const [selectedPosition, setSelectedPosition] = createSignal<Position | null>(null);

  const handleModifyClick = (position: Position) => {
    setSelectedPosition(position);
    setModifyModalVisible(true);
  };

  const handleCloseClick = (positionId: string) => {
    if (confirm('Are you sure you want to close this position?')) {
      brokerApi?.closePosition(positionId)
        .then(() => setTimeout(props.onRefetch, 500))
        .catch(err => alert(`Failed to close position: ${err.message}`));
    }
  };
  
  const handleConfirmModify = (sl_tp: { stopLoss?: number; takeProfit?: number }) => {
    const pos = selectedPosition();
    if (pos && brokerApi) {
      brokerApi.modifyPosition(pos.id, sl_tp)
        .then(() => setTimeout(props.onRefetch, 500))
        .catch(err => alert(`Failed to modify position: ${err.message}`));
    }
  };

  const positionColumns: TableColumn[] = [
    { key: 'symbol', title: 'Symbol', dataIndex: 'symbol' },
    { key: 'side', title: 'Side', dataIndex: 'side', render: (r: Position) => <span class={r.side === 'long' ? 'side-long' : 'side-short'}>{r.side.toUpperCase()}</span> },
    { key: 'qty', title: 'Quantity', dataIndex: 'qty', align: 'right' },
    { key: 'avgPrice', title: 'Avg. Price', dataIndex: 'avgPrice', align: 'right' },
    { key: 'unrealizedPnl', title: 'Unrealized P/L', dataIndex: 'unrealizedPnl', align: 'right', render: (r: Position) => <span class={(r.unrealizedPnl ?? 0) >= 0 ? 'pnl-up' : 'pnl-down'}>{r.unrealizedPnl?.toFixed(2) ?? '0.00'}</span> },
    { key: 'actions', title: 'Actions', align: 'right', render: (record: Position) => (
        <div class="position-actions">
          <button onClick={() => handleModifyClick(record)}><PencilIcon /></button>
          <button onClick={() => handleCloseClick(record.id)}><CloseIcon /></button>
        </div>
    )}
  ];

  return (
    <div class="wallet-table-container">
      <Show when={props.positions.length > 0} fallback={<EmptyState message="No Open Positions" />}>
        <Table columns={positionColumns} dataSource={props.positions} />
      </Show>
      <Show when={modifyModalVisible()}>
        <ModifyPositionModal
          position={selectedPosition()}
          onClose={() => setModifyModalVisible(false)}
          onConfirm={handleConfirmModify}
        />
      </Show>
    </div>
  );
};

export default WalletPositionsList;