import { Component, createSignal, For, onCleanup, Show, createEffect, onMount, createMemo, ParentProps } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { Portal } from 'solid-js/web';
import './ChatArea.css';
import './SuggestionList.css';
import { Editor, type JSONContent } from '@tiptap/core';
import { SolidRenderer } from 'tiptap-solid';
import tippy, { type Instance as TippyInstance } from 'tippy.js';

import { QuickSuggestion, useAppContext } from '../../context/AppContext';
import EditorContext, { useEditor, type EditorContextState } from '../../context/EditorContext';
import { useBrokerState } from '@klinecharts/pro/src/api/BrokerStateContext';

import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';

import SendIcon from '../icons/SendIcon';
import PlusIcon from '../icons/PlusIcon';
import RefreshIcon from '../icons/RefreshIcon';
import RichInput from './RichInput';
import MessageRenderer from './MessageRenderer';
import SuggestionList, { type SuggestionItem } from './SuggestionList';
import ContextCheckboxes from './ContextCheckboxes';
import { executeToolCall } from './tools';
import { KLineDataCard, PositionCard, TradeSuggestionCard } from './cards';
import { KLineChartPro, OrderParams } from '@klinecharts/pro';
import ModelSelector, { Model } from './ModelSelector';

export interface ImageAttachment { type: 'image'; url: string; id: string; }
export interface KLineAttachment { type: 'kline'; symbol: string; period: string; data: string; id: string; }
export interface PositionAttachment { type: 'position'; data: string; id: string; }
export type Attachment = ImageAttachment | KLineAttachment | PositionAttachment;

export interface TextMessage {
  role: 'user' | 'assistant';
  type: 'text';
  text: JSONContent | null;
  attachments: Attachment[];
  thinking?: boolean;
}
export interface ToolCallMessage {
  role: 'assistant';
  type: 'tool_call';
  tool_name: string;
  tool_params: any;
}
export type Message = TextMessage | ToolCallMessage;

const AVAILABLE_MODELS: Model[] = [
  { id: 'deepseek-chat', name: 'DeepSeek V2', provider: 'DeepSeek', logo: '/deepseek.png' },
  { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash', provider: 'Google', logo: '/gemini.png' },
];

export const ChatAreaProvider: Component<ParentProps> = (props) => {
  const [editorSignal, setEditorSignal] = createSignal<Editor | null>(null);
  const editorContextValue: EditorContextState = {
    editor: editorSignal,
    setEditor: setEditorSignal,
  };
  return (
    <EditorContext.Provider value={editorContextValue}>
      {props.children}
    </EditorContext.Provider>
  );
};

export const ChatArea: Component = () => {
  const { editor, setEditor } = useEditor();
  const [state, actions] = useAppContext();
  const [brokerState] = useBrokerState();

  const [messages, setMessages] = createStore<Message[]>([]);
  const [attachments, setAttachments] = createStore<Attachment[]>([]);
  const [isInputEmpty, setIsInputEmpty] = createSignal(true);
  
  let messageListRef: HTMLDivElement | undefined;
  let fileInputRef: HTMLInputElement | undefined;

  const [selectedModelId, setSelectedModelId] = createSignal('deepseek-chat');
  const [marketContextChecked, setMarketContextChecked] = createSignal(true);
  const [myContextChecked, setMyContextChecked] = createSignal(true);

  const [isAttachmentMenuOpen, setAttachmentMenuOpen] = createSignal(false);
  let attachmentMenuButtonRef: HTMLButtonElement | undefined;
  const [menuStyle, setMenuStyle] = createSignal({});

  const chatExtension = () => state.chatExtension;

  const clearChat = () => {
    if (confirm('Are you sure you want to clear the conversation?')) {
      setMessages([]);
    }
  };

  const quickSuggestions = createMemo((): QuickSuggestion[] => {
    return chatExtension()?.getQuickSuggestions() ?? [
      { text: "分析一下", sendImmediately: false },
      { text: "看看市场", sendText: "/navigate market", sendImmediately: true },
    ];
  });
  
  const attachmentActions = createMemo(() => {
    const defaultActions = [{
      icon: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      ),
      action: () => fileInputRef?.click(),
      tooltip: "Attach a file",
      label: "Attach File"
    }];
    const extensionActions = chatExtension()?.getAttachmentActions() ?? [];
    return [...extensionActions, ...defaultActions];
  });

  const handleSuggestionClick = (text: string) => {
    const editorInstance = editor();
    if (editorInstance) {
      editorInstance.chain().focus().setContent(text, true).run();
      editorInstance.commands.focus('end');
    }
  };
  
  const handleDirectSend = (suggestion: QuickSuggestion) => {
    handleSend(suggestion);
  };
  
  onMount(() => {
    const handleSendMessageEvent = (event: Event) => {
      const text = (event as CustomEvent).detail as string;
      handleDirectSend({ text, sendImmediately: true });
    };
    document.body.addEventListener('send-chat-message', handleSendMessageEvent);

    const handleAddAttachment = (event: Event) => {
      const newAttachment = (event as CustomEvent).detail;
      setAttachments(produce(atts => { atts.push(newAttachment) }));
    };
    document.body.addEventListener('add-chat-attachment', handleAddAttachment);

    const handleClickOutside = (e: MouseEvent) => {
      if (isAttachmentMenuOpen() && attachmentMenuButtonRef && !attachmentMenuButtonRef.contains(e.target as Node)) {
        const popover = document.querySelector('.attachment-menu-popover');
        if (!popover || !popover.contains(e.target as Node)) {
          setAttachmentMenuOpen(false);
        }
      }
    };
    document.body.addEventListener('click', handleClickOutside);

    onCleanup(() => {
      document.body.removeEventListener('send-chat-message', handleSendMessageEvent);
      document.body.removeEventListener('add-chat-attachment', handleAddAttachment);
      document.body.removeEventListener('click', handleClickOutside);
    });
  });

  const handleSend = async (suggestion?: QuickSuggestion) => {
    const editorInstance = editor();
    if (!editorInstance) return;

    let contentForDisplay: JSONContent | null;
    let contentForAPI: JSONContent;
    const currentAttachments = [...attachments];

    if (suggestion) {
      contentForDisplay = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: suggestion.text }] }] };
      contentForAPI = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: suggestion.sendText ?? suggestion.text }] }] };
      editorInstance.commands.setContent('', true);
    } else {
      if (isInputEmpty() && currentAttachments.length === 0) return;
      contentForDisplay = editorInstance.isEmpty ? null : editorInstance.getJSON();
      contentForAPI = contentForDisplay!;
      editorInstance.commands.setContent('', true);
    }
    
    setAttachments([]);

    const newUserMessageForUI: TextMessage = { type: 'text', role: 'user', text: contentForDisplay, attachments: currentAttachments };
    setMessages(produce(msgs => { msgs.push(newUserMessageForUI); }));

    const newUserMessageForAPI: TextMessage = { type: 'text', role: 'user', text: contentForAPI, attachments: currentAttachments };
    const historyForAPI = [...messages.filter(m => m !== newUserMessageForUI), newUserMessageForAPI];

    const thinkingMessage: TextMessage = { type: 'text', role: 'assistant', text: null, attachments: [], thinking: true };
    setMessages(produce(msgs => { msgs.push(thinkingMessage); }));

    try {
      const extensionContext = chatExtension()?.getContext() ?? {};
      const context: any = { 
        symbol: state.symbol, 
        period: state.period, 
        ...extensionContext 
      };
      
      if (myContextChecked()) {
        context.myContext = true;
        context.accountInfo = await state.brokerApi.getAccountInfo();
        context.positions = await state.brokerApi.getPositions();
      }

      if(!marketContextChecked()){
        delete context.klineData;
        delete context.marketContext;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: historyForAPI, context: context, model: selectedModelId() }),
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setMessages(produce(msgs => { msgs.pop(); }));
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const aiResponse = await response.json();
        
        if (aiResponse.type === 'tool_call') {
          executeToolCall(aiResponse, [state, actions], setMessages);
        } else if (aiResponse.type === 'card_response') {
          switch (aiResponse.card_type) {
            case 'my_positions':
              const newAttachment: PositionAttachment = {
                type: 'position', id: `pos_${Date.now()}`,
                data: JSON.stringify(aiResponse.card_data),
              };
              const cardMessage: TextMessage = {
                role: 'assistant', type: 'text',
                text: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: "Here are your current positions:" }] }] },
                attachments: [newAttachment],
              };
              setMessages(produce(msgs => { msgs.push(cardMessage); }));
              break;
            default:
              console.warn('Unknown card type received:', aiResponse.card_type);
          }
        }
      } else {
        if (!response.body) return;
        const initialAIMessage: TextMessage = { type: 'text', role: 'assistant', text: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] }, attachments: [] };
        setMessages(produce(msgs => { msgs.push(initialAIMessage); }));
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages(produce(msgs => {
            const lastMessage = msgs[msgs.length - 1] as TextMessage;
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.text) {
              const p = lastMessage.text.content?.[0]?.content?.[0];
              if (p && p.type === 'text') {
                p.text += chunk;
              }
            }
          }));
        }
      }
    } catch (error: any) {
      console.error("Error sending message to AI:", error);
      const errorContent: JSONContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: `Sorry, I encountered an error: ${error.message}` }] }] };
      setMessages(produce(msgs => {
          msgs.pop();
          msgs.push({ type: 'text', role: 'assistant', text: errorContent, attachments: [] });
      }));
    }
  };
  
  const handlePlaceOrder = async (orderParams: OrderParams) => {
    const brokerApi = state.brokerApi;
    if (brokerApi) {
      try { await brokerApi.placeOrder(orderParams); } catch (e) { throw e; }
    } else { throw new Error("Broker API not connected."); }
  };

  onMount(() => {
    const editorInstance = new Editor({
      element: document.createElement('div'),
      extensions: [ StarterKit, Placeholder.configure({ placeholder: 'Type a message or use "@" for commands...' }),
        Mention.configure({
          HTMLAttributes: { class: 'mention' },
          suggestion: {
            items: ({ query }: { query: string }): SuggestionItem[] => {
              const commands = chatExtension()?.getCommands() ?? [];
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
            command: ({ editor: edt, range, props: cmdProps }) => { 
              chatExtension()?.handleCommand(cmdProps.item, edt);
              edt.chain().focus().deleteRange(range).run(); 
            },
          },
          char: '@',
        }),
      ],
      editorProps: { attributes: { class: 'ProseMirror' } },
    });
    setEditor(editorInstance);
    const updateHandler = ({ editor: edt }: { editor: Editor }) => { setIsInputEmpty(edt.isEmpty); };
    editorInstance.on('update', updateHandler);
    onCleanup(() => {
      editorInstance.off('update', updateHandler);
      editorInstance.destroy();
      setEditor(null);
    });
  });

  createEffect(() => {
    if (isAttachmentMenuOpen() && attachmentMenuButtonRef) {
      const rect = attachmentMenuButtonRef.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        bottom: `${window.innerHeight - rect.top + 8}px`,
        left: `${rect.left}px`,
        'z-index': 1001,
      });
    }
  });

  createEffect(() => {
    const editorInstance = editor();
    if (editorInstance) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.shiftKey || e.ctrlKey || e.metaKey) && e.key === 'Enter') { return false; }
        if (e.key === 'Enter') { e.preventDefault(); handleSend(); return true; }
        return false;
      };
      editorInstance.setOptions({ editorProps: { handleKeyDown: (_, event) => handleKeyDown(event) } });
    }
  });

  const handleFile = (file: File) => { if (file.type.startsWith('image/')) { const reader = new FileReader(); reader.onload = e => setAttachments(produce(atts => { atts.push({ type: 'image', id: `image_${Date.now()}`, url: e.target?.result as string }) })); reader.readAsDataURL(file); } };
  const removeAttachment = (id: string) => setAttachments(produce(atts => { const index = atts.findIndex(a => a.id === id); if (index > -1) atts.splice(index, 1); }));
  const handlePaste = (e: ClipboardEvent) => e.clipboardData?.files.length && (e.preventDefault(), handleFile(e.clipboardData.files[0]));
  const handleDrop = (e: DragEvent) => e.dataTransfer?.files.length && (e.preventDefault(), handleFile(e.dataTransfer.files[0]));
  const preventDefaults = (e: Event) => e.preventDefault();

  return (
    <div class="chat-area">
      <div class="message-list" ref={messageListRef}>
        <Show 
          when={messages.length > 0} 
          fallback={null}
        >
          <For each={messages}>{ 
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
                          <Show when={(message as TextMessage).text}>
                            <MessageRenderer content={(message as TextMessage).text} />
                          </Show>
                        </div>
                      </div>
                    }
                  >
                    <TradeSuggestionCard 
                      suggestion={(message as ToolCallMessage).tool_params}
                      chartPro={state.chart as ChartPro}
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
        <div class="pre-input-wrapper">
          <div class="quick-suggestions-container">
            <For each={quickSuggestions()}>
              {suggestion => (
                <button
                  class="quick-suggestion-button"
                  onClick={() => {
                    if (suggestion.sendImmediately) {
                      handleDirectSend(suggestion);
                    } else {
                      handleSuggestionClick(suggestion.text);
                    }
                  }}
                >
                  {suggestion.text}
                </button>
              )}
            </For>
          </div>
          <ContextCheckboxes 
            marketContextChecked={marketContextChecked()}
            myContextChecked={myContextChecked()}
            onMarketContextChange={setMarketContextChecked}
            onMyContextChange={setMyContextChecked}
          />
        </div>
        
        <div class="input-area">
          <div class="top-row"><RichInput /></div>
          <div class="bottom-row">
            <div class="actions-left">
              <div class="attachment-menu-container">
                <button
                  ref={attachmentMenuButtonRef}
                  class="action-btn"
                  onClick={() => setAttachmentMenuOpen(v => !v)}
                >
                  <PlusIcon />
                </button>
                <Portal>
                  <Show when={isAttachmentMenuOpen()}>
                    <div class="attachment-menu-overlay" onClick={() => setAttachmentMenuOpen(false)} />
                    <div class="attachment-menu-popover" style={menuStyle()}>
                      <For each={attachmentActions()}>
                        {(action) => (
                          <button
                            class="attachment-menu-item"
                            onClick={() => {
                              action.action();
                              setAttachmentMenuOpen(false);
                            }}
                          >
                            <action.icon />
                            <span>{action.label}</span>
                          </button>
                        )}
                      </For>
                    </div>
                  </Show>
                </Portal>
              </div>
              
              <button class="action-btn" onClick={clearChat}>
                <RefreshIcon class="action-icon-small" />
              </button>

              <ModelSelector
                models={AVAILABLE_MODELS}
                selectedModelId={selectedModelId()}
                onModelSelect={setSelectedModelId}
              />
              
              <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => { const files = e.currentTarget.files; if (files && files.length > 0) { handleFile(files[0]); e.currentTarget.value = ''; } }} />
              <div class="attachment-preview-container">
                <For each={attachments}>
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
              <button class="send-btn" onClick={() => handleSend()} disabled={isInputEmpty() && attachments.length === 0}>
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};