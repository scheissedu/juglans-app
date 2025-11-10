// packages/juglans-app/src/components/chat/cards/KLineDataCard/definition.ts
import { CardDefinition } from '../types';
import KLineSummaryView from './KLineSummaryView';
import KLineModal from './KLineModal';

export const klineCardDefinition: CardDefinition = {
  // --- 配置 ---
  userSendable: true,
  showInAttachmentList: true,
  isDraggable: true,

  // --- 视图 ---
  SummaryView: KLineSummaryView,
  Modal: KLineModal,
};