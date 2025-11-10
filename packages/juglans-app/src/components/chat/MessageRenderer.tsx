// packages/juglans-app/src/components/chat/MessageRenderer.tsx
import { Component, onMount, onCleanup, createEffect } from 'solid-js';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { SolidNodeViewRenderer } from 'tiptap-solid';

// --- 核心修改 1: 导入新的通用节点和渲染器 ---
import { GenericCardNode } from '@/components/cards-p/GenericCardNode';
import CardRenderer from '@/components/cards-p/CardRenderer';

interface MessageRendererProps {
  content: any;
}

const MessageRenderer: Component<MessageRendererProps> = (props) => {
  let editorContainerRef: HTMLDivElement | undefined;
  let editor: Editor | null = null;

  // --- 核心修改 2: 配置通用节点使用统一的渲染器 ---
  const CardNodeWithView = GenericCardNode.extend({
    addNodeView() {
      return SolidNodeViewRenderer(CardRenderer);
    },
  });

  onMount(() => {
    if (editorContainerRef) {
      editor = new Editor({
        element: editorContainerRef,
        extensions: [
          StarterKit,
          CardNodeWithView, // --- 核心修改 3: 使用新的配置 ---
        ],
        content: props.content,
        editable: false,
        editorProps: {
          attributes: {
            class: 'ProseMirror readonly-message',
          },
        },
      });
    }
  });

  createEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.commands.setContent(props.content, false);
    }
  });

  onCleanup(() => {
    if (editor && !editor.isDestroyed) {
      editor.destroy();
    }
  });

  return <div ref={editorContainerRef} />;
};

export default MessageRenderer;