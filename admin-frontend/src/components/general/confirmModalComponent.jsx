// src/components/general/confirmModalComponent.jsx
export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null
  return (
    <dialog className="modal modal-open modal-bottom sm:modal-middle" aria-modal="true">
      <div className="modal-box">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="py-3 text-base-content/80">{message}</p>
        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button type="button" className="btn btn-error" onClick={onConfirm} disabled={loading}>
            {loading && <span className="loading loading-spinner loading-sm" />}
            {confirmText}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={loading ? undefined : onCancel} />
    </dialog>
  )
}
