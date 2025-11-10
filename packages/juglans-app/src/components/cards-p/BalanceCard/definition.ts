// packages/juglans-app/src/components/chat/cards/BalanceCard/definition.ts
import { CardDefinition } from '../types';
import BalanceSummaryView from './BalanceSummaryView';
import BalanceModal from './BalanceModal';

export const balanceCardDefinition: CardDefinition = {
  // --- 配置 ---
  userSendable: true,            // 用户可以通过附件菜单或命令发送
  showInAttachmentList: true,    // 会显示在发送前的附件列表中
  isDraggable: true,             // 在聊天记录中可拖动

  // --- 视图 ---
  SummaryView: BalanceSummaryView,
  // DetailView: undefined,      // 此卡片没有单独的详细视图
  Modal: BalanceModal,
};