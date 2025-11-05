import { Component, createMemo, For } from 'solid-js';
import './RollingNumber.less';

interface RollingNumberProps {
  value: string;
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const RollingNumber: Component<RollingNumberProps> = (props) => {
  const characters = createMemo(() => {
    // We only animate the numeric part. Keep currency symbols static.
    const priceString = props.value.replace(/[$,]/g, '');
    const parts = priceString.split('.');
    
    return {
      integerPart: parts[0].split(''),
      fractionalPart: parts[1] ? parts[1].split('') : [],
    };
  });

  return (
    <div class="rolling-number">
      <span class="char static">$</span>
      <For each={characters().integerPart}>
        {(char, index) => {
          const isDigit = /\d/.test(char);
          return (
            <Show when={isDigit} fallback={<span class="char static">{char}</span>}>
              <div class="digit-roller-wrapper">
                <div class="digit-roller" style={{ transform: `translateY(-${parseInt(char, 10) * 10}%)` }}>
                  <For each={DIGITS}>
                    {digit => <div class="digit">{digit}</div>}
                  </For>
                </div>
              </div>
            </Show>
          );
        }}
      </For>
      <Show when={characters().fractionalPart.length > 0}>
        <span class="char static">.</span>
        <For each={characters().fractionalPart}>
        {(char) => (
            <div class="digit-roller-wrapper">
              <div class="digit-roller" style={{ transform: `translateY(-${parseInt(char, 10) * 10}%)` }}>
                <For each={DIGITS}>
                  {digit => <div class="digit">{digit}</div>}
                </For>
              </div>
            </div>
          )}
        </For>
      </Show>
    </div>
  );
};

export default RollingNumber;