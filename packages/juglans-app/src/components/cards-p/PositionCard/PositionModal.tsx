// packages/juglans-app/src/components/chat/cards/PositionCard/PositionModal.tsx
import { Component } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Modal, Table, type TableColumn } from '@klinecharts/pro';
import { PositionCardData } from './types';
import type { Position } from '@klinecharts/pro';

interface PositionModalProps {
  data: PositionCardData;
  theme: 'light' | 'dark';
  onClose: () => void;
}

const PositionModal: Component<PositionModalProps> = (props) => {
  const columns: TableColumn[] = [
    { key: 'symbol', title: 'Symbol', dataIndex: 'symbol' },
    { 
      key: 'side', 
      title: 'Side', 
      dataIndex: 'side', 
      render: (record: Position) => (
        <span style={{ color: record.side === 'long' ? '#2DC08E' : '#F92855' }}>
          {record.side.toUpperCase()}
        </span>
      )
    },
    { key: 'qty', title: 'Quantity', dataIndex: 'qty', align: 'right' },
    { key: 'avgPrice', title: 'Avg. Price', dataIndex: 'avgPrice', align: 'right' },
    { 
      key: 'pnl', 
      title: 'Unrealized P/L', 
      dataIndex: 'unrealizedPnl', 
      align: 'right',
      render: (record: Position) => (
        <span style={{ color: (record.unrealizedPnl ?? 0) >= 0 ? '#2DC08E' : '#F92855' }}>
          {record.unrealizedPnl?.toFixed(2) ?? 'N/A'}
        </span>
      )
    },
  ];

  return (
    <Portal>
      <Modal
        class="card-details-modal" 
        data-theme={props.theme}
        title="My Open Positions"
        width={800}
        onClose={props.onClose}
      >
        <div style={{ height: '450px', 'margin-top': '20px' }}>
          <Table
            columns={columns}
            dataSource={props.data}
          />
        </div>
      </Modal>
    </Portal>
  );
};

export default PositionModal;