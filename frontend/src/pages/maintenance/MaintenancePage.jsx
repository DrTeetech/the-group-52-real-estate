import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMaintenance } from '../../context/MaintenanceContext';
import { useRentalData } from '../../context/ApplicationContext';
import { useProperties } from '../../context/PropertyContext';
import { roleNavigation } from '../../data/mockData';
import { ROLE } from '../../data/roles';
import DashboardLayout from '../../layouts/DashboardLayout';

const defaultFilters = { query: '', status: 'All', priority: 'All', propertyId: 'All' };

function statusClass(status) {
  switch (status) {
    case 'Submitted': return 'status-neutral';
    case 'In Progress': return 'status-warning';
    case 'Resolved': return 'status-success';
    case 'Closed': return 'status-success';
    default: return 'status-neutral';
  }
}

function priorityClass(priority) {
  switch (priority) {
    case 'Emergency': return 'status-danger';
    case 'High': return 'status-warning';
    case 'Medium': return 'status-neutral';
    case 'Low': return 'status-success';
    default: return 'status-neutral';
  }
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export default function MaintenancePage() {
  const { user } = useAuth();
  const { requests, loading, error, reloadMaintenanceRequests, updateMaintenanceStatus } = useMaintenance();
  const { tenants } = useRentalData();
  const { properties } = useProperties();
  const [filters, setFilters] = useState(defaultFilters);
  const [updatingId, setUpdatingId] = useState('');

  const tenantRecord = user?.role === ROLE.TENANT ? tenants.find((tenant) => tenant.email.toLowerCase() === user.email.toLowerCase()) : null;
  const visibleRequests = useMemo(() => {
    const base = user?.role === ROLE.TENANT && tenantRecord
      ? requests.filter((request) => request.tenantId === tenantRecord.id)
      : requests;

    const query = filters.query.trim().toLowerCase();
    return [...base]
      .filter((request) => {
        const matchesQuery = !query || [request.issue, request.propertyName, request.tenantName, request.requestId].some((value) => (value || '').toLowerCase().includes(query));
        const matchesStatus = filters.status === 'All' || request.status === filters.status;
        const matchesPriority = filters.priority === 'All' || request.priority === filters.priority;
        const matchesProperty = filters.propertyId === 'All' || request.propertyId === filters.propertyId;
        return matchesQuery && matchesStatus && matchesPriority && matchesProperty;
      })
      .sort((left, right) => new Date(right.submittedDate || 0) - new Date(left.submittedDate || 0));
  }, [tenantRecord, user, filters, requests]);

  const stats = {
    total: requests.length,
    open: requests.filter((request) => request.status !== 'Resolved' && request.status !== 'Closed').length,
    inProgress: requests.filter((request) => request.status === 'In Progress').length,
    resolved: requests.filter((request) => request.status === 'Resolved' || request.status === 'Closed').length,
  };

  async function handleStatusChange(requestId, status) {
    setUpdatingId(requestId);
    try {
      await updateMaintenanceStatus(requestId, status);
    } finally {
      setUpdatingId('');
    }
  }

  return (
    <DashboardLayout user={user} title={user?.role === ROLE.TENANT ? 'My maintenance' : 'Maintenance'} subtitle="Service requests" navItems={roleNavigation[user.role]}>
      <div className="rental-page-intro">
        <div>
          <p className="eyebrow">MAINTENANCE WORKFLOW</p>
          <h2>{user?.role === ROLE.TENANT ? 'Track every repair and update.' : 'Keep property operations moving.'}</h2>
          <p>{user?.role === ROLE.TENANT ? 'Review and follow up on issues in your home or rental unit.' : 'Monitor every active maintenance request and service priority.'}</p>
        </div>
        <Link className="primary-button" to="/maintenance/new">New request</Link>
      </div>

      {error && <div className="form-message error-message" role="alert">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card"><span className="stat-card-label">Total</span><h3>{stats.total}</h3><small>Requests in the system</small></div>
        <div className="stat-card"><span className="stat-card-label">Open</span><h3>{stats.open}</h3><small>Awaiting action</small></div>
        <div className="stat-card"><span className="stat-card-label">In progress</span><h3>{stats.inProgress}</h3><small>Assigned work orders</small></div>
        <div className="stat-card"><span className="stat-card-label">Resolved</span><h3>{stats.resolved}</h3><small>Completed and closed</small></div>
      </div>

      <div className="panel-card">
        <div className="panel-header with-actions">
          <div>
            <p className="eyebrow">FILTERS</p>
            <h3>Search and narrow requests</h3>
          </div>
          <button type="button" className="secondary-link" onClick={() => setFilters(defaultFilters)}>Clear</button>
        </div>
        <div className="rental-filter-controls property-filter-grid">
          <div className="field-group">
            <label htmlFor="maintenance-query">Search</label>
            <input id="maintenance-query" className="select-field" value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Issue, property, or request ID" />
          </div>
          <div className="field-group">
            <label htmlFor="maintenance-status">Status</label>
            <select id="maintenance-status" className="select-field" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="All">All</option>
              <option value="Submitted">Submitted</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="maintenance-priority">Priority</label>
            <select id="maintenance-priority" className="select-field" value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}>
              <option value="All">All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="maintenance-property">Property</label>
            <select id="maintenance-property" className="select-field" value={filters.propertyId} onChange={(event) => setFilters((current) => ({ ...current, propertyId: event.target.value }))}>
              <option value="All">All</option>
              {properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="panel-card">Loading maintenance requests…</div>
      ) : visibleRequests.length === 0 ? (
        <div className="panel-card"><p className="empty-state-title">No maintenance requests match the current filters.</p></div>
      ) : (
        <div className="table-wrap panel-card">
          <table>
            <thead>
              <tr>
                <th>Request</th>
                <th>Property</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRequests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <strong>{request.issue}</strong><br />
                    <small>{request.requestId} · {request.tenantName}</small>
                  </td>
                  <td>{request.propertyName}</td>
                  <td><span className={`status-badge ${priorityClass(request.priority)}`}>{request.priority}</span></td>
                  <td><span className={`status-badge ${statusClass(request.status)}`}>{request.status}</span></td>
                  <td>{formatDate(request.submittedDate)}</td>
                  <td>
                    <div className="toolbar-actions">
                      <Link className="secondary-link" to={`/maintenance/${request.id}`} style={{ minHeight: '34px', padding: '0 12px' }}>View</Link>
                      {!user || user.role !== ROLE.TENANT ? (
                        <select className="select-field" value={request.status} onChange={(event) => handleStatusChange(request.id, event.target.value)} disabled={updatingId === request.id} style={{ minHeight: '34px', padding: '0 10px', width: '150px' }}>
                          <option value="Submitted">Submitted</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="property-pagination" style={{ marginTop: '18px' }}>
        <button type="button" className="toolbar-button" onClick={reloadMaintenanceRequests}>Refresh</button>
      </div>
    </DashboardLayout>
  );
}
