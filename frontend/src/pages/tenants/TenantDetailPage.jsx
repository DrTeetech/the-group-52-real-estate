import { ArrowLeft, ArrowUpRight, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRentalData } from '../../context/ApplicationContext';
import { useProperties } from '../../context/PropertyContext';
import { useLeases, getLeaseStatus } from '../../context/LeaseContext';
import { roleNavigation } from '../../data/mockData';
import DashboardLayout from '../../layouts/DashboardLayout';
import EmptyState from '../../components/properties/EmptyState';
import ApplicationStatusBadge from '../../components/applications/ApplicationStatusBadge';
import TenantStatusBadge from '../../components/tenants/TenantStatusBadge';

const currency = (amount) => `₦${new Intl.NumberFormat('en-NG').format(amount || 0)}`;

export default function TenantDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { tenants, applications, loading: rentalLoading, error } = useRentalData();
  const { properties, loading: propertiesLoading } = useProperties();
  const { leases } = useLeases();
  const tenant = tenants.find((item) => item.id === id);
  const activeLease = tenant ? leases.find((lease) => lease.tenantId === tenant.id && ['Active', 'Expiring Soon'].includes(getLeaseStatus(lease))) || leases.find((lease) => lease.tenantId === tenant.id) : null;
  const property = tenant ? properties.find((item) => item.id === (activeLease?.propertyId || tenant.propertyId)) : null;
  const tenantApplications = tenant ? applications.filter((application) => application.tenantId === tenant.id || application.id === tenant.applicationId || application.applicantEmail?.toLowerCase() === tenant.email.toLowerCase()) : [];

  return (
    <DashboardLayout user={user} title={tenant?.name || 'Tenant details'} subtitle="Tenant record" navItems={roleNavigation[user.role]}>
      {rentalLoading || propertiesLoading ? (
        <div className="property-loading-state">Loading tenants...</div>
      ) : error ? (
        <div className="form-message error-message" role="alert">Unable to load tenants.</div>
      ) : !tenant ? (
        <EmptyState title="No tenants found." detail="This tenant record may no longer be available." action={<Link className="secondary-link" to="/tenants">Back to tenants</Link>} />
      ) : (
        <div className="tenant-detail-page">
          <div className="property-form-page-heading">
            <div><p className="eyebrow">TENANT PROFILE</p><h2>{tenant.name}</h2><p>Frontend mock record · Created {tenant.createdAt}</p></div>
            <Link className="secondary-link" to="/tenants"><ArrowLeft size={15} /> Back to tenants</Link>
          </div>
          <div className="tenant-detail-statuses"><TenantStatusBadge status={tenant.status} /><TenantStatusBadge status={tenant.leaseStatus} /><TenantStatusBadge status={tenant.paymentStatus} /></div>

          <div className="panel-grid two-col tenant-detail-grid">
            <section className="panel-card">
              <div className="panel-header"><div><p className="eyebrow">PERSONAL INFORMATION</p><h3>Contact details</h3></div></div>
              <div className="mini-list">
                <div><span>Name</span><strong>{tenant.name}</strong></div>
                <div><span>Email</span><strong>{tenant.email}</strong></div>
                <div><span>Phone</span><strong>{tenant.phone}</strong></div>
                <div><span>Date of birth</span><strong>{tenant.dateOfBirth || 'Not provided'}</strong></div>
                <div><span>Current address</span><strong>{tenant.currentAddress || 'Not provided'}</strong></div>
              </div>
            </section>

            <section className="panel-card">
              <div className="panel-header"><div><p className="eyebrow">PROPERTY</p><h3>Current residence</h3></div></div>
              {property ? (
                <div className="application-property-summary">
                  <img src={property.images?.[0] || property.image} alt={property.name} />
                  <div><strong>{property.name}</strong><span><MapPin size={14} /> {property.location}</span><small>{property.address}</small><small>{currency(tenant.monthlyRent)} / month</small><TenantStatusBadge status={property.status} /><Link to={`/properties/${property.id}`}>View property <ArrowUpRight size={14} /></Link></div>
                </div>
              ) : <p className="property-muted">No associated property.</p>}
            </section>

            <section className="panel-card">
              <div className="panel-header"><div><p className="eyebrow">LEASE SUMMARY</p><h3>Current agreement</h3></div></div>
              {activeLease ? (
                <div className="mini-list">
                  <div><span>Property</span><strong>{property?.name || 'Property record unavailable'}</strong></div>
                  <div><span>Lease status</span><strong>{getLeaseStatus(activeLease)}</strong></div>
                  <div><span>Lease start</span><strong>{activeLease.startDate || 'Not started'}</strong></div>
                  <div><span>Lease end</span><strong>{activeLease.endDate || 'Not set'}</strong></div>
                  <div><span>Monthly rent</span><strong>{currency(activeLease.monthlyRent)}</strong></div>
                </div>
              ) : (
                <p className="property-muted">No active lease.</p>
              )}
            </section>

            <section className="panel-card">
              <div className="panel-header"><div><p className="eyebrow">PAYMENT SUMMARY</p><h3>Mock account snapshot</h3></div></div>
              <div className="mini-list">
                <div><span>Payment status</span><strong>{tenant.paymentStatus}</strong></div>
                <div><span>Last payment</span><strong>{tenant.lastPayment || 'No payments yet'}</strong></div>
                <div><span>Outstanding amount</span><strong>{currency(tenant.outstandingAmount)}</strong></div>
              </div>
              <p className="property-muted">Payment actions are not part of this phase.</p>
            </section>

            <section className="panel-card">
              <div className="panel-header"><div><p className="eyebrow">PROPERTY CARE</p><h3>Maintenance summary</h3></div></div>
              {property?.maintenanceSummary?.length ? <div className="mini-list">{property.maintenanceSummary.map((item, index) => <div key={`${item.issue}-${index}`}><span>{item.issue} · {item.date}</span><strong>{item.status}</strong></div>)}</div> : <p className="property-muted">No recent mock maintenance records.</p>}
              <p className="property-muted">Maintenance workflows are not part of this phase.</p>
            </section>

            <section className="panel-card">
              <div className="panel-header"><div><p className="eyebrow">APPLICATION HISTORY</p><h3>Rental applications</h3></div></div>
              {tenantApplications.length ? <div className="mini-list">{tenantApplications.map((application) => <div key={application.id}><span>{application.id} · {application.property}</span><Link className="application-history-link" to={`/applications/${application.id}`}>{application.status} <ArrowUpRight size={13} /></Link><ApplicationStatusBadge status={application.status} /></div>)}</div> : <p className="property-muted">No application history.</p>}
            </section>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
