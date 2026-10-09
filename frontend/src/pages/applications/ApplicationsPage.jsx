import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRentalData } from '../../context/ApplicationContext';
import { roleNavigation } from '../../data/mockData';
import DashboardLayout from '../../layouts/DashboardLayout';
import EmptyState from '../../components/properties/EmptyState';
import ApplicationCard from '../../components/applications/ApplicationCard';
import ApplicationFilters from '../../components/applications/ApplicationFilters';
import ApplicationStats from '../../components/applications/ApplicationStats';

const pageSize = 8;
const initialFilters = { query: '', status: 'All', sort: 'newest' };

function filterApplications(applications, filters) {
  const query = filters.query.trim().toLowerCase();
  const result = applications.filter((application) => {
    const matchesQuery = !query || [application.id, application.applicant, application.property, application.location]
      .some((value) => String(value || '').toLowerCase().includes(query));
    return matchesQuery && (filters.status === 'All' || application.status === filters.status);
  });
  return result.sort((left, right) => {
    switch (filters.sort) {
      case 'oldest': return new Date(left.date) - new Date(right.date);
      case 'income-high': return right.income - left.income;
      case 'income-low': return left.income - right.income;
      case 'name-asc': return left.applicant.localeCompare(right.applicant);
      default: return new Date(right.date) - new Date(left.date);
    }
  });
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const { applications, loading, error, reloadRentalData } = useRentalData();
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const visibleApplications = useMemo(() => filterApplications(applications, filters), [applications, filters]);
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
    <DashboardLayout user={user} title="Applications" subtitle="Rental applications" navItems={roleNavigation[user.role]}>
      <div className="rental-page-intro"><div><p className="eyebrow">APPLICATION PIPELINE</p><h2>Find the right fit for every home.</h2><p>Review applicant details and move each request through the process.</p></div></div>
      {!loading && !error && <ApplicationStats applications={applications} />}
      <ApplicationFilters values={filters} onChange={updateFilters} onClear={clearFilters} />
      <div className="rental-results-heading"><div><p className="eyebrow">INCOMING REQUESTS</p><h2>{loading ? 'Loading applications...' : `${visibleApplications.length} applications`}</h2></div>{!loading && visibleApplications.length > 0 && <span>Page {currentPage} of {pageCount}</span>}</div>

      {loading ? (
        <div className="property-loading-state">Loading applications...</div>
      ) : error ? (
        <div className="panel-card property-load-error" role="alert"><p>Unable to load applications.</p><button type="button" className="secondary-link" onClick={reloadRentalData}>Try again</button></div>
      ) : visibleApplications.length === 0 ? (
        <EmptyState title="No applications found." detail="No applications match your filters. Clear filters to see the full queue." action={<button type="button" className="secondary-link" onClick={clearFilters}>Clear filters</button>} />
      ) : (
        <div className="rental-record-grid">
          {pageApplications.map((application) => <ApplicationCard key={application.id} application={application} />)}
        </div>
      )}

      {!loading && pageCount > 1 && <nav className="property-pagination" aria-label="Application pages"><button type="button" className="toolbar-button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage <= 1}>Previous</button><span>Page {currentPage} of {pageCount}</span><button type="button" className="toolbar-button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={currentPage >= pageCount}>Next</button></nav>}
    </DashboardLayout>
  );
}