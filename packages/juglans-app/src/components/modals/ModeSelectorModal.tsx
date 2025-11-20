// packages/juglans-app/src/components/modals/ModeSelectorModal.tsx
import { Component, Show, type Accessor } from 'solid-js';
import { Portal } from 'solid-js/web';
import { useNavigate } from '@solidjs/router';
import styles from './ModeSelectorModal.module.css';
import ExchangeIcon from '../icons/ExchangeIcon';
import WalletIcon from '../icons/WalletIcon';

interface ModeSelectorModalProps {
  isOpen: Accessor<boolean>;
  onClose: () => void;
}

const ModeSelectorModal: Component<ModeSelectorModalProps> = (props) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    props.onClose();
  };

  return (
    <Show when={props.isOpen()}>
      <Portal>
        <div class={styles.modalOverlay} onClick={props.onClose} />
        <div class={`${styles.modalContent} ${props.isOpen() ? styles.open : ''}`}>
          <div class={styles.header}>Select Mode</div>
          <div class={styles.option} onClick={() => handleNavigate('/market')}>
            <div class={styles.iconContainer}><ExchangeIcon /></div>
            <div class={styles.textContainer}>
              <div class={styles.title}>Exchange</div>
              <div class={styles.description}>Advanced trading tools</div>
            </div>
          </div>
          {/* --- 核心修改: 跳转到 /portfolio --- */}
          <div class={styles.option} onClick={() => handleNavigate('/portfolio')}>
            <div class={styles.iconContainer}><WalletIcon /></div>
            <div class={styles.textContainer}>
              <div class={styles.title}>Portfolio</div>
              <div class={styles.description}>Manage your assets</div>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

export default ModeSelectorModal;