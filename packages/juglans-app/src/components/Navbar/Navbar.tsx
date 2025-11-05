import { Component } from 'solid-js';
import GridIcon from './GridIcon';
import BellIcon from './BellIcon';
import styles from './Navbar.module.css';
import { useAppContext } from '../../context/AppContext';

interface NavbarProps {
  onModeSelectorClick: () => void; // 新增 prop
}

const Navbar: Component<NavbarProps> = (props) => {
  const [state, actions] = useAppContext();

  return (
    <nav class={styles.navbar}>
      <button class={styles.iconButton}>
        <GridIcon class={styles.icon} />
      </button>

      <div class={styles.middleControls}>
        {/* 点击这个区域会打开模态框 */}
        <div class={styles.exchangeSelector} onClick={props.onModeSelectorClick}>
          <span>Exchange</span>
          <svg class={styles.arrowIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* 模式切换按钮保持原样 */}
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

      <button class={styles.iconButton}>
        <BellIcon class={styles.icon} />
      </button>
    </nav>
  );
};

export default Navbar;