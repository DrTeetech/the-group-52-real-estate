import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLeases, getLeaseStatus } from '../../context/LeaseContext';
import { useRentalData } from '../../context/ApplicationContext';
import { useProperties } from '../../context/PropertyContext';
import { roleNavigation } from '../../data/mockData';
import { ROLE } from '../../data/roles';
import DashboardLayout from '../../layouts/DashboardLayout';
import EmptyState from '../../components/properties/EmptyState';
import LeaseCard from '../../components/leases/LeaseCard';
import LeaseFilters from '../../components/leases/LeaseFilters';
import LeaseStats from '../../components/leases/LeaseStats';
import RenewLeaseModal from '../../components/leases/RenewLeaseModal';
import TerminateLeaseModal from '../../components/leases/TerminateLeaseModal';

const pageSize = 8;
const initialFilters = { query: '', status: 'All', propertyId: 'All', duration: 'All', sort: 'newest' };

function leaseDurationDays(lease) {
  return (new Date(`${lease.endDate}T00:00:00`) - new Date(`${lease.startDate}T00:00:00`)) / (24 * 60 * 60 * 1000);
}

function matchesDuration(lease, duration) {
  if (duration === 'All') return true;
  const days = leaseDurationDays(lease);
  if (duration === 'short') return days < 365;
  if (duration === 'one-two') return days >= 365 && days < 730;
  return days >= 730;
}

export default function LeasesPage() {
  const { user } = useAuth();
  const { leases, loading, error, reloadLeases, getLeaseStatus: resolveStatus, renewLease, terminateLease } = useLeases();
  const { tenants } = useRentalData();
  const { properties } = useProperties();
  const canManage = user.role === ROLE.ADMIN || user.role === ROLE.PROPERTY_MANAGER;
  const ownTenantIds = tenants.filter((tenant) => tenant.email.toLowerCase() === user.email.toLowerCase()).map((tenant) => tenant.id);
  const visibleLeases = canManage ? leases : leases.filter((lease) => ownTenantIds.includes(lease.tenantId));
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [renewTarget, setRenewTarget] = useState(null);
  const [terminateTarget, setTerminateTarget] = useState(null);
  const [savingAction, setSavingAction] = useState(false);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');

  const filteredLeases = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    const result = visibleLeases.filter((lease) => {
      const tenant = tenants.find((item) => item.id === lease.tenantId);
      const property = properties.find((item) => item.id === lease.propertyId);
      const status = resolveStatus(lease);
      const matchesQuery = !query || [lease.id, tenant?.name, property?.name].some((value) => String(value || '').toLowerCase().includes(query));
      return matchesQuery
        && (filters.status === 'All' || status === filters.status)
        && (filters.propertyId === 'All' || lease.propertyId === filters.propertyId)
        && matchesDuration(lease, filters.duration);
    });
    return result.sort((left, right) => {
      switch (filters.sort) {
        case 'oldest': return new Date(left.createdAt || left.startDate) - new Date(right.createdAt || right.startDate);
        case 'rent-low': return left.monthlyRent - right.monthlyRent;
        case 'rent-high': return right.monthlyRent - left.monthlyRent;
        case 'ending': return new Date(left.endDate) - new Date(right.endDate);
        default: return new Date(right.createdAt || right.startDate) - new Date(left.createdAt || left.startDate);
      }
    });
  }, [visibleLeases, filters, tenants, properties, resolveStatus]);
  const pageCount = Math.max(1, Math.ceil(filteredLeases.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageLeases = filteredLeases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function updateFilters(updater) {
    setFilters(updater);
    setPage(1);
  }

  function clearFilters() {
    setFilters(initialFilters);
    setPage(1);
  }

  async function confirmRenew(values) {
    setSavingAction(true);
    setActionError('');
    try {
      await renewLease(renewTarget.id, values);
      setNotice(`${renewTarget.id} was renewed.`);
      setRenewTarget(null);
    } catch (renewError) {
      setActionError(renewError.message || 'Unable to renew this lease.');
    } finally {
      setSavingAction(false);
    }
  }

  async function confirmTermination(reason) {
    setSavingAction(true);
    setActionError('');
    try {
      await terminateLease(terminateTarget.id, reason);
      setNotice(`${terminateTarget.id} was terminated and retained in lease history.`);
      setTerminateTarget(null);
    } catch (terminationError) {
      setActionError(terminationError.message || 'Unable to terminate this lease.');
    } finally {
      setSavingAction(false);
    }
  }

  return (
    <DashboardLayout user={user} title={canManage ? 'Leases' : 'My lease'} subtitle="Rental agreements" navItems={roleNavigation[user.role]}>
      <div className="rental-page-intro"><div><p className="eyebrow">LEASE MANAGEMENT</p><h2>{canManage ? 'Clear terms make good homes.' : 'Your rental agreement.'}</h2><p>{canManage ? 'Create and manage agreements connected to approved applicants.' : 'Review your lease dates, rent, and terms.'}</p></div>{canManage && <Link className="primary-button" to="/leases/new">Create lease</Link>}</div>
      {canManage && !loading && !error && <LeaseStats leases={leases} />}
      {notice && <div className="form-message success-message" role="status">{notice}</div>}
      {actionError && <div className="form-message error-message" role="alert">{actionError}</div>}
      <LeaseFilters values={filters} properties={properties} onChange={updateFilters} onClear={clearFilters} />
      <div className="rental-results-heading"><div><p className="eyebrow">{canManage ? 'AGREEMENT REGISTER' : 'YOUR AGREEMENTS'}</p><h2>{loading ? 'Loading leases...' : `${filteredLeases.length} leases`}</h2></div>{!loading && filteredLeases.length > 0 && <span>Page {currentPage} of {pageCount}</span>}</div>

      {loading ? (
        <div className="property-loading-state">Loading leases...</div>
      ) : error ? (
        <div className="panel-card property-load-error" role="alert"><p>Unable to load leases.</p><button type="button" className="secondary-link" onClick={reloadLeases}>Try again</button></div>
      ) : filteredLeases.length === 0 ? (
        <EmptyState title="No leases found." detail={visibleLeases.length ? 'No leases match these filters.' : canManage ? 'Create a lease after an application is approved.' : 'No active lease.'} action={visibleLeases.length ? <button type="button" className="secondary-link" onClick={clearFilters}>Clear filters</button> : canManage ? <Link className="secondary-link" to="/applications">Review applications</Link> : undefined} />
      ) : (
        <div className="rental-record-grid">
          {pageLeases.map((lease) => (
            <LeaseCard
              key={lease.id}
              lease={lease}
              tenant={tenants.find((item) => item.id === lease.tenantId)}
              property={properties.find((item) => item.id === lease.propertyId)}
              status={resolveStatus(lease)}
              canManage={canManage}
              onRenew={setRenewTarget}
              onTerminate={setTerminateTarget}
            />
          ))}
        </div>
      )}

      {!loading && pageCount > 1 && <nav className="property-pagination" aria-label="Lease pages"><button type="button" className="toolbar-button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage <= 1}>Previous</button><span>Page {currentPage} of {pageCount}</span><button type="button" className="toolbar-button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={currentPage >= pageCount}>Next</button></nav>}
      <RenewLeaseModal lease={renewTarget} submitting={savingAction} onCancel={() => setRenewTarget(null)} onConfirm={confirmRenew} />
      <TerminateLeaseModal lease={terminateTarget} submitting={savingAction} onCancel={() => setTerminateTarget(null)} onConfirm={confirmTermination} />
    </DashboardLayout>
  );
}