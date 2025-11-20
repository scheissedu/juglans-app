// packages/juglans-app/src/components/common/InlineSvg.tsx
import { Component, createResource, Show } from 'solid-js';

// 简单的内存缓存，避免重复 fetch 同一个 SVG
const svgCache = new Map<string, Promise<string>>();

const fetchSvg = async (src: string): Promise<string> => {
  if (svgCache.has(src)) {
    return svgCache.get(src)!;
  }
  const promise = fetch(src)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch SVG: ${response.statusText}`);
      }
      return response.text();
    })
    .catch(error => {
      console.error(`Error fetching SVG from ${src}:`, error);
      svgCache.delete(src); // 如果失败，从缓存中移除以便重试
      return `<svg viewBox="0 0 24 24"><path fill="red" d="M12 2L1 21h22L12 2zm0 4l7 12H5l7-12z"/></svg>`; // 返回一个错误图标
    });

  svgCache.set(src, promise);
  return promise;
};

interface InlineSvgProps {
  src: string;
  class?: string;
}

const InlineSvg: Component<InlineSvgProps> = (props) => {
  const [svgContent] = createResource(() => props.src, fetchSvg);

  return (
    <Show when={!svgContent.loading} fallback={<div class={props.class}></div>}>
      {/* 使用 innerHTML 将 SVG 字符串渲染为 DOM 元素 */}
      <div class={props.class} innerHTML={svgContent()} />
    </Show>
  );
};

export default InlineSvg;