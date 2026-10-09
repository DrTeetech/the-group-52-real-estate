import { AlertTriangle, X } from 'lucide-react';

export default function DeletePropertyModal({ property, deleting, onCancel, onConfirm }) {
  if (!property) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-property-title" aria-describedby="delete-property-description">
        <button type="button" className="icon-button modal-close" aria-label="Close confirmation" onClick={onCancel}><X size={18} /></button>
        <span className="modal-icon"><AlertTriangle size={21} /></span>
        <p className="eyebrow">REMOVE PROPERTY</p>
        <h2 id="delete-property-title">Are you sure you want to delete this property?</h2>
        <p id="delete-property-description"><strong>{property.name}</strong> will be deleted from the property records.</p>
        {property.status === 'Occupied' && (
          <p className="form-message error-message">This property is occupied. Deleting it may affect the tenant’s rental record.</p>
        )}
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onCancel} disabled={deleting}>Cancel</button>
          <button type="button" className="danger-button" onClick={onConfirm} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete Property'}
          </button>
        </div>
      </section>
    </div>
  );
}
