import { useState } from 'react';
import LeaseStatusBadge from './LeaseStatusBadge';

const today = () => new Date().toISOString().slice(0, 10);

function initialValues(lease) {
  return {
    tenantId: lease?.tenantId || '',
    propertyId: lease?.propertyId || '',
    startDate: lease?.startDate || today(),
    endDate: lease?.endDate || '',
    monthlyRent: lease?.monthlyRent ?? '',
    securityDeposit: lease?.securityDeposit ?? '',
    paymentDueDate: lease?.paymentDueDate || today(),
    lateFee: lease?.lateFee ?? 0,
    noticePeriodDays: lease?.noticePeriodDays ?? 30,
    renewalTerms: lease?.renewalTerms || 'Renewal by mutual agreement and written notice.',
    occupancyLimit: lease?.occupancyLimit ?? 1,
    additionalNotes: lease?.additionalNotes || '',
    status: lease?.status || 'Active',
  };
}

export default function LeaseForm({ lease, tenants, approvedTenants, properties, eligibleProperties, approvedApplications, status, submitting, onSubmit }) {
  const editing = Boolean(lease);
  const [form, setForm] = useState(() => initialValues(lease));
  const [error, setError] = useState('');
  const currentTenant = tenants.find((tenant) => tenant.id === form.tenantId);
  const currentApplication = approvedApplications.find((application) => application.tenantId === currentTenant?.id || application.id === currentTenant?.applicationId);
  const currentProperty = properties.find((property) => property.id === form.propertyId);
  const propertyOptions = editing
    ? [...properties.filter((property) => property.id === lease.propertyId), ...eligibleProperties(form.tenantId).filter((property) => property.id !== lease.propertyId)]
    : eligibleProperties(form.tenantId);
  const tenantOptions = editing ? (currentTenant ? [currentTenant] : []) : approvedTenants;

  function change(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'tenantId' && !editing ? { propertyId: '', monthlyRent: '', securityDeposit: '' } : {}),
      ...(name === 'propertyId' && !editing ? {
        monthlyRent: currentApplication && value === currentApplication.propertyId ? properties.find((property) => property.id === value)?.monthlyRent || '' : properties.find((property) => property.id === value)?.monthlyRent || '',
        securityDeposit: properties.find((property) => property.id === value)?.securityDeposit || '',
      } : {}),
    }));
    setError('');
  }

  function submit(event) {
    event.preventDefault();
    const required = [form.tenantId, form.propertyId, form.startDate, form.endDate, form.monthlyRent, form.securityDeposit, form.paymentDueDate];
    if (required.some((value) => String(value).trim() === '')) {
      setError('Complete all required lease fields.');
      return;
    }
    if (Number.isNaN(Date.parse(form.startDate)) || Number.isNaN(Date.parse(form.endDate)) || form.endDate <= form.startDate) {
      setError('Lease end date must be after a valid start date.');
      return;
    }
    if (Number.isNaN(Date.parse(form.paymentDueDate))) {
      setError('Choose a valid payment due date.');
      return;
    }
    if (!Number.isFinite(Number(form.monthlyRent)) || Number(form.monthlyRent) <= 0) {
      setError('Monthly rent must be greater than zero.');
      return;
    }
    if (!Number.isFinite(Number(form.securityDeposit)) || Number(form.securityDeposit) < 0) {
      setError('Security deposit must be a valid non-negative amount.');
      return;
    }
    if (!Number.isFinite(Number(form.noticePeriodDays)) || Number(form.noticePeriodDays) < 0) {
      setError('Notice period must be a valid non-negative number of days.');
      return;
    }

    onSubmit({
      ...form,
      monthlyRent: Number(form.monthlyRent),
      securityDeposit: Number(form.securityDeposit),
      lateFee: Number(form.lateFee) || 0,
      noticePeriodDays: Number(form.noticePeriodDays),
      occupancyLimit: Number(form.occupancyLimit) || currentApplication?.occupants || 1,
      status: editing ? form.status : 'Active',
    });
  }

  return (
    <form className="lease-form" onSubmit={submit} noValidate>
      <section className="panel-card rental-form-section">
        <div className="property-form-heading"><span>01</span><div><p className="eyebrow">TENANT & PROPERTY</p><h2>Approved rental application</h2></div></div>
        <div className="property-form-grid">
          <label className="field-group"><span>Approved tenant *</span>
            {editing ? <input value={currentTenant?.name || lease.tenantName || ''} readOnly /> : <select name="tenantId" value={form.tenantId} onChange={change} required><option value="">Select an approved tenant</option>{tenantOptions.map((tenant) => <option value={tenant.id} key={tenant.id}>{tenant.name} · {tenant.email}</option>)}</select>}
          </label>
          <label className="field-group"><span>Property *</span>
            {editing ? <input value={currentProperty?.name || lease.propertyName || ''} readOnly /> : <select name="propertyId" value={form.propertyId} onChange={change} disabled={!form.tenantId} required><option value="">Select the approved property</option>{propertyOptions.map((property) => <option value={property.id} key={property.id}>{property.name} · {property.location}</option>)}</select>}
          </label>
          {currentTenant && <p className="property-muted lease-approved-note">Tenant is linked to an approved application{currentApplication ? ` (${currentApplication.id})` : ''}.</p>}
        </div>
      </section>

      <section className="panel-card rental-form-section">
        <div className="property-form-heading"><span>02</span><div><p className="eyebrow">LEASE DATES</p><h2>Term and payment schedule</h2></div></div>
        <div className="property-form-grid">
          <label className="field-group"><span>Start date *</span><input type="date" name="startDate" value={form.startDate} onChange={change} disabled={editing} required /></label>
          <label className="field-group"><span>End date *</span><input type="date" name="endDate" min={form.startDate} value={form.endDate} onChange={change} required /></label>
          <label className="field-group"><span>Payment due date *</span><input type="date" name="paymentDueDate" value={form.paymentDueDate} onChange={change} required /></label>
          <label className="field-group"><span>Notice period (days) *</span><input type="number" name="noticePeriodDays" min="0" step="1" value={form.noticePeriodDays} onChange={change} required /></label>
          {editing && <div className="field-group"><span>Lease status</span>{status === 'Draft' ? <select name="status" value={form.status} onChange={change}><option>Draft</option><option>Active</option></select> : <div className="lease-readonly-status"><LeaseStatusBadge status={status} /><small>Status follows the lease dates.</small></div>}</div>}
        </div>
      </section>

      <section className="panel-card rental-form-section">
        <div className="property-form-heading"><span>03</span><div><p className="eyebrow">FINANCIAL TERMS</p><h2>Rent and deposit</h2></div></div>
        <div className="property-form-grid">
          <label className="field-group"><span>Monthly rent (₦) *</span><input type="number" min="1" step="1000" name="monthlyRent" value={form.monthlyRent} onChange={change} required /></label>
          <label className="field-group"><span>Security deposit (₦) *</span><input type="number" min="0" step="1000" name="securityDeposit" value={form.securityDeposit} onChange={change} required /></label>
          <label className="field-group"><span>Late fee (₦)</span><input type="number" min="0" step="1000" name="lateFee" value={form.lateFee} onChange={change} /></label>
          <label className="field-group"><span>Occupancy limit</span><input type="number" min="1" step="1" name="occupancyLimit" value={form.occupancyLimit} onChange={change} /></label>
        </div>
      </section>

      <section className="panel-card rental-form-section">
        <div className="property-form-heading"><span>04</span><div><p className="eyebrow">LEASE TERMS</p><h2>Renewal and notes</h2></div></div>
        <div className="property-form-grid">
          <label className="field-group full-field"><span>Renewal terms *</span><textarea name="renewalTerms" rows="3" value={form.renewalTerms} onChange={change} required /></label>
          <label className="field-group full-field"><span>Additional notes</span><textarea name="additionalNotes" rows="4" value={form.additionalNotes} onChange={change} placeholder="Optional notes for the tenant and property team." /></label>
        </div>
      </section>

      {error && <div className="form-message error-message" role="alert">{error}</div>}
      <div className="property-form-actions"><button type="submit" className="primary-button" disabled={submitting}>{submitting ? 'Saving lease…' : editing ? 'Save lease changes' : 'Create active lease'}</button></div>
    </form>
  );
}
