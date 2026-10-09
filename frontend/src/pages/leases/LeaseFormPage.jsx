import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRentalData } from '../../context/ApplicationContext';
import { useProperties } from '../../context/PropertyContext';
import { useLeases, getLeaseStatus } from '../../context/LeaseContext';
import { roleNavigation } from '../../data/mockData';
import DashboardLayout from '../../layouts/DashboardLayout';
import EmptyState from '../../components/properties/EmptyState';
import LeaseForm from '../../components/leases/LeaseForm';

export default function LeaseFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { user } = useAuth();
  const { tenants, applications, loading: rentalLoading } = useRentalData();
  const { properties, loading: propertiesLoading } = useProperties();
  const { leases, loading: leasesLoading, error, approvedTenants, eligibleProperties, createLease, updateLease } = useLeases();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState('');
  const lease = editing ? leases.find((item) => item.id === id) : null;
  const tenant = lease ? tenants.find((item) => item.id === lease.tenantId) : null;

  async function save(values) {
    setSubmitting(true);
    setSaveError('');
    try {
      const saved = editing ? await updateLease(id, values) : await createLease(values);
      navigate(`/leases/${saved.id}`, {
        replace: true,
        state: { notice: editing ? 'Lease changes saved.' : 'Active lease created and linked to the tenant and property.' },
      });
    } catch (saveErrorValue) {
      setSaveError(saveErrorValue.message || 'Unable to save this lease.');
    } finally {
      setSubmitting(false);
    }
  }

  const loading = rentalLoading || propertiesLoading || leasesLoading;

  return (
    <DashboardLayout user={user} title={editing ? 'Edit lease' : 'Create lease'} subtitle="Rental agreement" navItems={roleNavigation[user.role]}>
      <div className="property-form-page-heading"><div><p className="eyebrow">{editing ? 'LEASE TERMS' : 'APPROVED APPLICATION → LEASE'}</p><h2>{editing ? `${id} details` : 'Set the terms for a new tenancy.'}</h2><p>{editing ? 'Tenant and property remain linked to this lease.' : 'Only approved applicants without an active lease can be selected.'}</p></div><Link className="secondary-link" to="/leases"><ArrowLeft size={15} /> Back to leases</Link></div>
      {saveError && <div className="form-message error-message" role="alert">{saveError}</div>}
      {loading ? (
        <div className="property-loading-state">Loading leases...</div>
      ) : error ? (
        <div className="form-message error-message" role="alert">Unable to load lease information.</div>
      ) : editing && !lease ? (
        <EmptyState title="Lease not found." detail="This lease may no longer be available." action={<Link className="secondary-link" to="/leases">Back to leases</Link>} />
      ) : editing && getLeaseStatus(lease) === 'Terminated' ? (
        <EmptyState title="This lease is terminated." detail="Terminated lease records are retained as history and cannot be edited." action={<Link className="secondary-link" to={`/leases/${lease.id}`}>View lease history</Link>} />
      ) : (
        <LeaseForm
          lease={lease}
          tenants={tenants}
          approvedTenants={approvedTenants}
          properties={properties}
          eligibleProperties={eligibleProperties}
          approvedApplications={applications.filter((application) => application.status === 'Approved')}
          status={lease ? getLeaseStatus(lease) : 'Active'}
          submitting={submitting}
          onSubmit={save}
        />
      )}
    </DashboardLayout>
  );
}
