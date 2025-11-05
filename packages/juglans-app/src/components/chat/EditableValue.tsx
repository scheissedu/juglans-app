import { Component, createSignal, Show } from 'solid-js';

interface EditableValueProps {
  value: string | number;
  onUpdate: (newValue: number) => void;
  class?: string;
  inputClass?: string;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
}

const EditableValue: Component<EditableValueProps> = (props) => {
  const [isEditing, setIsEditing] = createSignal(false);
  let inputRef: HTMLInputElement | undefined;

  const handleBlur = () => {
    if (inputRef) {
      const newValue = parseFloat(inputRef.value);
      if (!isNaN(newValue)) {
        props.onUpdate(newValue);
      } else {
        // If input is empty or invalid, treat it as 0
        props.onUpdate(0);
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
          <span onClick={() => setIsEditing(true)} style={{"border-color": "transparent"}}>
            <Show when={props.value && props.value !== '' && Number(props.value) !== 0} fallback={<span class="editable-placeholder">{props.placeholder ?? ''}</span>}>
              {props.prefix}{props.value}{props.suffix}
            </Show>
          </span>
        }
      >
        <input
          ref={setupInput}
          type="number"
          class={`editable-input ${props.inputClass || ''}`}
          value={props.value === 0 ? '' : props.value}
          placeholder={props.placeholder}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      </Show>
    </div>
  );
};

export default EditableValue;