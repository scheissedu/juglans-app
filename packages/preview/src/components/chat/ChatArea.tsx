// /klinecharts-workspace/packages/preview/src/components/chat/ChatArea.tsx

import { Component, createSignal, For, onCleanup, Show, createEffect, onMount } from 'solid-js';
import './ChatArea.css';
import './SuggestionList.css';
import './ModelSelector.css';
import './ChatMenu.css';
import './ContextCheckboxes.css';

import SendIcon from '../icons/SendIcon';
import PlusIcon from '../icons/PlusIcon';
import HamburgerIcon from '../icons/HamburgerIcon';
import RichInput from './RichInput';
import { Chart, KLineData } from '@klinecharts/core';
import { Editor, type JSONContent } from '@tiptap/core';
import { SolidRenderer } from 'tiptap-solid';

import EditorContext, { useEditor, type EditorContextState } from '../../context/EditorContext';
import { useChartPro } from '../../context/ChartProContext';
import { useBrokerState } from '@klinecharts/pro/src/api/BrokerStateContext';

import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import tippy, { type Instance as TippyInstance } from 'tippy.js';

import KLineDataCard from './KLineDataCard';
import PositionCard from './PositionCard';
import MessageRenderer from './MessageRenderer';
import TradeSuggestionCard, { type TradeSuggestion } from './TradeSuggestionCard';
import SuggestionList, { type SuggestionItem } from './SuggestionList';
import TradeConfirmModal from '../modals/TradeConfirmModal';
import { BrokerAPI, Position, OrderParams, OrderSide, OrderType, ChartPro } from '@klinecharts/pro';
import ModelSelector, { type Model } from './ModelSelector';
import ChatMenu from './ChatMenu';
import ContextCheckboxes from './ContextCheckboxes';

interface ImageAttachment { type: 'image'; url: string; id: string; }
interface KLineAttachment { type: 'kline'; symbol: string; period: string; data: string; id: string; }
interface PositionAttachment { type: 'position'; data: string; id: string; }
type Attachment = ImageAttachment | KLineAttachment | PositionAttachment;

interface TextMessage {
  role: 'user' | 'assistant';
  type: 'text';
  text: JSONContent | null;
  attachments: Attachment[];
  thinking?: boolean;
}
interface ToolCallMessage {
  role: 'assistant';
  type: 'tool_call';
  tool_name: string;
  tool_params: any;
}
type Message = TextMessage | ToolCallMessage;


const WelcomeArea: Component = () => (
  <div class="welcome-area">
    <div class="welcome-icon">🧠</div>
    <div class="welcome-text">How can I assist you today?</div>
  </div>
);

const ChatAreaProvider: Component = () => {
  const [editorSignal, setEditorSignal] = createSignal<Editor | null>(null);
  const editorContextValue: EditorContextState = {
    editor: editorSignal,
    setEditor: setEditorSignal,
  };
  return (<EditorContext.Provider value={editorContextValue}><ChatArea /></EditorContext.Provider>);
};

const ChatArea: Component = () => {
  const { editor, setEditor } = useEditor();
  const { chart: chartProInstance } = useChartPro();
  const [brokerState] = useBrokerState();

  const [messages, setMessages] = createSignal<Message[]>([]);
  const [inputValue, setInputValue] = createSignal('');
  const [attachments, setAttachments] = createSignal<Attachment[]>([]);
  const [isMenuOpen, setIsMenuOpen] = createSignal(false);
  let messageListRef: HTMLDivElement | undefined;
  let fileInputRef: HTMLInputElement | undefined;
  let menuContainerRef: HTMLDivElement | undefined;

  const availableModels: Model[] = [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek', logo: '/deepseek.png' },
    { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'DeepSeek', logo: '/deepseek.png' },
  ];
  const [selectedModel, setSelectedModel] = createSignal<Model>(availableModels[0]);
  
  const [marketContextChecked, setMarketContextChecked] = createSignal(true);
  const [myContextChecked, setMyContextChecked] = createSignal(true);

  const handleClearConversation = () => {
    setMessages([]);
    setIsMenuOpen(false);
  };

  const handleExportChat = () => {
    const getTextFromContent = (content: JSONContent | null): string => {
      if (!content || !content.content) return '';
      return content.content.map(node => {
        if (node.type === 'text') return node.text;
        if (node.content) return getTextFromContent(node);
        return '';
      }).join('\n');
    };

    let chatContent = '';
    messages().forEach(msg => {
      const role = msg.role.toUpperCase();
      if (msg.type === 'text') {
        chatContent += `[${role}]\n`;
        const text = getTextFromContent(msg.text);
        if (text) chatContent += `${text}\n`;
        msg.attachments.forEach(att => {
          chatContent += `[Attachment: ${att.type}]\n`;
        });
        chatContent += '\n';
      } else if (msg.type === 'tool_call' && msg.tool_name === 'create_trade_suggestion') {
        chatContent += `[${role} - TRADE SUGGESTION]\n`;
        chatContent += `${msg.tool_params.summary}\n\n`;
      }
    });

    const blob = new Blob([chatContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsMenuOpen(false);
  };
  
  const handleClickOutside = (e: MouseEvent) => {
    if (menuContainerRef && !menuContainerRef.contains(e.target as Node)) {
      setIsMenuOpen(false);
    }
  };
  
  const handleSelectKLine = () => {
    const proChart = chartProInstance();
    const chart = proChart?.getChart();
    if (!chart) {
        console.error("Chart is not available to start selection.");
        return;
    }
    
    if (chart.getOverlayById('robot_selection_rect_instance')) {
        console.warn("A selection process is already active.");
        chart.removeOverlay('robot_selection_rect_instance');
    }
    
    chart.createOverlay({
      name: 'rect',
      id: 'robot_selection_rect_instance',
      groupId: 'robot_selection_rect',
      lock: false,
      styles: {
        polygon: { color: 'rgba(255, 165, 0, 0.2)', borderColor: '#FF9600', borderStyle: 'dashed' }
      },
      onDrawEnd: (event) => {
        const { overlay } = event;
        const points = overlay.points;
        if (points.length === 2 && points[0].dataIndex !== undefined && points[1].dataIndex !== undefined) {
          const startIndex = Math.min(points[0].dataIndex, points[1].dataIndex);
          const endIndex = Math.max(points[0].dataIndex, points[1].dataIndex);
          const allData = chart.getDataList();
          const selectedData = allData.slice(startIndex, endIndex + 1);
          const customEvent = new CustomEvent('robotSelectionEnd', {
            detail: { selectedData, symbol: proChart.getSymbol(), period: proChart.getPeriod() }
          });
          document.body.dispatchEvent(customEvent);
        }
        chart.removeOverlay(overlay.id);
      },
      onRemoved: () => { console.log('Selection overlay removed.'); }
    });
  };
  
  const handleRobotSelection = (event: Event) => {
    const { selectedData, symbol, period } = (event as CustomEvent).detail;
    if (selectedData && symbol && period) {
      const newAttachment: KLineAttachment = { type: 'kline', id: `kline_${Date.now()}`, symbol: symbol.shortName || symbol.ticker, period: period.text, data: JSON.stringify(selectedData) };
      setAttachments(prev => [...prev, newAttachment]);
    }
  };

  const handleCommand = async (item: SuggestionItem) => {
    const proChart = chartProInstance();
    const chart = proChart?.getChart();
    if (!chart) return;

    switch (item.key) {
      case 'add_klines': {
        const range = chart.getVisibleRange();
        const dataList = chart.getDataList();
        const startIndex = Math.max(0, range.to - 100);
        const klineData = dataList.slice(startIndex, range.to);
        const symbolInfo = proChart.getSymbol();
        const periodInfo = proChart.getPeriod();
        setAttachments(prev => [...prev, { type: 'kline', id: `kline_${Date.now()}`, symbol: symbolInfo.shortName || symbolInfo.ticker, period: periodInfo.text, data: JSON.stringify(klineData) }]);
        break;
      }
      case 'add_symbol': {
        const symbolInfo = proChart.getSymbol();
        const text = `Symbol: ${symbolInfo.shortName}\nName: ${symbolInfo.name}\nExchange: ${symbolInfo.exchange}\nType: ${symbolInfo.type}`;
        editor()?.chain().focus().insertContent(text.replace(/\n/g, '<br>')).run();
        break;
      }
      case 'add_positions': {
        const brokerApi = proChart.getBrokerApi() as BrokerAPI | null;
        if (brokerApi) {
          try {
            const positions = await brokerApi.getPositions();
            setAttachments(prev => [...prev, { type: 'position', id: `pos_${Date.now()}`, data: JSON.stringify(positions) }]);
          } catch (error) {
            console.error("Failed to fetch positions:", error);
          }
        } else {
          console.warn("Broker API is not available.");
        }
        break;
      }
    }
  };

  onMount(() => {
    document.body.addEventListener('robotSelectionEnd', handleRobotSelection);
    document.addEventListener('click', handleClickOutside, true);
    const editorInstance = new Editor({
      element: document.createElement('div'),
      extensions: [
        StarterKit,
        Placeholder.configure({ placeholder: 'Type a message or use "@" for commands...' }),
        Mention.configure({
          HTMLAttributes: { class: 'mention' },
          suggestion: {
            items: ({ query }: { query: string }): SuggestionItem[] => {
              const commands: SuggestionItem[] = [
                { key: 'add_klines', label: 'Recent 100 Bars', description: 'Attach the last 100 K-line bars.' },
                { key: 'add_symbol', label: 'Symbol Info', description: 'Attach current symbol information.' },
                { key: 'add_positions', label: 'My Positions', description: 'Attach your current open positions.' },
              ];
              return commands.filter(item => item.label.toLowerCase().startsWith(query.toLowerCase()));
            },
            render: () => {
              let component: any, popup: TippyInstance[], suggestionListRef = { onKeyDown: (props: any) => false };
              return {
                onStart: (props: any) => {
                  component = new SolidRenderer(SuggestionList, { props: { ...props, ref: suggestionListRef }, editor: props.editor });
                  if (!props.clientRect) { return; }
                  popup = tippy('body', { getReferenceClientRect: props.clientRect, appendTo: () => document.body, content: component.element, showOnCreate: true, interactive: true, trigger: 'manual', placement: 'bottom-start' });
                },
                onUpdate(props: any) { component.updateProps(props); if (!props.clientRect) { return; } popup[0].setProps({ getReferenceClientRect: props.clientRect }); },
                onKeyDown(props: any) { if (props.event.key === 'Escape') { popup[0].hide(); return true; } return suggestionListRef.onKeyDown(props); },
                onExit() { popup[0].destroy(); component.destroy(); },
              };
            },
            command: ({ editor: edt, range, props: cmdProps }) => { handleCommand(cmdProps.item); edt.chain().focus().deleteRange(range).run(); },
          },
          char: '@',
        }),
      ],
      editorProps: { attributes: { class: 'ProProseMirror' } },
    });
    setEditor(editorInstance);
    onCleanup(() => {
      editorInstance.destroy();
      setEditor(null);
      document.body.removeEventListener('robotSelectionEnd', handleRobotSelection);
      document.removeEventListener('click', handleClickOutside, true);
    });
  });

  createEffect(() => {
    const editorInstance = editor();
    if (editorInstance) {
      const updateHandler = () => setInputValue(editorInstance.isEmpty ? '' : editorInstance.getHTML());
      editorInstance.on('update', updateHandler);
      onCleanup(() => editorInstance.off('update', updateHandler));
    }
  });

  createEffect(() => {
    if (messageListRef && messages().length > 0) {
      setTimeout(() => { if (messageListRef) { messageListRef.scrollTop = messageListRef.scrollHeight; } }, 50);
    }
  });
  
  const handlePlaceOrder = async (orderParams: OrderParams) => {
    const brokerApi = chartProInstance()?.getBrokerApi();
    if (brokerApi) {
      try {
        console.log('[ChatArea] Placing order with params:', orderParams);
        await brokerApi.placeOrder(orderParams);
      } catch (e) {
        throw e;
      }
    } else {
      console.error("Broker API is not available to place order.");
      throw new Error("Broker API not connected.");
    }
  };

  const handleSend = async () => {
    const editorInstance = editor();
    const atts = attachments();
    if (editorInstance && (!editorInstance.isEmpty || atts.length > 0)) {
      const contentAsJson = editorInstance.isEmpty ? null : editorInstance.getJSON();
      
      const currentMessages = messages();
      const newUserMessage: TextMessage = {
        type: 'text',
        role: 'user',
        text: contentAsJson,
        attachments: atts
      };
      setMessages(prev => [...prev, newUserMessage]);
      editorInstance.commands.setContent('');
      setAttachments([]);

      const thinkingMessage: TextMessage = { 
        type: 'text', 
        role: 'assistant', 
        text: null, 
        attachments: [], 
        thinking: true 
      };
      setMessages(prev => [...prev, thinkingMessage]);

      try {
        const proChart = chartProInstance();
        if (!proChart) throw new Error("Chart not initialized.");
        
        const context: any = {
          symbol: proChart.getSymbol(),
          period: proChart.getPeriod(),
        };
        if (marketContextChecked()) {
          const chart = proChart.getChart();
          const dataList = chart?.getDataList() ?? [];
          context.marketContext = true;
          context.klineData = dataList.slice(-100);
        }
        if (myContextChecked()) {
          context.myContext = true;
          context.accountInfo = brokerState.accountInfo;
          context.positions = brokerState.positions;
        }

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            history: [...currentMessages, newUserMessage],
            context: context,
            model: selectedModel().id,
          }),
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        setMessages(prev => prev.filter(m => !(m as TextMessage).thinking));
        
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
          const aiResponse = await response.json();
          if (aiResponse.type === 'tool_call' && aiResponse.tool_name === 'create_trade_suggestion') {
            const tradeParams = aiResponse.tool_params;
            const chart = proChart.getChart()!;
            const lastData = chart.getDataList().slice(-1)[0];
            const suggestion: TradeSuggestion = {
              status: "SUGGEST",
              strategy_name: "AI Trade Suggestion",
              confidence_score: 0.85,
              summary: tradeParams.summary,
              trade_suggestion: {
                direction: tradeParams.direction,
                leverage: tradeParams.leverage,
                entry_price: tradeParams.orderType === 'market' ? lastData.close : tradeParams.price,
                stop_loss: tradeParams.stop_loss,
                take_profit: tradeParams.take_profit,
                position_size_usd: tradeParams.quantity,
                risk_reward_ratio: 0,
              },
            };
            setMessages(prev => [...prev, { type: 'tool_call', role: 'assistant', tool_name: 'create_trade_suggestion', tool_params: suggestion }]);
          } else if (aiResponse.type === 'text') {
            const content: JSONContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: aiResponse.content }] }] };
            setMessages(prev => [...prev, { type: 'text', role: 'assistant', text: content, attachments: [] }]);
          }
        } else {
          if (!response.body) return;
          const initialAIMessage: TextMessage = { type: 'text', role: 'assistant', text: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] }, attachments: [] };
          setMessages(prev => [...prev, initialAIMessage]);
          
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let streaming = true;

          while (streaming) {
            const { done, value } = await reader.read();
            if (done) {
              streaming = false;
              break;
            }
            const chunk = decoder.decode(value, { stream: true });
            
            setMessages(prev => {
              const lastIndex = prev.length - 1;
              if (lastIndex >= 0 && prev[lastIndex].role === 'assistant') {
                const updatedMessages = [...prev];
                const lastMessage = updatedMessages[lastIndex] as TextMessage;
                const newText = (lastMessage.text?.content?.[0]?.content?.[0]?.text || '') + chunk;
                const newContent: JSONContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: newText }] }] };
                updatedMessages[lastIndex] = { ...lastMessage, text: newContent };
                return updatedMessages;
              }
              return prev;
            });
          }
        }
      } catch (error) {
        console.error("Error sending message to AI:", error);
        const errorContent: JSONContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Sorry, I encountered an error. Please try again.' }] }] };
        setMessages(prev => {
            const newMessages = prev.filter(m => !(m as TextMessage).thinking);
            return [...newMessages, { type: 'text', role: 'assistant', text: errorContent, attachments: [] }];
        });
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.shiftKey || e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      return false;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
      return true;
    }
    return false;
  };
  
  createEffect(() => {
    const ed = editor();
    if (ed) {
      ed.setOptions({
        editorProps: {
          handleKeyDown: (_, event) => {
            return handleKeyDown(event); 
          },
        },
      });
    }
  });
  
  const handleFile = (file: File) => { if (file.type.startsWith('image/')) { const reader = new FileReader(); reader.onload = e => setAttachments(prev => [...prev, { type: 'image', id: `image_${Date.now()}`, url: e.target?.result as string }]); reader.readAsDataURL(file); } };
  const removeAttachment = (id: string) => setAttachments(prev => prev.filter(att => att.id !== id));
  const handlePaste = (e: ClipboardEvent) => e.clipboardData?.files.length && (e.preventDefault(), handleFile(e.clipboardData.files[0]));
  const handleDrop = (e: DragEvent) => e.dataTransfer?.files.length && (e.preventDefault(), handleFile(e.dataTransfer.files[0]));
  const preventDefaults = (e: Event) => e.preventDefault();
  
  return (
    <div class="chat-area">
      <div class="chat-header">
        <ModelSelector 
          models={availableModels}
          selectedModel={selectedModel()}
          onModelSelect={setSelectedModel}
        />
        <div class="chat-menu-container" ref={menuContainerRef}>
          <button class="chat-menu-button" onClick={() => setIsMenuOpen(!isMenuOpen())}>
            <HamburgerIcon />
          </button>
          <Show when={isMenuOpen()}>
            <ChatMenu onClear={handleClearConversation} onExport={handleExportChat} />
          </Show>
        </div>
      </div>
      <div class="message-list" ref={messageListRef}>
        <Show 
          when={messages().length > 0} 
          fallback={<WelcomeArea />}
        >
          <For each={messages()}>{ 
            (message) => (
              <Show
                when={(message as TextMessage).thinking}
                fallback={
                  <Show
                    when={message.type === 'tool_call' && message.tool_name === 'create_trade_suggestion'}
                    fallback={
                      <div class={`message ${message.role}-message`}>
                        <div class="message-content">
                          <For each={(message as TextMessage).attachments}>{
                            att => {
                              if (att.type === 'image') return <img src={(att as ImageAttachment).url} class="message-attachment-image" alt="attachment" />;
                              if (att.type === 'kline') return <KLineDataCard node={{ attrs: att as any }} />;
                              if (att.type === 'position') return <PositionCard node={{ attrs: att as any }} />;
                              return null;
                            }
                          }</For>
                          <Show when={(message as TextMessage).text}><MessageRenderer content={(message as TextMessage).text} /></Show>
                        </div>
                      </div>
                    }
                  >
                    <TradeSuggestionCard 
                      suggestion={(message as ToolCallMessage).tool_params}
                      chartPro={chartProInstance()}
                      onPlaceOrder={handlePlaceOrder}
                    />
                  </Show>
                }
              >
                <div class="message ai-message thinking-message">
                  <div class="dot-flashing"></div>
                </div>
              </Show>
            )}
          </For>
        </Show>
      </div>
      
      <div class="input-area-wrapper" onPaste={handlePaste} onDrop={handleDrop} onDragOver={preventDefaults} onDragEnter={preventDefaults}>
        <ContextCheckboxes 
          marketContextChecked={marketContextChecked()}
          myContextChecked={myContextChecked()}
          onMarketContextChange={setMarketContextChecked}
          onMyContextChange={setMyContextChecked}
        />
        <div class="input-area">
          <div class="top-row"><RichInput /></div>
          <div class="bottom-row">
            <div class="actions-left">
              <button class="action-btn" onClick={handleSelectKLine}>
                <PlusIcon />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                accept="image/*"
                onChange={(e) => {
                  const files = e.currentTarget.files;
                  if (files && files.length > 0) {
                    handleFile(files[0]);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <div class="attachment-preview-container">
                <For each={attachments()}>
                  {(att) => (
                    <div class="attachment-preview">
                      <Show when={att.type === 'image'}><img src={(att as ImageAttachment).url} alt="preview"/></Show>
                      <Show when={att.type === 'kline'}><KLineDataCard node={{ attrs: att as any }} deleteNode={() => removeAttachment(att.id)} /></Show>
                      <Show when={att.type === 'position'}><PositionCard node={{ attrs: att as any }} deleteNode={() => removeAttachment(att.id)} /></Show>
                      <button class="remove-attachment-btn" onClick={() => removeAttachment(att.id)}>×</button>
                    </div>
                  )}
                </For>
              </div>
            </div>
            <div class="actions-right">
              <button class="send-btn" onClick={handleSend} disabled={inputValue().trim() === '' && attachments().length === 0}>
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAreaProvider;