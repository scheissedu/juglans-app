// /klinecharts-workspace/packages/preview/src/KLineDataNode.ts

import { Node } from '@tiptap/core';

export const KLineDataNode = Node.create({
  name: 'klineDataBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      symbol: {
        default: null,
      },
      period: {
        default: null,
      },
      data: {
        default: '[]', // 将 KLineData 数组存储为 JSON 字符串
      },
    };
  },

  parseHTML() {
    return [{ tag: 'kline-data-block' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['kline-data-block', HTMLAttributes];
  },
});