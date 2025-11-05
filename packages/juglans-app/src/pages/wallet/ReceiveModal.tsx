import { Component } from 'solid-js';
// 核心修正：导入我们自己创建的本地 QRCode 组件
import QRCode from '../../components/common/QRCode';
import CustomModal from '../../components/modals/CustomModal';
import './Wallet.css';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

const ReceiveModal: Component<ReceiveModalProps> = (props) => {
  const copyAddress = () => {
    navigator.clipboard.writeText(props.address);
    alert('Address copied to clipboard!');
  };

  return (
    <CustomModal isOpen={props.isOpen} onClose={props.onClose} title="Receive Asset">
      <div class="receive-modal-content">
        <div class="qr-code-wrapper">
          {/* 这里现在使用的是我们自己的、可靠的组件 */}
          <QRCode value={props.address} size={200} bgColor="var(--card-bg)" fgColor="#FFFFFF" />
        </div>
        <p class="receive-instructions">Only send assets to this address on the supported network.</p>
        <div class="address-display">
          <span>{props.address}</span>
          <button onClick={copyAddress}>Copy</button>
        </div>
      </div>
    </CustomModal>
  );
};

export default ReceiveModal;