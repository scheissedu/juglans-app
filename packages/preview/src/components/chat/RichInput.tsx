// /klinecharts-workspace/packages/preview/src/components/chat/RichInput.tsx

import { Component, onMount } from 'solid-js';
import { useEditor } from '../../context/EditorContext';

const RichInput: Component = () => {
  const { editor } = useEditor();
  let editorContainerRef: HTMLDivElement | undefined;

  onMount(() => {
    const editorInstance = editor();
    // 当组件挂载时，将 Tiptap 内部的 DOM 元素附加到这个 div 上
    if (editorInstance && editorContainerRef) {
      console.log("[RichInput] Mounting Tiptap's DOM into Solid's div.");
      editorContainerRef.appendChild(editorInstance.view.dom);
    }
  });

  // 提供一个空的 div 作为挂载点
  return <div ref={editorContainerRef} class="rich-input-editor-wrapper" />;
};

export default RichInput;