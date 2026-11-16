import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { deleteBug } from '../api.js';
import { StatusBadge, PriorityBadge } from './Badge.jsx';
import './DeleteBugModal.css';

/**
 * Confirm-and-delete modal for a single bug.
 *
 * Props:
 *   bug       — the bug object to delete
 *   onDeleted — called with the bug.id after successful deletion
 *   onClose   — called when the user cancels
 */
export function DeleteBugModal({ bug, onDeleted, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleDelete() {
    setLoading(true);
    setError('');
    try {
      await deleteBug(bug.id);
      onDeleted(bug.id);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="del-bug">
      {/* Warning icon */}
      <div className="del-bug__icon" aria-hidden="true">
        <Trash2 size={28} />
      </div>

      <h3 className="del-bug__title">Delete this bug?</h3>
      <p className="del-bug__sub">This action is permanent and cannot be undone.</p>

      {/* Bug preview card */}
      <div className="del-bug__card">
        <div className="del-bug__card-top">
          <span className="del-bug__id">{bug.id}</span>
          <StatusBadge status={bug.status} />
        </div>
        <div className="del-bug__card-title">{bug.title}</div>
        <div className="del-bug__card-meta">
          <PriorityBadge priority={bug.priority} />
          <span className="del-bug__severity">{bug.severity}</span>
        </div>
      </div>

      {error && (
        <div className="del-bug__error" role="alert">
          <AlertTriangle size={13} />
          {error}
        </div>
      )}

      <div className="del-bug__actions">
        <button className="btn btn--ghost" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button className="btn btn--delete" onClick={handleDelete} disabled={loading}>
          {loading
            ? <><span className="spinner" aria-hidden="true" /> Deleting…</>
            : <><Trash2 size={13} /> Delete Bug</>
          }
        </button>
      </div>
    </div>
  );
}
