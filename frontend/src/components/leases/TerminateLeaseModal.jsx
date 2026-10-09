import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function TerminateLeaseModal({ lease, submitting, onCancel, onConfirm }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  if (!lease) return null;

  function submit(event) {
    event.preventDefault();
    if (!reason.trim()) {
      setError('Enter a termination reason.');
      return;
    }
    onConfirm(reason.trim());
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <form className="confirm-modal lease-modal" role="alertdialog" aria-modal="true" aria-labelledby="terminate-lease-title" onSubmit={submit}>
        <button type="button" className="icon-button modal-close" aria-label="Close termination" onClick={onCancel}><X size={18} /></button>
        <span className="modal-icon is-reject"><AlertTriangle size={21} /></span>
        <p className="eyebrow">END LEASE</p>
        <h2 id="terminate-lease-title">Are you sure you want to terminate this lease?</h2>
        <p>This keeps the lease in the historical record and releases the property when appropriate.</p>
        <label className="field-group rejection-reason"><span>Termination reason *</span><textarea rows="4" value={reason} onChange={(event) => { setReason(event.target.value); setError(''); }} placeholder="Enter the reason for ending this lease." required /></label>
        {error && <div className="form-message error-message" role="alert">{error}</div>}
        <div className="modal-actions"><button type="button" className="ghost-button" onClick={onCancel} disabled={submitting}>Cancel</button><button type="submit" className="danger-button" disabled={submitting || !reason.trim()}>{submitting ? 'Saving…' : 'Terminate lease'}</button></div>
      </form>
    </div>
  );
}
