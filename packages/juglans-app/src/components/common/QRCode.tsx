import { Component, createMemo, mergeProps, JSX } from 'solid-js';
import { qrcode } from './qrcode-generator'; // 我们将把生成器逻辑放在一个单独的文件中

export interface QRCodeProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  class?: string;
}

const QRCode: Component<QRCodeProps> = (props) => {
  const merged = mergeProps({ size: 128, bgColor: '#FFFFFF', fgColor: '#000000' }, props);

  const qrPath = createMemo(() => {
    const data = qrcode(props.value);
    const size = merged.size;
    const len = data.length;
    let path = '';
    data.forEach((row, i) => {
      let count = 0;
      row.forEach((col, j) => {
        if (col) {
          count++;
        } else if (count > 0) {
          path += `M${j - count} ${i}h${count}`;
          count = 0;
        }
      });
      if (count > 0) {
        path += `M${len - count} ${i}h${count}`;
      }
    });
    return path;
  });

  return (
    <svg
      class={props.class}
      width={merged.size}
      height={merged.size}
      viewBox={`0 0 ${qrcode(props.value).length} ${qrcode(props.value).length}`}
      style={{ 'background-color': merged.bgColor }}
    >
      <path d={qrPath()} fill={merged.fgColor} />
    </svg>
  );
};

export default QRCode;