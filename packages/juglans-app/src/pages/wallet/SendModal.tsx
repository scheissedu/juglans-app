// packages/juglans-app/src/pages/wallet/SendModal.tsx

import { Component, createSignal, For, createMemo } from 'solid-js';
import CustomModal from '../../components/modals/CustomModal';
import { useAppContext } from '../../context/AppContext';
import { useBrokerState } from '@klinecharts/pro';
import './Wallet.css';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAsset?: string;
}

const SendModal: Component<SendModalProps> = (props) => {
  const [state] = useAppContext();
  const [brokerState] = useBrokerState();

  const [selectedAsset, setSelectedAsset] = createSignal(props.initialAsset ?? 'USDT');
  const [address, setAddress] = createSignal('');
  const [amount, setAmount] = createSignal('');
  const [isSending, setIsSending] = createSignal(false);

  const availableAssets = createMemo(() => {
    return Object.keys(brokerState.accountInfo?.balances ?? {});
  });
  
  const selectedAssetBalance = createMemo(() => {
    return brokerState.accountInfo?.balances[selectedAsset()]?.free ?? 0;
  });

  const handleSend = async () => {
    const sendAmount = parseFloat(amount());
    if (!address) {
      alert("Please enter a recipient address.");
      return;
    }
    if (isNaN(sendAmount) || sendAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (sendAmount > selectedAssetBalance()) {
      alert("Insufficient funds.");
      return;
    }

    setIsSending(true);
    try {
      await state.brokerApi.withdraw(selectedAsset(), sendAmount);
      alert(`Successfully sent ${sendAmount} ${selectedAsset()}!`);
      props.onClose();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <CustomModal isOpen={props.isOpen} onClose={props.onClose} title="Send Asset">
      <div class="send-modal-content">
        <div class="form-group">
          <label for="asset-select">Asset</label>
          <select id="asset-select" class="wallet-select" value={selectedAsset()} onChange={(e) => setSelectedAsset(e.currentTarget.value)}>
            <For each={availableAssets()}>
              {(asset) => <option value={asset}>{asset}</option>}
            </For>
          </select>
          <div class="balance-info">
            Available: {selectedAssetBalance().toFixed(6)} {selectedAsset()}
          </div>
        </div>
        <div class="form-group">
          <label for="address">Recipient Address</label>
          <input type="text" id="address" class="wallet-input" placeholder="0x..." value={address()} onInput={(e) => setAddress(e.currentTarget.value)} />
        </div>
        <div class="form-group">
          <label for="amount">Amount</label>
          <input type="number" id="amount" class="wallet-input" placeholder="0.0" value={amount()} onInput={(e) => setAmount(e.currentTarget.value)} />
        </div>
        <button class="wallet-submit-btn" onClick={handleSend} disabled={isSending()}>
          {isSending() ? 'Sending...' : 'Continue'}
        </button>
      </div>
    </CustomModal>
  );
};

export default SendModal;