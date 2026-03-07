import { Trash2, AlertTriangle } from 'lucide-react';

const DeleteConfirmModal = ({ employee, onConfirm, onCancel, deleting }) => (
  <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
    <div className="modal" style={{ maxWidth: 400 }}>
      <div className="modal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--red-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertTriangle size={18} color="var(--red)" />
          </div>
          <h2 className="modal-title">Delete Employee</h2>
        </div>
      </div>

      <div className="modal-body" style={{ paddingTop: 14 }}>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>
          Are you sure you want to delete{' '}
          <strong style={{ color: 'var(--ink)' }}>{employee.full_name}</strong>?
        </p>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8 }}>
          This will permanently remove the employee and all their attendance records. This action cannot be undone.
        </p>
      </div>

      <div className="modal-footer">
        <button
          className="btn btn-danger"
          onClick={onConfirm}
          disabled={deleting}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <Trash2 size={14} />
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
        <button
          className="btn btn-outline"
          onClick={onCancel}
          disabled={deleting}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

export default DeleteConfirmModal;