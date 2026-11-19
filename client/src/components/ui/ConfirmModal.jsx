import { useId, useLayoutEffect, useRef, useState } from 'react';
import { CircleCheck } from 'lucide-react';
import Button from './Button';
import './ConfirmModal.css';

export default function ConfirmModal({
  title,
  description,
  confirmText,
  icon: Icon = CircleCheck,
  danger = false,
  onConfirm,
  onClose,
}) {
  const dialogRef = useRef(null);
  const pendingRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  async function confirm() {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (failure) {
      setError(failure.message || 'ทำรายการไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirm-modal"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={pending}
      onCancel={(event) => {
        event.preventDefault();
        if (!pendingRef.current) onClose();
      }}
    >
      <div className="confirm-modal-heading">
        <span className="confirm-modal-icon" aria-hidden="true"><Icon size={26} /></span>
        <h2 id={titleId}>{title}</h2>
      </div>
      <p id={descriptionId} className="confirm-modal-description">{description}</p>
      {error && <p className="confirm-modal-error" role="alert">{error}</p>}
      <div className="confirm-modal-actions">
        <Button variant="secondary" autoFocus disabled={pending} onClick={onClose}>กลับ</Button>
        <Button variant={danger ? 'danger' : 'primary'} disabled={pending} onClick={confirm}>
          {pending ? 'กำลังดำเนินการ…' : confirmText}
        </Button>
      </div>
    </dialog>
  );
}
