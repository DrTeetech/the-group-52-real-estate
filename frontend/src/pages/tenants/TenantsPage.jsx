import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRentalData } from '../../context/ApplicationContext';
import { useProperties } from '../../context/PropertyContext';
import { roleNavigation } from '../../data/mockData';
import DashboardLayout from '../../layouts/DashboardLayout';
import EmptyState from '../../components/properties/EmptyState';
import TenantCard from '../../components/tenants/TenantCard';
import TenantFilters from '../../components/tenants/TenantFilters';
import TenantStats from '../../components/tenants/TenantStats';

const pageSize = 8;
const initialFilters = { query: '', status: 'All', lease: 'All', payment: 'All', sort: 'name-asc' };

export default function TenantsPage() {
  const { user } = useAuth();
  const { tenants, loading, error, reloadRentalData } = useRentalData();
  const { properties } = useProperties();
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const visibleTenants = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    const visible = tenants.filter((tenant) => {
      const matchesQuery = !query || [tenant.name, tenant.email, tenant.phone, tenant.property].some((value) => String(value || '').toLowerCase().includes(query));
      return matchesQuery
        && (filters.status === 'All' || tenant.status === filters.status)
        && (filters.lease === 'All' || tenant.leaseStatus === filters.lease)
        && (filters.payment === 'All' || tenant.paymentStatus === filters.payment);
    });
    return visible.sort((left, right) => {
      switch (filters.sort) {
        case 'name-desc': return right.name.localeCompare(left.name);
        case 'rent-high': return right.monthlyRent - left.monthlyRent;
        case 'rent-low': return left.monthlyRent - right.monthlyRent;
        default: return left.name.localeCompare(right.name);
      }
    });
  }, [tenants, filters]);
  const pageCount = Math.max(1, Math.ceil(visibleTenants.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageTenants = visibleTenants.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function updateFilters(updater) {
    setFilters(updater);
    setPage(1);
  }

  function clearFilters() {
    setFilters(initialFilters);
    setPage(1);
  }

  return (
    <DashboardLayout user={user} title="Tenants" subtitle="Tenant directory" navItems={roleNavigation[user.role]}>
      <div className="rental-page-intro"><div><p className="eyebrow">PEOPLE & RESIDENCES</p><h2>Good relationships start with clarity.</h2><p>Review tenant records and their current property status.</p></div></div>
      {!loading && !error && <TenantStats tenants={tenants} properties={properties} />}
      <TenantFilters values={filters} onChange={updateFilters} onClear={clearFilters} />
      <div className="rental-results-heading"><div><p className="eyebrow">TENANT DIRECTORY</p><h2>{loading ? 'Loading tenants...' : `${visibleTenants.length} tenants`}</h2></div>{!loading && visibleTenants.length > 0 && <span>Page {currentPage} of {pageCount}</span>}</div>
      {loading ? (
        <div className="property-loading-state">Loading tenants...</div>
      ) : error ? (
        <div className="panel-card property-load-error" role="alert"><p>Unable to load tenants.</p><button type="button" className="secondary-link" onClick={reloadRentalData}>Try again</button></div>
      ) : visibleTenants.length === 0 ? (
        <EmptyState title="No tenants found." detail="No tenant records match these filters." action={<button type="button" className="secondary-link" onClick={clearFilters}>Clear filters</button>} />
      ) : (
        <div className="rental-record-grid">{pageTenants.map((tenant) => <TenantCard key={tenant.id} tenant={tenant} />)}</div>
      )}
      {!loading && pageCount > 1 && <nav className="property-pagination" aria-label="Tenant pages"><button type="button" className="toolbar-button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage <= 1}>Previous</button><span>Page {currentPage} of {pageCount}</span><button type="button" className="toolbar-button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={currentPage >= pageCount}>Next</button></nav>}
    </DashboardLayout>
  );
}
