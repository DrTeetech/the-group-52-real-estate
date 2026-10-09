import { Search, X } from 'lucide-react';

export default function ApplicationFilters({ values, onChange, onClear }) {
  function update(name, value) {
    onChange((current) => ({ ...current, [name]: value }));
  }

  return (
    <section className="rental-filter-panel" aria-label="Application search and filters">
      <label className="property-search-field"><Search size={17} /><input type="search" aria-label="Search applications" placeholder="Search applicant, property, or application ID" value={values.query} onChange={(event) => update('query', event.target.value)} /></label>
      <div className="rental-filter-controls">
        <label className="field-group"><span>Status</span><select value={values.status} onChange={(event) => update('status', event.target.value)}><option value="All">All statuses</option>{['Pending', 'Under Review', 'Approved', 'Rejected'].map((status) => <option key={status}>{status}</option>)}</select></label>
        <label className="field-group"><span>Sort by</span><select value={values.sort} onChange={(event) => update('sort', event.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="income-high">Income: High to Low</option><option value="income-low">Income: Low to High</option><option value="name-asc">Applicant: A-Z</option></select></label>
        <button type="button" className="text-button" onClick={onClear}><X size={14} /> Clear filters</button>
      </div>
    </section>
  );
}
