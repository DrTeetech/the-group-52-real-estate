import { BedDouble, Bath, MapPin, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import PropertyStatusBadge from './PropertyStatusBadge';

const formatCurrency = (value) => `₦${new Intl.NumberFormat('en-NG').format(value || 0)}`;
const fallbackImage = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80';

export default function PropertyCard({ property, canManage = false, onEdit, onDelete }) {
  const image = property.images?.[0] || property.image || fallbackImage;
  const tenantName = typeof property.tenant === 'string' ? property.tenant : property.tenant?.name;

  return (
    <article className="managed-property-card">
      <Link className="managed-property-image" to={`/properties/${property.id}`} aria-label={`View ${property.name}`}>
        <img src={image} alt={property.name} loading="lazy" />
        <PropertyStatusBadge status={property.status} />
      </Link>
      <div className="managed-property-body">
        <div className="managed-property-heading">
          <div>
            <p className="eyebrow">{property.type}</p>
            <h2>{property.name}</h2>
          </div>
        </div>
        <p className="property-location-inline"><MapPin size={14} /> {property.location || [property.city, property.state].filter(Boolean).join(', ')}</p>
        <div className="managed-property-facts">
          <span><BedDouble size={15} /> {property.bedrooms} beds</span>
          <span><Bath size={15} /> {property.bathrooms} baths</span>
          {canManage && tenantName && <span className="managed-tenant">Tenant: {tenantName}</span>}
        </div>
        <div className="managed-property-footer">
          <p><strong>{formatCurrency(property.monthlyRent)}</strong><span>/ month</span></p>
          <Link className="secondary-link" to={`/properties/${property.id}`}>View details</Link>
        </div>
        {canManage && (
          <div className="managed-card-actions">
            <button type="button" className="toolbar-button" onClick={() => onEdit(property)} aria-label={`Edit ${property.name}`}>
              <Pencil size={14} /> Edit
            </button>
            <button type="button" className="toolbar-button delete-action" onClick={() => onDelete(property)} aria-label={`Delete ${property.name}`}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
