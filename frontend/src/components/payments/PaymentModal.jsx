import { useEffect, useRef, useState } from 'react';
import { CreditCard, X } from 'lucide-react';

const emptyForm = {
  amount: '',
  paymentType: 'Rent',
  paymentMethod: 'Card',
  description: '',
  dueDate: new Date().toISOString().slice(0, 10),
};

export default function PaymentModal({ open, defaultValues = {}, onClose, onSubmit, submitting = false }) {
  const [form, setForm] = useState({ ...emptyForm, ...defaultValues });
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm, ...defaultValues });
    }
  }, [open, defaultValues.amount, defaultValues.paymentType, defaultValues.paymentMethod, defaultValues.description, defaultValues.dueDate]);

  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement;
    dialogRef.current?.querySelector('input, select, textarea, button')?.focus();
    return () => previousFocusRef.current?.focus?.();
  }, [open]);

  if (!open) return null;

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  const handleDialogKeyDown = (event) => {
    if (event.key === 'Escape') {
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = [...dialogRef.current.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]')];
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={dialogRef} className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title" aria-describedby="payment-modal-description" onKeyDown={handleDialogKeyDown}>
        <button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Close payment form"><X size={18} /></button>
        <div className="modal-icon">
          <CreditCard size={21} aria-hidden="true" />
        </div>
        <span className="eyebrow">Mock payment</span>
        <h2 id="payment-modal-title">Record a payment</h2>
        <p id="payment-modal-description">Record a payment request. It will remain pending until verified by a payment provider.</p>

        <form onSubmit={handleSubmit}>
          <div className="filter-grid">
            <label className="field-wrap">
              <span>Amount</span>
              <input type="number" min="1" step="any" value={form.amount} onChange={updateField('amount')} required />
            </label>
            <label className="field-wrap">
              <span>Payment type</span>
              <select value={form.paymentType} onChange={updateField('paymentType')}>
                <option value="Rent">Rent</option>
                <option value="Security Deposit">Security Deposit</option>
                <option value="Service Charge">Service Charge</option>
                <option value="Application Fee">Application Fee</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label className="field-wrap">
              <span>Method</span>
              <select value={form.paymentMethod} onChange={updateField('paymentMethod')}>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
              </select>
            </label>
            <label className="field-wrap">
              <span>Due date</span>
              <input type="date" value={form.dueDate || ''} onChange={updateField('dueDate')} />
            </label>
            <label className="field-wrap full-width">
              <span>Description</span>
              <textarea value={form.description} onChange={updateField('description')} rows="3" placeholder="Add a note for the payment record" />
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={submitting}>{submitting ? 'Recording...' : 'Confirm payment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
