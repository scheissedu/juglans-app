// /klinecharts-workspace/packages/preview/src/EditorContext.ts

import { createContext, useContext } from 'solid-js';
import type { Editor } from '@tiptap/core';

export interface EditorContextState {
  editor: () => Editor | null;
  setEditor: (editor: Editor | null) => void;
}

// 创建 Context 并提供一个默认值
const EditorContext = createContext<EditorContextState>();

// 创建一个自定义 Hook，方便在其他组件中使用
export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}

export default EditorContext;