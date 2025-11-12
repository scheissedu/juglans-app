// packages/juglans-app/src/components/cards-p/SymbolInfoCard/definition.ts
import { CardDefinition } from '../types';
import SymbolInfoSummaryView from './SymbolInfoSummaryView';

export const symbolInfoCardDefinition: CardDefinition = {
  // --- 配置 ---
  userSendable: true,
  showInAttachmentList: true,
  isDraggable: true,

  // --- 视图 ---
  SummaryView: SymbolInfoSummaryView,
  // 此卡片非常简单，不需要 DetailView 或 Modal
};