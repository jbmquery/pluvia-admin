// src/components/general/formDrawerFooterComponent.jsx
// Botones del modal: Cancelar + Guardar/Actualizar (+ Eliminar en modo edición).
import { Trash2 } from 'lucide-react'

export default function FormDrawerFooter({ formId, isEdit, saving, canDelete = true, onClose, onDelete }) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {isEdit && onDelete && (
        <button
          type="button"
          className="btn btn-outline btn-error sm:mr-auto"
          onClick={onDelete}
          disabled={saving || !canDelete}
          title={canDelete ? 'Eliminar' : 'No tienes permiso para eliminar este registro'}
        >
          <Trash2 className="size-4" />
          Eliminar
        </button>
      )}
      <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
        Cancelar
      </button>
      <button type="submit" form={formId} className="btn btn-primary" disabled={saving}>
        {saving && <span className="loading loading-spinner loading-sm" />}
        {isEdit ? 'Actualizar' : 'Guardar'}
      </button>
    </div>
  )
}
