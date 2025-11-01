// /klinecharts-workspace/packages/preview/src/SuggestionList.tsx

import { Component, For, onMount, createEffect } from 'solid-js';
import './SuggestionList.css';

export interface SuggestionItem {
  key: string;
  label: string;
  description: string;
}

interface SuggestionListProps {
  items: SuggestionItem[];
  command: (params: { item: SuggestionItem }) => void; // <--- 修改 command 的参数类型
  selectedIndex: number;
}

const SuggestionList: Component<SuggestionListProps> = (props) => {

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      // --- 关键修改：用对象包裹 item ---
      props.command({ item });
    }
  };

  // onMount 钩子现在负责将内部的 onKeyDown 方法暴露给 Tiptap
  // Tiptap 的 suggestion render() 返回的对象中有一个特殊的 onKeyDown 方法可以接收这个回调
  // 这段代码是 tiptap-solid 官方推荐的处理键盘导航的方式
  onMount(() => {
    const onKeyDown = ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        (props as any).updateSelectedIndex((props.selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        (props as any).updateSelectedIndex((props.selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(props.selectedIndex);
        return true;
      }
      return false;
    };
    // 将内部的键盘处理逻辑暴露给父级（Tiptap suggestion utility）
    (props as any).ref.onKeyDown = onKeyDown;
  });

  return (
    <div class="suggestion-list">
      <For each={props.items}>
        {(item, index) => (
          <button
            class="suggestion-item"
            classList={{ 'is-selected': index() === props.selectedIndex }}
            onClick={() => selectItem(index())}
          >
            <div class="item-label">{item.label}</div>
            <div class="item-description">{item.description}</div>
          </button>
        )}
      </For>
    </div>
  );
};

export default SuggestionList;