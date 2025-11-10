// packages/juglans-app/src/components/chat/cards-p/types.ts

import { Component } from 'solid-js';

export type CardType = 'tradeSuggestion' | 'kline' | 'position' | 'balance';

export interface CardNodeData<T = any> {
  type: CardType;
  data: T;
}

export interface CardComponentProps<T = any> {
  node: { attrs: CardNodeData<T> };
  deleteNode?: () => void;
  // --- 核心修改: 添加 onCardClick 属性 ---
  onCardClick?: (e: MouseEvent) => void;
}

export interface CardDefinition {
  userSendable: boolean;
  showInAttachmentList: boolean;
  isDraggable: boolean;
  SummaryView: Component<CardComponentProps>;
  DetailView?: Component<CardComponentProps>;
  Modal?: Component<{ data: any; theme: 'light' | 'dark'; onClose: () => void }>;
}