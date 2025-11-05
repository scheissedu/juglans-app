// /klinecharts-workspace/packages/preview/src/MessageRenderer.tsx

import { Component, onMount, onCleanup, createEffect } from 'solid-js';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { SolidNodeViewRenderer } from 'tiptap-solid';

import { KLineDataNode as KLineDataNodeExtension } from './KLineDataNode';
import KLineDataCard from './KLineDataCard';

interface MessageRendererProps {
  content: any; // 接收 Tiptap JSON
}

const MessageRenderer: Component<MessageRendererProps> = (props) => {
  let editorContainerRef: HTMLDivElement | undefined;
  let editor: Editor | null = null;

  const KLineDataNodeWithView = KLineDataNodeExtension.extend({
    addNodeView() {
      // 使用相同的 KLineDataCard 组件来渲染，但编辑器本身是只读的
      return SolidNodeViewRenderer(KLineDataCard);
    },
  });

  onMount(() => {
    if (editorContainerRef) {
      editor = new Editor({
        element: editorContainerRef,
        extensions: [
          StarterKit,
          KLineDataNodeWithView, // 必须包含自定义节点扩展才能正确渲染
        ],
        content: props.content, // 设置初始内容
        editable: false, // 关键：设置为只读
        editorProps: {
          attributes: {
            // 添加一个不同的类名，方便单独设置样式
            class: 'ProseMirror readonly-message',
          },
        },
      });
    }
  });

  // 当 props.content 变化时（虽然在这个场景下不常变，但这是个好习惯）
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