// packages/juglans-app/src/components/modals/ContextSelectorModal.tsx
import { Component, For } from 'solid-js';
import { Checkbox } from '@klinecharts/pro';
import CustomModal from './CustomModal';
import { ContextSource } from '../../context/AppContext'; // 导入类型
import './ContextSelectorModal.css';

interface ContextSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableContexts: ContextSource[];
  enabledContexts: string[];
  onToggleContext: (id: string) => void;
}

const ContextSelectorModal: Component<ContextSelectorModalProps> = (props) => {
  return (
    <CustomModal isOpen={props.isOpen} onClose={props.onClose} title="Select Context">
      <div class="context-selector-content">
        <For each={props.availableContexts}>
          {(source) => (
            <Checkbox 
              label={source.label}
              checked={props.enabledContexts.includes(source.id)}
              onChange={() => props.onToggleContext(source.id)}
            />
          )}
        </For>
      </div>
    </CustomModal>
  );
};

export default ContextSelectorModal;