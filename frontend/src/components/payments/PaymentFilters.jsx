export default function PaymentFilters({ values, onChange, onClear, tenants = [], properties = [], leases = [] }) {
  const updateField = (field) => (event) => onChange(field, event.target.value);

  return (
    <div className="panel-card">
      <div className="panel-header with-actions">
        <div>
          <span className="eyebrow">Payment filters</span>
          <h3>Review the payment register</h3>
        </div>
        <button type="button" className="secondary-button" onClick={onClear}>Clear filters</button>
      </div>

      <div className="filter-grid">
        <label className="field-wrap">
          <span>Search</span>
          <input type="text" value={values.query || ''} onChange={updateField('query')} placeholder="Tenant, property, or reference" />
        </label>
        <label className="field-wrap">
          <span>Status</span>
          <select value={values.status || 'All'} onChange={updateField('status')}>
            <option value="All">All</option>
            <option value="Successful">Successful</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Overdue">Overdue</option>
          </select>
        </label>
        <label className="field-wrap">
          <span>Payment type</span>
          <select value={values.paymentType || 'All'} onChange={updateField('paymentType')}>
            <option value="All">All</option>
            <option value="Rent">Rent</option>
            <option value="Late Fee">Late Fee</option>
            <option value="Deposit">Deposit</option>
          </select>
        </label>
        <label className="field-wrap">
          <span>Method</span>
          <select value={values.paymentMethod || 'All'} onChange={updateField('paymentMethod')}>
            <option value="All">All</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card">Card</option>
            <option value="Cash">Cash</option>
            <option value="Transfer">Transfer</option>
          </select>
        </label>
        <label className="field-wrap">
          <span>Tenant</span>
          <select value={values.tenantId || 'All'} onChange={updateField('tenantId')}>
            <option value="All">All tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </select>
        </label>
        <label className="field-wrap">
          <span>Property</span>
          <select value={values.propertyId || 'All'} onChange={updateField('propertyId')}>
            <option value="All">All properties</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>{property.name}</option>
            ))}
          </select>
        </label>
        <label className="field-wrap">
          <span>Lease</span>
          <select value={values.leaseId || 'All'} onChange={updateField('leaseId')}>
            <option value="All">All leases</option>
            {leases.map((lease) => (
              <option key={lease.id} value={lease.id}>{lease.id}</option>
            ))}
          </select>
        </label>
        <label className="field-wrap">
          <span>From</span>
          <input type="date" value={values.dateFrom || ''} onChange={updateField('dateFrom')} />
        </label>
        <label className="field-wrap">
          <span>To</span>
          <input type="date" value={values.dateTo || ''} onChange={updateField('dateTo')} />
        </label>
      </div>
    </div>
  );
}
