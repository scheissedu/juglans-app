// /klinecharts-workspace/packages/pro/src/component/button/index.tsx

import { ParentComponent, ParentProps, JSX } from 'solid-js'

export type ButtonType = 'confirm' | 'cancel'

export interface ButtonProps extends ParentProps {
  class?: string
  style?: JSX.CSSProperties | string
  type?: ButtonType
  onClick?: () => void
  // +++ ADDED +++
  [key: `data-${string}`]: unknown;
}

const Button: ParentComponent<ButtonProps> = props => {
  // +++ ADDED: Logic to extract data attributes +++
  const dataAttrs = () => {
    const attrs: { [key: string]: unknown } = {};
    for (const key in props) {
      if (key.startsWith('data-')) {
        attrs[key] = props[key as keyof ButtonProps];
      }
    }
    return attrs;
  };

  return (
    <button
      style={props.style}
      class={`klinecharts-pro-button ${props.type ?? 'confirm'} ${props.class?? ''}`}
      onClick={props.onClick}
      {...dataAttrs()} // Apply data attributes
    >
      {props.children}
    </button>
  )
}

export default Button