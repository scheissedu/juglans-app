import { Component, Show, createSignal, onMount, onCleanup, For, createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';
import { SymbolInfo, Period } from '../../types';
import i18n from '../../i18n';
import RobotIcon from './icons/robot';
import Tooltip from '../../component/Tooltip';
import DownArrowIcon from './icons/DownArrowIcon';
import IndicatorIcon from './icons/IndicatorIcon';
import TimezoneIcon from './icons/TimezoneIcon';
import SettingIcon from './icons/SettingIcon';
import ScreenshotIcon from './icons/ScreenshotIcon';
import FullscreenIcon from './icons/FullscreenIcon';
import ExitFullscreenIcon from './icons/ExitFullscreenIcon';

export interface PeriodBarProps {
  locale: string;
  spread: boolean;
  symbol: SymbolInfo;
  period: Period;
  periods: Period[];
  onMenuClick: () => void;
  onSymbolClick: () => void;
  onPeriodChange: (period: Period) => void;
  onIndicatorClick: () => void;
  onTimezoneClick: () => void;
  onSettingClick: () => void;
  onScreenshotClick: () => void;
  onRobotClick?: () => void;
}

const PeriodBar: Component<PeriodBarProps> = props => {
  const [fullScreen, setFullScreen] = createSignal(false);
  const [periodDDVisible, setPeriodDDVisible] = createSignal(false);
  
  let periodDropdownTriggerRef: HTMLDivElement | undefined;
  const [dropdownStyle, setDropdownStyle] = createSignal({});

  const fullScreenChange = () => setFullScreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));

  const handleClickOutside = (event: MouseEvent) => {
    if (
      periodDDVisible() &&
      periodDropdownTriggerRef && !periodDropdownTriggerRef.contains(event.target as Node)
    ) {
      const dropdownElement = document.querySelector('.period-dropdown');
      if (!dropdownElement || !dropdownElement.contains(event.target as Node)) {
        setPeriodDDVisible(false);
      }
    }
  };

  onMount(() => {
    document.addEventListener('fullscreenchange', fullScreenChange);
    document.addEventListener('webkitfullscreenchange', fullScreenChange);
    document.addEventListener('click', handleClickOutside, true);
  });

  onCleanup(() => {
    document.removeEventListener('fullscreenchange', fullScreenChange);
    document.removeEventListener('webkitfullscreenchange', fullScreenChange);
    document.removeEventListener('click', handleClickOutside, true);
  });
  
  createEffect(() => {
    if (periodDDVisible() && periodDropdownTriggerRef) {
      const rect = periodDropdownTriggerRef.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
        'z-index': 100,
      });
    }
  });

  const handleFullscreen = () => {
    if (!fullScreen()) {
      const el = document.querySelector('.klinecharts-pro');
      if (el) {
        (el.requestFullscreen || (el as any).webkitRequestFullscreen)?.call(el);
      }
    } else {
      (document.exitFullscreen || (document as any).webkitExitFullscreen)?.call(document);
    }
  };
  
  const groupedPeriods = () => {
    const groups: Array<{ name: string, periods: Period[] }> = [
      { name: 'Minutes', periods: [] },
      { name: 'Hours', periods: [] },
      { name: 'Days', periods: [] }
    ];
    props.periods.forEach(p => {
      if (p.timespan === 'minute') groups[0].periods.push(p);
      else if (p.timespan === 'hour') groups[1].periods.push(p);
      else if (['day', 'week', 'month', 'year'].includes(p.timespan)) groups[2].periods.push(p);
    });
    return groups.filter(g => g.periods.length > 0);
  };

  return (
    <div class="klinecharts-pro-period-bar">
      <div class='menu-container' onClick={props.onMenuClick}>
        <svg class={props.spread ? '' : 'rotate'} viewBox="0 0 1024 1024">
          <path d="M192.037 287.953h640.124c17.673 0 32-14.327 32-32s-14.327-32-32-32H192.037c-17.673 0-32 14.327-32 32s14.327 32 32 32zM832.161 479.169H438.553c-17.673 0-32 14.327-32 32s14.327 32 32 32h393.608c17.673 0 32-14.327 32-32s-14.327-32-32-32zM832.161 735.802H192.037c-17.673 0-32 14.327-32 32s14.327 32 32 32h640.124c17.673 0 32-14.327 32-32s-14.327-32-32-32zM319.028 351.594l-160 160 160 160z"/>
        </svg>
      </div>
      
      <div class="scrollable-content">
        <Show when={props.symbol}>
          <div class="symbol" onClick={props.onSymbolClick}>
            <Show when={props.symbol.logo}><img alt="symbol" src={props.symbol.logo}/></Show>
            <span>{props.symbol.shortName ?? props.symbol.name ?? props.symbol.ticker}</span>
          </div>
        </Show>
        
        <div
          class="period-dropdown-container"
          ref={periodDropdownTriggerRef}
          data-visible={periodDDVisible()}
        >
          <div class="item period main-period" onClick={() => setPeriodDDVisible(v => !v)}>
            <span>{props.period.text}</span>
            <DownArrowIcon />
          </div>
          <Show when={periodDDVisible()}>
            <Portal>
              <div class="period-dropdown" style={dropdownStyle()}>
                <For each={groupedPeriods()}>
                  {(group, index) => (
                    <>
                      <Show when={index() > 0}>
                        <div class="period-group-divider" />
                      </Show>
                      <div class="period-group">
                        <div class="period-group-title">{group.name.toUpperCase()}</div>
                        <For each={group.periods}>
                          {p => (
                            <div
                              class="item period"
                              classList={{ selected: p.text === props.period.text }}
                              onClick={() => { props.onPeriodChange(p); setPeriodDDVisible(false); }}
                            >
                              {p.text}
                            </div>
                          )}
                        </For>
                      </div>
                    </>
                  )}
                </For>
              </div>
            </Portal>
          </Show>
        </div>

        <Tooltip content={i18n('indicator', props.locale)}>
          <div class='item tools' onClick={props.onIndicatorClick}>
            <IndicatorIcon />
          </div>
        </Tooltip>
        <Tooltip content={i18n('timezone', props.locale)}>
          <div class='item tools' onClick={props.onTimezoneClick}>
            <TimezoneIcon />
          </div>
        </Tooltip>
        <Tooltip content={i18n('setting', props.locale)}>
          <div class='item tools' onClick={props.onSettingClick}>
            <SettingIcon />
          </div>
        </Tooltip>
        <Tooltip content={i18n('screenshot', props.locale)}>
          <div class='item tools' onClick={props.onScreenshotClick}>
            <ScreenshotIcon />
          </div>
        </Tooltip>
        <Tooltip content={fullScreen() ? i18n('exit_full_screen', props.locale) : i18n('full_screen', props.locale)}>
          <div class='item tools' onClick={handleFullscreen}>
            <Show when={fullScreen()} fallback={<FullscreenIcon />}>
              <ExitFullscreenIcon />
            </Show>
          </div>
        </Tooltip>
        
        <div class="item tools robot-tool" onClick={props.onRobotClick}>
          <RobotIcon />
        </div>
      </div>
    </div>
  );
};

export default PeriodBar;