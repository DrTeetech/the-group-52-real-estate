import { useState } from 'react';
import { ArrowLeft, MapPin, Pencil, Trash2 } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProperties } from '../../context/PropertyContext';
import { useLeases, getLeaseStatus } from '../../context/LeaseContext';
import { ROLE } from '../../data/roles';
import { roleNavigation } from '../../data/mockData';
import DashboardLayout from '../../layouts/DashboardLayout';
import DeletePropertyModal from '../../components/properties/DeletePropertyModal';
import EmptyState from '../../components/properties/EmptyState';
import PropertyGallery from '../../components/properties/PropertyGallery';
import PropertyStatusBadge from '../../components/properties/PropertyStatusBadge';

const formatCurrency = (value) => `₦${new Intl.NumberFormat('en-NG').format(value || 0)}`;

function formatAddress(property) {
  const address = property.address || '';
  const suffix = [property.city, property.state]
    .filter((part) => part && !address.toLowerCase().includes(part.toLowerCase()));
  return [address, ...suffix].filter(Boolean).join(', ');
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { properties, loading, error, deleteProperty } = useProperties();
  const { leases } = useLeases();
  const canManage = [ROLE.ADMIN, ROLE.PROPERTY_MANAGER, ROLE.LANDLORD].includes(user.role);
  const navigate = useNavigate();
  const location = useLocation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState('');
  const property = properties.find((item) => item.id === id);
  const propertyLease = property ? leases.find((lease) => lease.propertyId === property.id && ['Active', 'Expiring Soon'].includes(getLeaseStatus(lease))) || leases.find((lease) => lease.propertyId === property.id) : null;
  const currentTenant = typeof property?.tenant === 'object' ? property.tenant : (propertyLease ? { name: 'Tenant record unavailable', leaseStatus: getLeaseStatus(propertyLease) } : null);
  const isCurrentTenant = currentTenant?.email?.toLowerCase() === user.email.toLowerCase();

  async function confirmDelete() {
    if (!property) return;
    setDeleting(true);
    setActionError('');
    try {
      await deleteProperty(property.id);
      navigate('/properties', { replace: true, state: { notice: `${property.name} was deleted.` } });
    } catch {
      setActionError('Unable to delete this property. Please try again.');
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <DashboardLayout user={user} title={property?.name || 'Property details'} subtitle="Property" navItems={roleNavigation[user.role]}>
      {loading ? (
        <div className="property-loading-state">Loading properties...</div>
      ) : error ? (
        <div className="form-message error-message" role="alert">Unable to load properties.</div>
      ) : !property ? (
        <EmptyState title="Property not found." detail="This property may have been removed from the portfolio." action={<Link className="secondary-link" to="/properties">Back to properties</Link>} />
      ) : user.role === ROLE.TENANT && property.status !== 'Available' && !isCurrentTenant ? (
        <EmptyState title="This property is not available." detail="Only available properties can be viewed from this account." action={<Link className="secondary-link" to="/properties">Browse available properties</Link>} />
      ) : (
        <div className="property-detail-page">
          {location.state?.notice && <div className="form-message success-message" role="status">{location.state.notice}</div>}
          {actionError && <div className="form-message error-message" role="alert">{actionError}</div>}

          <section className="property-detail-header panel-card">
            <PropertyGallery property={property} />
            <div className="property-detail-heading">
              <div className="property-detail-title-row">
                <div><p className="eyebrow">{property.type}</p><h2>{property.name}</h2></div>
                <PropertyStatusBadge status={property.status} />
              </div>
              <p className="property-location-inline"><MapPin size={15} /> {formatAddress(property)}</p>
              <div className="property-detail-price"><strong>{formatCurrency(property.monthlyRent)}</strong><span>/ month</span></div>
              <div className="property-detail-actions">
                <Link className="secondary-link" to="/properties"><ArrowLeft size={15} /> Back to properties</Link>
                {user.role === ROLE.TENANT && property.status === 'Available' && <Link className="primary-button small-button" to={`/applications/new?propertyId=${property.id}`}>Apply for this property</Link>}
                {canManage && <Link className="primary-button small-button" to={`/properties/${property.id}/edit`}><Pencil size={14} /> Edit property</Link>}
                {canManage && <button type="button" className="toolbar-button delete-action" onClick={() => setDeleteOpen(true)}><Trash2 size={14} /> Delete</button>}
              </div>
            </div>
          </section>

          <div className="panel-grid two-col property-info-grid">
            <section className="panel-card">
              <div className="panel-header"><div><p className="eyebrow">THE HOME</p><h3>Property information</h3></div></div>
              <p className="property-description">{property.description}</p>
              <div className="mini-list">
                <div><span>Property type</span><strong>{property.type}</strong></div>
                <div><span>Bedrooms</span><strong>{property.bedrooms}</strong></div>
                <div><span>Bathrooms</span><strong>{property.bathrooms}</strong></div>
                <div><span>Square footage</span><strong>{Number(property.squareFootage || 0).toLocaleString()} sq ft</strong></div>
                <div><span>Security deposit</span><strong>{formatCurrency(property.securityDeposit)}</strong></div>
                <div><span>Availability</span><strong>{property.status}</strong></div>
              </div>
            </section>

            <section className="panel-card">
              <div className="panel-header"><div><p className="eyebrow">AMENITIES</p><h3>Included features</h3></div></div>
              {property.amenities?.length ? <div className="tag-list">{property.amenities.map((amenity) => <span className="tag-item" key={amenity}>{amenity}</span>)}</div> : <p className="property-muted">No amenities listed.</p>}
            </section>
          </div>

          {canManage && (
            <div className="panel-grid two-col property-info-grid">
              <section className="panel-card">
                <div className="panel-header"><div><p className="eyebrow">TENANCY</p><h3>Tenant information</h3></div></div>
                {propertyLease ? (
                  <div className="mini-list">
                    <div><span>Tenant name</span><strong>{property.tenant?.name || 'Tenant record unavailable'}</strong></div>
                    {property.tenant?.email && <div><span>Email</span><strong>{property.tenant.email}</strong></div>}
                    {property.tenant?.phone && <div><span>Phone</span><strong>{property.tenant.phone}</strong></div>}
                    <div><span>Lease status</span><strong>{getLeaseStatus(propertyLease)}</strong></div>
                  </div>
                ) : <p className="property-muted">No active lease.</p>}
              </section>

              <section className="panel-card">
                <div className="panel-header"><div><p className="eyebrow">RENT</p><h3>Payment summary</h3></div></div>
                <div className="mini-list">
                  <div><span>Monthly rent</span><strong>{formatCurrency(propertyLease?.monthlyRent || property.monthlyRent)}</strong></div>
                  <div><span>Last payment</span><strong>{property.paymentSummary?.lastPayment || 'No payments yet'}</strong></div>
                  <div><span>Payment status</span><strong>{property.paymentSummary?.paymentStatus || 'Not available'}</strong></div>
                  <div><span>Outstanding amount</span><strong>{formatCurrency(property.paymentSummary?.outstandingAmount)}</strong></div>
                </div>
              </section>

              <section className="panel-card">
                <div className="panel-header"><div><p className="eyebrow">LEASE</p><h3>Lease summary</h3></div></div>
                {propertyLease ? (
                  <div className="mini-list">
                    <div><span>Lease start</span><strong>{propertyLease.startDate}</strong></div>
                    <div><span>Lease end</span><strong>{propertyLease.endDate}</strong></div>
                    <div><span>Lease status</span><strong>{getLeaseStatus(propertyLease)}</strong></div>
                    <div><span>Monthly rent</span><strong>{formatCurrency(propertyLease.monthlyRent)}</strong></div>
                  </div>
                ) : <p className="property-muted">No active lease.</p>}
              </section>

              <section className="panel-card">
                <div className="panel-header"><div><p className="eyebrow">PROPERTY CARE</p><h3>Recent maintenance</h3></div></div>
                {property.maintenanceSummary?.length ? (
                  <div className="mini-list">
                    {property.maintenanceSummary.map((request, index) => <div key={`${request.issue}-${index}`}><span>{request.issue} · {request.date}</span><strong>{request.status}</strong></div>)}
                  </div>
                ) : <p className="property-muted">No recent maintenance requests.</p>}
              </section>
            </div>
          )}

          <DeletePropertyModal property={deleteOpen ? property : null} deleting={deleting} onCancel={() => setDeleteOpen(false)} onConfirm={confirmDelete} />
        </div>
      )}
    </DashboardLayout>
  );
}