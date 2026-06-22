interface ConfirmDialogProps {
  title: string
  message: string
  onSave: () => void
  onDiscard: () => void
  onCancel: () => void
  saveLabel?: string
  discardLabel?: string
}

export function ConfirmDialog({
  title,
  message,
  onSave,
  onDiscard,
  onCancel,
  saveLabel = 'Guardar',
  discardLabel = 'No guardar'
}: ConfirmDialogProps) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className="confirm-header">
          <h2>{title}</h2>
        </div>
        <div className="confirm-body">
          <p style={{ whiteSpace: 'pre-wrap' }}>{message}</p>
        </div>
        <div className="confirm-actions">
          <button className="confirm-btn confirm-btn-save" onClick={onSave}>{saveLabel}</button>
          <button className="confirm-btn confirm-btn-discard" onClick={onDiscard}>{discardLabel}</button>
          <button className="confirm-btn confirm-btn-cancel" onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}
