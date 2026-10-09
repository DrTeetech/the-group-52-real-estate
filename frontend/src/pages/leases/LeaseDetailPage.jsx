import { useState } from 'react';
import { ArrowLeft, Pencil, Printer, RefreshCw, XCircle } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRentalData } from '../../context/ApplicationContext';
import { useProperties } from '../../context/PropertyContext';
import { useLeases, getLeaseStatus } from '../../context/LeaseContext';
import { roleNavigation } from '../../data/mockData';
import { ROLE } from '../../data/roles';
import DashboardLayout from '../../layouts/DashboardLayout';
import EmptyState from '../../components/properties/EmptyState';
import LeaseStatusBadge from '../../components/leases/LeaseStatusBadge';
import RenewLeaseModal from '../../components/leases/RenewLeaseModal';
import TerminateLeaseModal from '../../components/leases/TerminateLeaseModal';

const currency = (amount) => `₦${new Intl.NumberFormat('en-NG').format(amount || 0)}`;
const durationLabel = (lease) => {
  const months = Math.max(1, Math.round((new Date(`${lease.endDate}T00:00:00`) - new Date(`${lease.startDate}T00:00:00`)) / (30.44 * 24 * 60 * 60 * 1000)));
  return months >= 12 ? `${Math.floor(months / 12)} year${Math.floor(months / 12) === 1 ? '' : 's'}${months % 12 ? ` ${months % 12} months` : ''}` : `${months} months`;
};

export default function LeaseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { tenants, loading: rentalLoading, error: rentalError } = useRentalData();
  const { properties, loading: propertyLoading } = useProperties();
  const { leases, loading: leasesLoading, error, renewLease, terminateLease } = useLeases();
  const location = useLocation();
  const [renewOpen, setRenewOpen] = useState(false);
  const [terminateOpen, setTerminateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [actionError, setActionError] = useState('');
  const lease = leases.find((item) => item.id === id);
  const tenant = lease ? tenants.find((item) => item.id === lease.tenantId) : null;
  const property = lease ? properties.find((item) => item.id === lease.propertyId) : null;
  const canManage = user.role === ROLE.ADMIN || user.role === ROLE.PROPERTY_MANAGER;
  const tenantOwnsLease = user.role !== ROLE.TENANT || tenant?.email?.toLowerCase() === user.email.toLowerCase();
  const status = lease ? getLeaseStatus(lease) : '';
  const loading = rentalLoading || propertyLoading || leasesLoading;

  async function confirmRenew(values) {
    setSaving(true);
    setActionError('');
    try {
      await renewLease(id, values);
      setNotice('Lease renewed. The tenant and property summaries were updated.');
      setRenewOpen(false);
    } catch (renewError) {
      setActionError(renewError.message || 'Unable to renew this lease.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmTerminate(reason) {
    setSaving(true);
    setActionError('');
    try {
      await terminateLease(id, reason);
      setNotice('Lease terminated and retained in history.');
      setTerminateOpen(false);
    } catch (terminationError) {
      setActionError(terminationError.message || 'Unable to terminate this lease.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout user={user} title={lease?.id || 'Lease details'} subtitle="Lease" navItems={roleNavigation[user.role]}>
      {loading ? (
        <div className="property-loading-state">Loading lease details...</div>
      ) : error || rentalError ? (
        <div className="form-message error-message" role="alert">Unable to load lease details.</div>
      ) : !lease || !tenantOwnsLease ? (
        <EmptyState title="Lease not found." detail="This lease is not available for this account." action={<Link className="secondary-link" to="/leases">Back to leases</Link>} />
      ) : (
        <div className="lease-detail-page">
          {notice && <div className="form-message success-message" role="status">{notice}</div>}
          {actionError && <div className="form-message error-message" role="alert">{actionError}</div>}
          <section className="panel-card lease-detail-header">
            <div><p className="eyebrow">LEASE AGREEMENT</p><h2>{lease.id}</h2><p>{property?.name || lease.propertyName} · {tenant.name}</p></div>
            <LeaseStatusBadge status={status} />
          </section>

          <div className="panel-grid two-col lease-detail-grid">
            <section className="panel-card">
              <div className="panel-header"><div><p className="eyebrow">AGREEMENT</p><h3>Lease information</h3></div></div>
              <div className="mini-list">
                <div><span>Lease ID</span><strong>{lease.id}</strong></div>
                <div><span>Status</span><strong>{status}</strong></div>
                <div><span>Start date</span><strong>{lease.startDate}</strong></div>
                <div><span>End date</span><strong>{lease.endDate}</strong></div>
                <div><span>Duration</span><strong>{durationLabel(lease)}</strong></div>
                <div><span>Created date</span><strong>{lease.createdAt}</strong></div>
              </div>
            </section>

            <section className="panel-card">
              <div className="panel-header"><div><p className="eyebrow">PROPERTY</p><h3>{property?.name || lease.propertyName}</h3></div></div>
              {property && <img className="lease-property-image" src={property.images?.[0] || property.image} alt={property.name} />}
              <div className="mini-list">
                <div><span>Address</span><strong>{property?.address || 'Not available'}</strong></div>
                <div><span>Property type</span><strong>{property?.type || 'Not available'}</strong></div>
                <div><span>Bedrooms</span><strong>{property?.bedrooms ?? 'Not available'}</strong></div>
                <div><span>Bathrooms</span><strong>{property?.bathrooms ?? 'Not available'}</strong></div>
                <div><span>Monthly rent</span><strong>{currency(lease.monthlyRent)}</strong></div>
              </div>
            </section>

            <section className="panel-card">
              <div className="panel-header"><div><p className="eyebrow">TENANT</p><h3>{tenant.name}</h3></div></div>
              <div className="mini-list">
                <div><span>Name</span><strong>{tenant.name}</strong></div>
                <div><span>Email</span><strong>{tenant.email}</strong></div>
                <div><span>Phone</span><strong>{tenant.phone}</strong></div>
              </div>
            </section>

            <section className="panel-card">
              <div className="panel-header"><div><p className="eyebrow">FINANCIAL TERMS</p><h3>Rent and deposit</h3></div></div>
              <div className="mini-list">
                <div><span>Monthly rent</span><strong>{currency(lease.monthlyRent)}</strong></div>
                <div><span>Security deposit</span><strong>{currency(lease.securityDeposit)}</strong></div>
                <div><span>Payment due date</span><strong>{lease.paymentDueDate}</strong></div>
                <div><span>Late fee</span><strong>{currency(lease.lateFee)}</strong></div>
              </div>
            </section>

            <section className="panel-card">
              <div className="panel-header"><div><p className="eyebrow">LEASE TERMS</p><h3>Renewal and occupancy</h3></div></div>
              <div className="mini-list">
                <div><span>Renewal terms</span><strong>{lease.renewalTerms}</strong></div>
                <div><span>Notice period</span><strong>{lease.noticePeriodDays} days</strong></div>
                <div><span>Occupancy limit</span><strong>{lease.occupancyLimit} people</strong></div>
              </div>
              {lease.additionalNotes && <p className="lease-additional-notes">{lease.additionalNotes}</p>}
              {lease.terminationReason && <p className="form-message error-message"><strong>Termination reason:</strong> {lease.terminationReason}</p>}
            </section>
          </div>

          <div className="lease-detail-actions">
            <Link className="secondary-link" to="/leases"><ArrowLeft size={15} /> Back to leases</Link>
            {user.role === ROLE.TENANT && <button type="button" className="toolbar-button" onClick={() => window.print()}><Printer size={15} /> Print lease summary</button>}
            {canManage && !['Terminated', 'Draft'].includes(status) && <button type="button" className="toolbar-button" onClick={() => setRenewOpen(true)}><RefreshCw size={15} /> Renew</button>}
            {canManage && status === 'Active' && <button type="button" className="toolbar-button delete-action" onClick={() => setTerminateOpen(true)}><XCircle size={15} /> Terminate</button>}
            {canManage && status !== 'Terminated' && <Link className="primary-button small-button" to={`/leases/${lease.id}/edit`}><Pencil size={14} /> Edit lease</Link>}
          </div>
          {canManage && status === 'Draft' && <p className="property-muted">A draft lease is not yet active.</p>}
          <RenewLeaseModal lease={renewOpen ? lease : null} submitting={saving} onCancel={() => setRenewOpen(false)} onConfirm={confirmRenew} />
          <TerminateLeaseModal lease={terminateOpen ? lease : null} submitting={saving} onCancel={() => setTerminateOpen(false)} onConfirm={confirmTerminate} />
        </div>
      )}
    </DashboardLayout>
  );
}
