// packages/juglans-app/src/components/chat/cards/KLineDataCard/KLineModal.tsx
import { Component, onMount, onCleanup, createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Modal } from '@klinecharts/pro';
import { init, dispose, Chart } from '@klinecharts/core';
import { KLineDataCardData } from './types';

interface KLineModalProps {
  data: KLineDataCardData;
  theme: 'light' | 'dark';
  onClose: () => void;
}

const KLineModal: Component<KLineModalProps> = (props) => {
  let chartContainer: HTMLDivElement | undefined;
  let chart: Chart | null = null;

  createEffect(() => {
    const timeoutId = setTimeout(() => {
      if (chartContainer && !chart) {
        chart = init(chartContainer, {
          styles: props.theme,
          zoomEnabled: false,
          scrollEnabled: false,
        });

        if (props.data.data && props.data.data.length > 0) {
          chart?.applyNewData(props.data.data);
        }
        chart?.resize();
      }
    }, 100);

    onCleanup(() => clearTimeout(timeoutId));
  });

  onCleanup(() => {
    if (chartContainer) {
      dispose(chartContainer);
      chart = null;
    }
  });

  return (
    <Portal>
      <Modal
        class="card-details-modal" // Use a consistent class for card modals
        data-theme={props.theme}
        title={`${props.data.symbol} - ${props.data.period}`}
        width={800}
        onClose={props.onClose}
      >
        <div style={{ height: '450px', 'margin-top': '20px' }}>
          <div ref={chartContainer} style={{ width: '100%', height: '100%' }} />
        </div>
      </Modal>
    </Portal>
  );
};

export default KLineModal;