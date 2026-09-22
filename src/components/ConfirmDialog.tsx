import Modal from "./Modal";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

function ConfirmDialog({ title, message, confirmLabel = "Delete", onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="confirm-dialog">
        <p>{message}</p>
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
          <button className="danger-button" type="button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
