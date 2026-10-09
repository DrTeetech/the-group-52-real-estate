import { Search, X } from 'lucide-react';

export default function TenantFilters({ values, onChange, onClear }) {
  function update(name, value) {
    onChange((current) => ({ ...current, [name]: value }));
  }

  return (
    <section className="rental-filter-panel" aria-label="Tenant search and filters">
      <label className="property-search-field"><Search size={17} /><input type="search" aria-label="Search tenants" placeholder="Search by tenant, email, or property" value={values.query} onChange={(event) => update('query', event.target.value)} /></label>
      <div className="rental-filter-controls">
        <label className="field-group"><span>Tenant status</span><select value={values.status} onChange={(event) => update('status', event.target.value)}><option value="All">All statuses</option>{['Active', 'Pending', 'Inactive'].map((status) => <option key={status}>{status}</option>)}</select></label>
        <label className="field-group"><span>Lease status</span><select value={values.lease} onChange={(event) => update('lease', event.target.value)}><option value="All">All lease statuses</option>{['Not Started', 'Active', 'Expiring Soon', 'Expired'].map((status) => <option key={status}>{status}</option>)}</select></label>
        <label className="field-group"><span>Payment status</span><select value={values.payment} onChange={(event) => update('payment', event.target.value)}><option value="All">All payment statuses</option>{['Paid', 'Pending', 'Overdue'].map((status) => <option key={status}>{status}</option>)}</select></label>
        <label className="field-group"><span>Sort by</span><select value={values.sort} onChange={(event) => update('sort', event.target.value)}><option value="name-asc">Name: A-Z</option><option value="name-desc">Name: Z-A</option><option value="rent-high">Rent: High to Low</option><option value="rent-low">Rent: Low to High</option></select></label>
        <button type="button" className="text-button" onClick={onClear}><X size={14} /> Clear filters</button>
      </div>
    </section>
  );
}
