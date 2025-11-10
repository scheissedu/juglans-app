// packages/juglans-app/src/components/chat/cards-p/CardRenderer.tsx
import { Component, createMemo, createSignal, Show } from 'solid-js';
import { NodeViewWrapper } from 'tiptap-solid';
import { cardRegistry } from './index';
import { CardComponentProps } from './types';
import { Dynamic } from 'solid-js/web';

const CardRenderer: Component<CardComponentProps> = (props) => {
  const [modalVisible, setModalVisible] = createSignal(false);

  const cardDef = createMemo(() => {
    const type = props.node.attrs.type;
    return type ? cardRegistry.get(type) : null;
  });

  const ViewComponent = createMemo(() => {
    const def = cardDef();
    if (props.node.attrs.type === 'tradeSuggestion' && def?.DetailView) {
      return def.DetailView;
    }
    return def?.SummaryView;
  });

  const ModalComponent = createMemo(() => cardDef()?.Modal);

  const openModal = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('.card-remove-btn')) {
        return;
    }
    if (ModalComponent()) {
      setModalVisible(true);
    }
  };

  const closeModal = () => setModalVisible(false);

  return (
    <NodeViewWrapper class="card-node-wrapper">
      <Show when={ViewComponent()} fallback={<div>Unknown Card Type</div>}>
        {/* --- 核心修改: 移除这里的 onClick, 并通过 onCardClick prop 传递 openModal 函数 --- */}
        <Dynamic component={ViewComponent()!} {...props} onCardClick={openModal} />
      </Show>

      <Show when={modalVisible() && ModalComponent()}>
        <Dynamic
          component={ModalComponent()!}
          data={props.node.attrs.data}
          onClose={closeModal}
          theme={'dark'}
        />
      </Show>
    </NodeViewWrapper>
  );
};

export default CardRenderer;