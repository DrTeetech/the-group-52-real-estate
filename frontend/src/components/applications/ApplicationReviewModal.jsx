import { Check, X } from 'lucide-react';
import { useState } from 'react';

export default function ApplicationReviewModal({ mode, application, submitting, onCancel, onConfirm }) {
  const [reason, setReason] = useState('');
  const rejecting = mode === 'reject';
  if (!mode || !application) return null;

  function submit(event) {
    event.preventDefault();
    if (rejecting && !reason.trim()) return;
    onConfirm(rejecting ? reason.trim() : undefined);
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <form className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="application-review-title" onSubmit={submit}>
        <button type="button" className="icon-button modal-close" aria-label="Close review confirmation" onClick={onCancel}><X size={18} /></button>
        <span className={`modal-icon ${rejecting ? 'is-reject' : ''}`}>{rejecting ? <X size={21} /> : <Check size={21} />}</span>
        <p className="eyebrow">{rejecting ? 'REJECT APPLICATION' : 'APPROVE APPLICATION'}</p>
        <h2 id="application-review-title">{rejecting ? 'Reject this rental application?' : 'Approve this rental application?'}</h2>
        <p><strong>{application.applicant}</strong> · {application.property}</p>
        {rejecting && <label className="field-group rejection-reason"><span>Reason for rejection *</span><textarea rows="4" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Share a concise reason with the applicant." required /></label>}
        {!rejecting && <p className="modal-note">Approval updates the application status. Tenant and lease records are handled in later phases.</p>}
        <div className="modal-actions"><button type="button" className="ghost-button" onClick={onCancel} disabled={submitting}>Cancel</button><button type="submit" className={rejecting ? 'danger-button' : 'primary-button'} disabled={submitting || (rejecting && !reason.trim())}>{submitting ? 'Saving…' : rejecting ? 'Reject application' : 'Approve application'}</button></div>
      </form>
    </div>
  );
}
