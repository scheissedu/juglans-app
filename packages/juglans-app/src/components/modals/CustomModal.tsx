import { Component, ParentProps, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import './CustomModal.css';

interface CustomModalProps extends ParentProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

const CustomModal: Component<CustomModalProps> = (props) => {
  return (
    <Show when={props.isOpen}>
      <Portal>
        <div class="custom-modal-overlay" onClick={props.onClose} />
        <div class="custom-modal-content">
          <div class="custom-modal-header">
            <h2 class="custom-modal-title">{props.title}</h2>
            <button class="custom-modal-close-btn" onClick={props.onClose}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
          <div class="custom-modal-body">
            {props.children}
          </div>
        </div>
      </Portal>
    </Show>
  );
};

export default CustomModal;