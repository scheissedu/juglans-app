import { Component, For } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Modal, Table, type TableColumn } from '@klinecharts/pro';
import type { Position } from '@klinecharts/pro';
// 1. 移除 useChartPro 的导入
// import { useChartPro } from '../../context/ChartProContext';

interface PositionModalProps {
  positions: Position[];
  theme: 'light' | 'dark'; // 2. 新增 theme prop
  onClose: () => void;
}

const PositionModal: Component<PositionModalProps> = (props) => {
  // 3. 直接使用 props.theme
  const currentTheme = () => props.theme;

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
        class="chart-preview-modal" 
        data-theme={currentTheme()}
        title="My Open Positions"
        width={800}
        onClose={props.onClose}
      >
        <div style={{ height: '450px', 'margin-top': '20px' }}>
          <Table
            columns={columns}
            dataSource={props.positions}
          />
        </div>
      </Modal>
    </Portal>
  );
};

export default PositionModal;