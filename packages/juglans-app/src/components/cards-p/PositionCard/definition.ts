// packages/juglans-app/src/components/chat/cards/PositionCard/definition.ts
import { CardDefinition } from '../types';
import PositionSummaryView from './PositionSummaryView';
import PositionModal from './PositionModal';

export const positionCardDefinition: CardDefinition = {
  // --- 配置 ---
  userSendable: true,
  showInAttachmentList: true,
  isDraggable: true,

  // --- 视图 ---
  SummaryView: PositionSummaryView,
  Modal: PositionModal,
};