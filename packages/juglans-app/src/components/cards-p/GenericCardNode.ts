// packages/juglans-app/src/components/chat/cards/GenericCardNode.ts
import { Node } from '@tiptap/core';

export const GenericCardNode = Node.create({
  name: 'cardBlock', // 统一的节点名称
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      type: { default: null }, // CardType
      data: { default: null }, // Card-specific data
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-card-type]' }];
  },

  renderHTML({ HTMLAttributes }) {
    // 将类型和数据序列化到 DOM 属性上
    return ['div', { 
      'data-card-type': HTMLAttributes.type,
      'data-card-data': JSON.stringify(HTMLAttributes.data) 
    }, 0];
  },
});