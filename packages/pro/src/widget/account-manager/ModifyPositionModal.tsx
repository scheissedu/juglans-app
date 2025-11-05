// /klinecharts-workspace/packages/pro/src/widget/account-manager/ModifyPositionModal.tsx

import { Component, createSignal, Show } from 'solid-js';
import { Modal, Input, Button } from '../../component';
import type { Position } from '../../types';

interface ModifyPositionModalProps {
  position: Position | null;
  onClose: () => void;
  onConfirm: (sl_tp: { stopLoss?: number; takeProfit?: number }) => void;
}

const ModifyPositionModal: Component<ModifyPositionModalProps> = (props) => {
  const [stopLoss, setStopLoss] = createSignal(props.position?.stopLoss ?? '');
  const [takeProfit, setTakeProfit] = createSignal(props.position?.takeProfit ?? '');

  const handleConfirm = () => {
    props.onConfirm({
      stopLoss: stopLoss() !== '' ? Number(stopLoss()) : undefined,
      takeProfit: takeProfit() !== '' ? Number(takeProfit()) : undefined,
    });
    props.onClose();
  };

  return (
    <Modal
      title={`Modify Position: ${props.position?.symbol}`}
      width={420}
      onClose={props.onClose}
      buttons={[
        { type: 'cancel', children: 'Cancel', onClick: props.onClose },
        { type: 'confirm', children: 'Confirm', onClick: handleConfirm }
      ]}
    >
      <div class="modify-position-content">
        <div class="form-item">
          <label>Stop Loss Price</label>
          <Input 
            value={stopLoss()} 
            onChange={setStopLoss}
            placeholder="Enter stop loss price"
          />
        </div>
        <div class="form-item">
          <label>Take Profit Price</label>
          <Input 
            value={takeProfit()} 
            onChange={setTakeProfit}
            placeholder="Enter take profit price"
          />
        </div>
      </div>
    </Modal>
  );
};

export default ModifyPositionModal;