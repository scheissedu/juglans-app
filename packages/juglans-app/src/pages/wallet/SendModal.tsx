import { Component } from 'solid-js';
import CustomModal from '../../components/modals/CustomModal';
import './Wallet.css'; // 样式将添加到这里

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SendModal: Component<SendModalProps> = (props) => {
  return (
    <CustomModal isOpen={props.isOpen} onClose={props.onClose} title="Send Asset">
      <div class="send-modal-content">
        <div class="form-group">
          <label for="address">Recipient Address</label>
          <input type="text" id="address" class="wallet-input" placeholder="0x..." />
        </div>
        <div class="form-group">
          <label for="amount">Amount</label>
          <input type="text" id="amount" class="wallet-input" placeholder="0.0" />
        </div>
        <button class="wallet-submit-btn">Continue</button>
      </div>
    </CustomModal>
  );
};

export default SendModal;