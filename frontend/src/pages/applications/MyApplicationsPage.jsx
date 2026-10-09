import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRentalData } from '../../context/ApplicationContext';
import { useProperties } from '../../context/PropertyContext';
import { roleNavigation } from '../../data/mockData';
import DashboardLayout from '../../layouts/DashboardLayout';
import EmptyState from '../../components/properties/EmptyState';
import ApplicationCard from '../../components/applications/ApplicationCard';
import ApplicationFilters from '../../components/applications/ApplicationFilters';

const pageSize = 8;
const initialFilters = { query: '', status: 'All', sort: 'newest' };

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const { applications, loading, error, reloadRentalData } = useRentalData();
  const { properties } = useProperties();
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const myApplications = applications
    .filter((application) => application.applicantEmail?.toLowerCase() === user.email.toLowerCase())
    .map((application) => ({
      ...application,
      propertyRent: properties.find((property) => property.id === application.propertyId)?.monthlyRent || 0,
    }));
  const visibleApplications = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    const visible = myApplications.filter((application) => {
      const matchesQuery = !query || [application.property, application.location, application.id].some((value) => String(value || '').toLowerCase().includes(query));
      return matchesQuery && (filters.status === 'All' || application.status === filters.status);
    });
    return visible.sort((left, right) => filters.sort === 'oldest' ? new Date(left.date) - new Date(right.date) : new Date(right.date) - new Date(left.date));
  }, [myApplications, filters]);
  const pageCount = Math.max(1, Math.ceil(visibleApplications.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageApplications = visibleApplications.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function updateFilters(updater) {
    setFilters(updater);
    setPage(1);
  }

  function clearFilters() {
    setFilters(initialFilters);
    setPage(1);
  }

  return (
    <DashboardLayout user={user} title="My applications" subtitle="Application history" navItems={roleNavigation[user.role]}>
      <div className="rental-page-intro"><div><p className="eyebrow">YOUR APPLICATIONS</p><h2>Every next step, in one place.</h2><p>Follow the status of each home you’ve applied for.</p></div><Link className="secondary-link" to="/properties">Browse properties</Link></div>
      <ApplicationFilters values={filters} onChange={updateFilters} onClear={clearFilters} />
      <div className="rental-results-heading"><div><p className="eyebrow">APPLICATION HISTORY</p><h2>{loading ? 'Loading applications...' : `${visibleApplications.length} applications`}</h2></div></div>
      {loading ? (
        <div className="property-loading-state">Loading applications...</div>
      ) : error ? (
        <div className="panel-card property-load-error" role="alert"><p>Unable to load applications.</p><button type="button" className="secondary-link" onClick={reloadRentalData}>Try again</button></div>
      ) : visibleApplications.length === 0 ? (
        <EmptyState title="No applications found." detail={myApplications.length ? 'No applications match your filters.' : 'Your submitted applications will appear here.'} action={myApplications.length ? <button type="button" className="secondary-link" onClick={clearFilters}>Clear filters</button> : <Link className="secondary-link" to="/properties">Browse available properties</Link>} />
      ) : (
        <div className="rental-record-grid">{pageApplications.map((application) => <ApplicationCard key={application.id} application={application} tenantView detailPath={`/my-applications/${application.id}`} />)}</div>
      )}
      {!loading && pageCount > 1 && <nav className="property-pagination" aria-label="My application pages"><button type="button" className="toolbar-button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage <= 1}>Previous</button><span>Page {currentPage} of {pageCount}</span><button type="button" className="toolbar-button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={currentPage >= pageCount}>Next</button></nav>}
    </DashboardLayout>
  );
}
