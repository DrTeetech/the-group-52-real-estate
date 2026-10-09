import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProperties } from '../../context/PropertyContext';
import { ROLE } from '../../data/roles';
import { roleNavigation } from '../../data/mockData';
import DashboardLayout from '../../layouts/DashboardLayout';
import DeletePropertyModal from '../../components/properties/DeletePropertyModal';
import EmptyState from '../../components/properties/EmptyState';
import PropertyCard from '../../components/properties/PropertyCard';
import PropertyFilters from '../../components/properties/PropertyFilters';
import PropertyStats from '../../components/properties/PropertyStats';

const pageSize = 8;
const initialFilters = { query: '', status: 'All', type: 'All', minRent: '', maxRent: '', bedrooms: '0', sort: 'newest' };

function filterAndSort(properties, filters) {
  const query = filters.query.trim().toLowerCase();
  const filtered = properties.filter((property) => {
    const status = property.status === 'Vacant' ? 'Available' : property.status;
    const matchesQuery = !query || [property.name, property.location, property.city, property.state, property.type]
      .some((value) => String(value || '').toLowerCase().includes(query));
    const matchesStatus = filters.status === 'All' || status === filters.status;
    const matchesType = filters.type === 'All' || property.type === filters.type;
    const matchesMin = filters.minRent === '' || property.monthlyRent >= Number(filters.minRent);
    const matchesMax = filters.maxRent === '' || property.monthlyRent <= Number(filters.maxRent);
    const matchesBedrooms = filters.bedrooms === '0' || property.bedrooms >= Number(filters.bedrooms);
    return matchesQuery && matchesStatus && matchesType && matchesMin && matchesMax && matchesBedrooms;
  });

  return filtered.sort((left, right) => {
    switch (filters.sort) {
      case 'oldest': return new Date(left.createdAt || 0) - new Date(right.createdAt || 0);
      case 'rent-low': return left.monthlyRent - right.monthlyRent;
      case 'rent-high': return right.monthlyRent - left.monthlyRent;
      case 'name-asc': return left.name.localeCompare(right.name);
      case 'name-desc': return right.name.localeCompare(left.name);
      default: return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    }
  });
}

export default function PropertiesPage() {
  const { user } = useAuth();
  const { properties, loading, error, reloadProperties, deleteProperty } = useProperties();
  const navigate = useNavigate();
  const location = useLocation();
  const canManage = [ROLE.ADMIN, ROLE.PROPERTY_MANAGER, ROLE.LANDLORD].includes(user.role);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [actionError, setActionError] = useState('');

  const roleProperties = canManage ? properties : properties.filter((property) => property.status === 'Available');
  const filteredProperties = useMemo(() => filterAndSort(roleProperties, filters), [roleProperties, filters]);
  const pageCount = Math.max(1, Math.ceil(filteredProperties.length / pageSize));
  const pageProperties = filteredProperties.slice((page - 1) * pageSize, page * pageSize);

  function updateFilters(updater) {
    setFilters(updater);
    setPage(1);
  }

  function clearFilters() {
    setFilters(initialFilters);
    setPage(1);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setActionError('');
    try {
      await deleteProperty(deleteTarget.id);
      setNotice(`${deleteTarget.name} was deleted.`);
      setDeleteTarget(null);
      setPage(1);
    } catch {
      setActionError('Unable to delete this property. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <DashboardLayout
      user={user}
      title={canManage ? 'Properties' : 'Available properties'}
      subtitle="Portfolio"
      navItems={roleNavigation[user.role]}
    >
      <div className="property-page-intro">
        <div>
          <p className="eyebrow">{canManage ? 'PROPERTY PORTFOLIO' : 'FIND YOUR NEXT HOME'}</p>
          <h2>{canManage ? 'Every place, thoughtfully managed.' : 'A few places to start.'}</h2>
          <p>{canManage ? 'Review availability, occupancy, and rental details across your portfolio.' : 'Browse homes currently available to rent across Nigeria.'}</p>
        </div>
        {canManage && <Link className="primary-button" to="/properties/new"><Plus size={16} /> Add property</Link>}
      </div>

      {canManage && <PropertyStats properties={properties} />}
      {notice && <div className="form-message success-message" role="status">{notice}</div>}
      {actionError && <div className="form-message error-message" role="alert">{actionError}</div>}

      <PropertyFilters values={filters} onChange={updateFilters} onClear={clearFilters} />

      <div className="property-results-heading">
        <div><p className="eyebrow">PROPERTY COLLECTION</p><h2>{loading ? 'Loading properties...' : `${filteredProperties.length} ${filteredProperties.length === 1 ? 'property' : 'properties'}`}</h2></div>
        {!loading && filteredProperties.length > 0 && <p>Showing {Math.min((page - 1) * pageSize + 1, filteredProperties.length)}–{Math.min(page * pageSize, filteredProperties.length)} of {filteredProperties.length}</p>}
      </div>

      {loading ? (
        <div className="property-loading-state">Loading properties...</div>
      ) : error ? (
        <div className="panel-card property-load-error" role="alert"><p>{error || 'Unable to load properties.'}</p><button type="button" className="secondary-link" onClick={reloadProperties}>Try again</button></div>
      ) : filteredProperties.length === 0 ? (
        <EmptyState
          title="No properties found."
          detail="There are no properties matching these filters. Clear filters to see the full collection."
          action={<button type="button" className="secondary-link" onClick={clearFilters}><ArrowLeft size={14} /> Clear filters</button>}
        />
      ) : (
        <div className="managed-property-grid">
          {pageProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              canManage={canManage}
              onEdit={(item) => navigate(`/properties/${item.id}/edit`)}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {!loading && pageCount > 1 && (
        <nav className="property-pagination" aria-label="Property pages">
          <button type="button" className="toolbar-button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}><ArrowLeft size={15} /> Previous</button>
          <span>Page {page} of {pageCount}</span>
          <button type="button" className="toolbar-button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount}>Next <ArrowRight size={15} /></button>
        </nav>
      )}

      <DeletePropertyModal property={deleteTarget} deleting={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    </DashboardLayout>
  );
}