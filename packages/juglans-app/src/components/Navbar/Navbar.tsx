// packages/juglans-app/src/components/Navbar/Navbar.tsx
import { Component, createSignal, Show } from 'solid-js';
import GridIcon from './GridIcon';
import UserIcon from '../icons/UserIcon';
import styles from './Navbar.module.css';
import { useAppContext } from '../../context/AppContext';
import ProfileModal from '../modals/ProfileModal'; // --- 核心修改 1: 导入新的 ProfileModal ---

interface NavbarProps {
  onGridClick: () => void;
  onModeSelectorClick: () => void;
}

const Navbar: Component<NavbarProps> = (props) => {
  const [state, actions] = useAppContext();
  // --- 核心修改 2: 更新 signal 的名称以匹配新的组件 ---
  const [isProfileModalOpen, setProfileModalOpen] = createSignal(false);

  return (
    <>
      <nav class={styles.navbar}>
        <button class={styles.iconButton} onClick={props.onGridClick}>
          <GridIcon class={styles.icon} />
        </button>

        <div class={styles.middleControls}>
          <div class={styles.exchangeSelector} onClick={props.onModeSelectorClick}>
            <span>Exchange</span>
            <svg class={styles.arrowIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <div class={styles.modeToggle}>
            <button
              classList={{ [styles.modeButton]: true, [styles.active]: state.chartMode === 'light' }}
              onClick={() => actions.setChartMode('light')}
            >
              Light
            </button>
            <button
              classList={{ [styles.modeButton]: true, [styles.active]: state.chartMode === 'pro' }}
              onClick={() => actions.setChartMode('pro')}
            >
              Pro
            </button>
          </div>
        </div>

        <div class={styles.userActions}>
          <Show 
            when={state.isAuthenticated}
            fallback={
              <div class={styles.authLinks}>
                <a href="/login">Login</a>
                <a href="/register" class={styles.registerLink}>Register</a>
              </div>
            }
          >
            {/* --- 核心修改 3: 绑定新的 signal --- */}
            <button class={styles.iconButton} onClick={() => setProfileModalOpen(true)}>
              <UserIcon class={styles.icon} />
            </button>
          </Show>
        </div>
      </nav>

      {/* --- 核心修改 4: 使用新的 ProfileModal 组件 --- */}
      <ProfileModal 
        isOpen={isProfileModalOpen()} 
        onClose={() => setProfileModalOpen(false)} 
      />
    </>
  );
};

export default Navbar;