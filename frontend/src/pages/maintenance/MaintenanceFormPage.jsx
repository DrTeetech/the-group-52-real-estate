import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMaintenance } from '../../context/MaintenanceContext';
import { useRentalData } from '../../context/ApplicationContext';
import { useProperties } from '../../context/PropertyContext';
import { roleNavigation } from '../../data/mockData';
import { ROLE } from '../../data/roles';
import DashboardLayout from '../../layouts/DashboardLayout';

const initialState = {
  propertyId: '',
  category: 'Plumbing',
  issue: '',
  priority: 'Medium',
  description: '',
};

export default function MaintenanceFormPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addMaintenanceRequest } = useMaintenance();
  const { tenants } = useRentalData();
  const { properties } = useProperties();
  const [formValues, setFormValues] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const tenantProfile = useMemo(() => {
    if (!user || user.role !== ROLE.TENANT) return null;
    return tenants.find((tenant) => tenant.email.toLowerCase() === user.email.toLowerCase()) || null;
  }, [tenants, user]);

  const defaultPropertyId = tenantProfile?.propertyId || properties[0]?.id || '';

  const handleChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!formValues.propertyId || !formValues.issue.trim()) {
      setError('Choose a property and describe the issue before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      const property = properties.find((item) => item.id === formValues.propertyId);
      await addMaintenanceRequest({
        tenantId: tenantProfile?.id || 'tenant-101',
        tenantName: user?.name || tenantProfile?.name || 'Tenant',
        propertyId: formValues.propertyId,
        propertyName: property?.name || 'Property',
        leaseId: tenantProfile ? (tenants.find((tenant) => tenant.id === tenantProfile.id)?.propertyId ? `lease-${tenantProfile.propertyId.slice(-3)}` : '') : '',
        category: formValues.category,
        issue: formValues.issue,
        priority: formValues.priority,
        status: 'Submitted',
        description: formValues.description || 'No extra details provided.',
        submittedDate: new Date().toISOString().slice(0, 10),
        updatedDate: new Date().toISOString().slice(0, 10),
        assignedTo: null,
        attachments: [],
        resolutionNotes: '',
      });
      navigate('/maintenance');
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit the maintenance request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout user={user} title="Submit maintenance request" subtitle="Service request form" navItems={roleNavigation[user.role]}>
      <div className="panel-card">
        <div className="panel-header with-actions">
          <div>
            <p className="eyebrow">NEW REQUEST</p>
            <h3>Tell us what needs attention</h3>
          </div>
          <button type="button" className="secondary-link" onClick={() => navigate('/maintenance')}>Back to list</button>
        </div>

        {error && <div className="form-message error-message" role="alert">{error}</div>}

        <form className="property-form-grid" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="propertyId">Property</label>
            <select id="propertyId" className="select-field" value={formValues.propertyId || defaultPropertyId} onChange={(event) => handleChange('propertyId', event.target.value)}>
              <option value="">Select a property</option>
              {properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="category">Category</label>
            <select id="category" className="select-field" value={formValues.category} onChange={(event) => handleChange('category', event.target.value)}>
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="HVAC">HVAC</option>
              <option value="Appliance">Appliance</option>
              <option value="Security">Security</option>
              <option value="General">General</option>
            </select>
          </div>

          <div className="field-group full-field">
            <label htmlFor="issue">Issue summary</label>
            <input id="issue" className="select-field" value={formValues.issue} onChange={(event) => handleChange('issue', event.target.value)} placeholder="Example: kitchen sink is leaking under the cabinet" />
          </div>

          <div className="field-group">
            <label htmlFor="priority">Priority</label>
            <select id="priority" className="select-field" value={formValues.priority} onChange={(event) => handleChange('priority', event.target.value)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          <div className="field-group full-field">
            <label htmlFor="description">Additional details</label>
            <textarea id="description" className="select-field" value={formValues.description} onChange={(event) => handleChange('description', event.target.value)} rows={5} placeholder="Let our team know when the issue starts, what you have tried, and how it is affecting your home." />
          </div>

          <div className="property-detail-actions" style={{ gridColumn: '1 / -1' }}>
            <button type="button" className="ghost-button" onClick={() => navigate('/maintenance')}>Cancel</button>
            <button type="submit" className="primary-button" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit request'}</button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
