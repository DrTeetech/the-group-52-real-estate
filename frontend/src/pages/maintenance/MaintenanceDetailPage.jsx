import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMaintenance } from '../../context/MaintenanceContext';
import { maintenanceApi } from '../../services/api';
import { roleNavigation } from '../../data/mockData';
import { ROLE } from '../../data/roles';
import DashboardLayout from '../../layouts/DashboardLayout';

function statusClass(status) {
  switch (status) {
    case 'Submitted': return 'status-neutral';
    case 'In Progress': return 'status-warning';
    case 'Resolved':
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

export default function MaintenanceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { updateMaintenanceStatus, resolveMaintenanceRequest } = useMaintenance();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    setError('');
    setRequest(null);

    maintenanceApi.getMaintenanceRequest(id)
      .then(({ data }) => {
        if (isActive) setRequest(data);
      })
      .catch((loadError) => {
        if (isActive) setError(loadError.message || 'Unable to load this maintenance request.');
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout user={user} title="Loading request" subtitle="Maintenance" navItems={roleNavigation[user.role]}>
        <div className="panel-card">Loading maintenance request…</div>
      </DashboardLayout>
    );
  }

  if (!request) {
    return (
      <DashboardLayout user={user} title="Request not found" subtitle="Maintenance" navItems={roleNavigation[user.role]}>
        <div className="panel-card"><p>{error || 'We could not find that maintenance request.'}</p><button type="button" className="primary-button" onClick={() => navigate('/maintenance')}>Back to maintenance</button></div>
      </DashboardLayout>
    );
  }

  async function handleStatusChange(status) {
    setSaving(true);
    setError('');
    try {
      const updated = await updateMaintenanceStatus(request.id, status, { resolutionNotes: request.resolutionNotes || '' });
      setRequest(updated);
    } catch (updateError) {
      setError(updateError.message || 'Unable to update this request right now.');
    } finally {
      setSaving(false);
    }
  }

  async function handleResolve() {
    setSaving(true);
    setError('');
    try {
      const updated = await resolveMaintenanceRequest(request.id, request.resolutionNotes || 'Request resolved by the maintenance team.', request.assignedTo);
      setRequest(updated);
    } catch (updateError) {
      setError(updateError.message || 'Unable to resolve this request right now.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout user={user} title="Maintenance request" subtitle={request.requestId} navItems={roleNavigation[user.role]}>
      <div className="property-detail-actions">
        <Link className="secondary-link" to="/maintenance">Back to all requests</Link>
        {user?.role !== ROLE.TENANT && (
          <>
            <button type="button" className="toolbar-button" onClick={() => handleStatusChange('In Progress')} disabled={saving}>Mark in progress</button>
            <button type="button" className="primary-button" onClick={handleResolve} disabled={saving}>Resolve request</button>
          </>
        )}
      </div>

      {error && <div className="form-message error-message" role="alert">{error}</div>}

      <div className="panel-grid two-col">
        <section className="panel-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">ISSUE SUMMARY</p>
              <h3>{request.issue}</h3>
            </div>
            <span className={`status-badge ${priorityClass(request.priority)}`}>{request.priority}</span>
          </div>
          <div className="mini-list">
            <div><span>Property</span><strong>{request.propertyName}</strong></div>
            <div><span>Tenant</span><strong>{request.tenantName}</strong></div>
            <div><span>Status</span><strong className={`status-badge ${statusClass(request.status)}`}>{request.status}</strong></div>
            <div><span>Category</span><strong>{request.category}</strong></div>
            <div><span>Assigned to</span><strong>{request.assignedTo || 'Unassigned'}</strong></div>
            <div><span>Submitted</span><strong>{request.submittedDate}</strong></div>
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">DETAILS</p>
              <h3>Service notes</h3>
            </div>
          </div>
          <p style={{ color: '#54635d', lineHeight: 1.7 }}>{request.description}</p>
          {request.resolutionNotes && (
            <div style={{ marginTop: '16px', padding: '12px 14px', background: '#edf3ed', borderRadius: '8px' }}>
              <strong>Resolution notes</strong>
              <p style={{ marginTop: '8px', color: '#405148', lineHeight: 1.7 }}>{request.resolutionNotes}</p>
            </div>
          )}
        </section>
      </div>

      {user?.role !== ROLE.TENANT && (
        <section className="panel-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">WORKFLOW</p>
              <h3>Update status</h3>
            </div>
          </div>
          <div className="toolbar-actions">
            <button type="button" className="toolbar-button" onClick={() => handleStatusChange('Submitted')} disabled={saving}>Submitted</button>
            <button type="button" className="toolbar-button" onClick={() => handleStatusChange('In Progress')} disabled={saving}>In Progress</button>
            <button type="button" className="toolbar-button" onClick={() => handleStatusChange('Resolved')} disabled={saving}>Resolved</button>
            <button type="button" className="toolbar-button" onClick={() => handleStatusChange('Closed')} disabled={saving}>Closed</button>
          </div>
        </section>
      )}
    </DashboardLayout>
  );
}
