// packages/juglans-app/src/components/chat/cards/TradeSuggestionCard/definition.ts
import { CardDefinition } from '../types';
import TradeSuggestionDetailView from './TradeSuggestionDetailView';
// TradeSuggestionCard 没有独立的 Modal，它的交互逻辑在 DetailView 内部处理

export const tradeSuggestionCardDefinition: CardDefinition = {
  // --- 配置 ---
  userSendable: false,            // 用户不能主动发送
  showInAttachmentList: false,    // 不在附件列表中显示
  isDraggable: false,             // 通常 AI 生成的建议不应被拖动

  // --- 视图 ---
  SummaryView: TradeSuggestionDetailView, // 对于此卡，摘要视图就是详细视图
  DetailView: TradeSuggestionDetailView,
  // Modal: undefined // 此卡片的确认弹窗由 DetailView 内部触发
};