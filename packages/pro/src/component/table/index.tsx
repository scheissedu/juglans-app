// /klinechafrts-workspace/packages/pro/src/component/table/index.tsx

import { Component, For, JSX } from 'solid-js';
import { List } from '../';

export interface Column {
  key: string;
  title: string;
  dataIndex: string;
  align?: 'left' | 'right' | 'center';
  render?: (record: any) => JSX.Element;
}

export interface TableProps {
  class?: string;
  columns: Column[];
  dataSource: any[];
  loading?: boolean;
}

const Table: Component<TableProps> = (props) => {
  return (
    <div class={`klinecharts-pro-table ${props.class ?? ''}`}>
      <div class="table-header">
        <For each={props.columns}>
          {(col) => (
            <div class="th" style={{ 'text-align': col.align ?? 'left' }}>
              {col.title}
            </div>
          )}
        </For>
      </div>
      <div class="table-body">
        <List
          loading={props.loading}
          dataSource={props.dataSource}
          renderItem={(record) => (
            <div class="tr">
              <For each={props.columns}>
                {(col) => (
                  <div class="td" style={{ 'text-align': col.align ?? 'left' }}>
                    {col.render ? col.render(record) : record[col.dataIndex]}
                  </div>
                )}
              </For>
            </div>
          )}
        />
      </div>
    </div>
  );
};

export default Table;