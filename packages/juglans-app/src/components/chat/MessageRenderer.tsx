// packages/juglans-app/src/components/chat/MessageRenderer.tsx

import { Component, onMount, onCleanup, createEffect } from 'solid-js';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { SolidNodeViewRenderer } from 'tiptap-solid';

import { KLineDataNode as KLineDataNodeExtension } from './KLineDataNode';

// --- 关键修正：从新的 cards 目录导入 ---
import { KLineDataCard } from './cards';
// --- 修正结束 ---

interface MessageRendererProps {
  content: any;
}

const MessageRenderer: Component<MessageRendererProps> = (props) => {
  let editorContainerRef: HTMLDivElement | undefined;
  let editor: Editor | null = null;

  const KLineDataNodeWithView = KLineDataNodeExtension.extend({
    addNodeView() {
      return SolidNodeViewRenderer(KLineDataCard);
    },
  });

  onMount(() => {
    if (editorContainerRef) {
      editor = new Editor({
        element: editorContainerRef,
        extensions: [
          StarterKit,
          KLineDataNodeWithView,
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