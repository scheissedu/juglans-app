// /klinecharts-workspace/packages/preview/src/EditableValue.tsx

import { Component, createSignal, Show } from 'solid-js';

interface EditableValueProps {
  value: string | number;
  onUpdate: (newValue: number) => void;
  class?: string;
  inputClass?: string;
  prefix?: string;
  suffix?: string;
}

const EditableValue: Component<EditableValueProps> = (props) => {
  const [isEditing, setIsEditing] = createSignal(false);
  let inputRef: HTMLInputElement | undefined;

  const handleBlur = () => {
    if (inputRef) {
      const newValue = parseFloat(inputRef.value);
      if (!isNaN(newValue)) {
        props.onUpdate(newValue);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };
  
  const setupInput = (el: HTMLInputElement) => {
    inputRef = el;
    setTimeout(() => {
      el.focus();
      el.select();
    }, 0);
  };

  return (
    <div class={`editable-value ${props.class || ''}`}>
      <Show
        when={isEditing()}
        fallback={
          <span onClick={() => setIsEditing(true)}>
            {props.prefix}{props.value}{props.suffix}
          </span>
        }
      >
        <input
          ref={setupInput}
          type="number"
          class={`editable-input ${props.inputClass || ''}`}
          value={props.value}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      </Show>
    </div>
  );
};

export default EditableValue;