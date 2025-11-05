// packages/pro/src/component/list/index.tsx

import { ParentComponent, ParentProps, JSX, Show, splitProps } from 'solid-js';

import Loading from '../loading';
import Empty from '../empty';

export interface ListProps extends ParentProps, JSX.HTMLAttributes<HTMLUListElement> {
  class?: string;
  style?: JSX.CSSProperties | string;
  loading?: boolean;
  dataSource?: any[];
  renderItem?: (data: any) => JSX.Element;
}

const List: ParentComponent<ListProps> = props => {
  const [local, rest] = splitProps(props, [
    'class', 'style', 'loading', 'dataSource', 'renderItem', 'children'
  ]);

  return (
    <ul
      style={local.style}
      class={`klinecharts-pro-list ${local.class ?? ''}`}
      {...rest}
    >
      <Show when={local.loading}>
        <Loading/>
      </Show>
      <Show when={!local.loading && !local.children && !local.dataSource?.length}>
        <Empty/>
      </Show>
      <Show when={local.children}>
        {local.children}
      </Show>
      <Show when={!local.children}>
        {
          local.dataSource?.map(data => (
            local.renderItem?.(data) ?? <li></li>
          ))
        }
      </Show>
    </ul>
  );
};

export default List;