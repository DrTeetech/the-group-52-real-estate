import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

const currency = (amount) => `₦${new Intl.NumberFormat('en-NG').format(amount || 0)}`;

export default function RenewLeaseModal({ lease, submitting, onCancel, onConfirm }) {
  const [endDate, setEndDate] = useState(lease?.endDate || '');
  const [monthlyRent, setMonthlyRent] = useState(String(lease?.monthlyRent || ''));
  const [error, setError] = useState('');

  useEffect(() => {
    setEndDate(lease?.endDate || '');
    setMonthlyRent(String(lease?.monthlyRent || ''));
    setError('');
  }, [lease]);

  if (!lease) return null;

  function submit(event) {
    event.preventDefault();
    if (!endDate || endDate <= lease.endDate) {
      setError('Choose a new end date after the current end date.');
      return;
    }
    if (!Number.isFinite(Number(monthlyRent)) || Number(monthlyRent) <= 0) {
      setError('New monthly rent must be greater than zero.');
      return;
    }
    onConfirm({ endDate, monthlyRent: Number(monthlyRent) });
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <form className="confirm-modal lease-modal" role="dialog" aria-modal="true" aria-labelledby="renew-lease-title" onSubmit={submit}>
        <button type="button" className="icon-button modal-close" aria-label="Close renewal" onClick={onCancel}><X size={18} /></button>
        <span className="modal-icon"><RefreshCw size={20} /></span>
        <p className="eyebrow">LEASE RENEWAL</p>
        <h2 id="renew-lease-title">Renew this lease</h2>
        <div className="mini-list lease-renewal-current"><div><span>Current end date</span><strong>{lease.endDate}</strong></div><div><span>Current rent</span><strong>{currency(lease.monthlyRent)}</strong></div></div>
        <label className="field-group"><span>New end date *</span><input type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setError(''); }} min={lease.endDate} required /></label>
        <label className="field-group"><span>New monthly rent (₦) *</span><input type="number" min="1" step="1000" value={monthlyRent} onChange={(event) => { setMonthlyRent(event.target.value); setError(''); }} required /></label>
        {error && <div className="form-message error-message" role="alert">{error}</div>}
        <div className="modal-actions"><button type="button" className="ghost-button" onClick={onCancel} disabled={submitting}>Cancel</button><button type="submit" className="primary-button" disabled={submitting}>{submitting ? 'Saving…' : 'Confirm renewal'}</button></div>
      </form>
    </div>
  );
}
