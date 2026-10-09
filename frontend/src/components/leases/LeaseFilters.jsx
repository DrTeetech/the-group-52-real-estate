import { Search, X } from 'lucide-react';

export default function LeaseFilters({ values, properties, onChange, onClear }) {
  function update(name, value) {
    onChange((current) => ({ ...current, [name]: value }));
  }

  return (
    <section className="rental-filter-panel" aria-label="Lease search and filters">
      <label className="property-search-field"><Search size={17} /><input type="search" aria-label="Search leases" placeholder="Search tenant, property, or lease ID" value={values.query} onChange={(event) => update('query', event.target.value)} /></label>
      <div className="rental-filter-controls">
        <label className="field-group"><span>Status</span><select value={values.status} onChange={(event) => update('status', event.target.value)}><option value="All">All statuses</option>{['Draft', 'Active', 'Expiring Soon', 'Expired', 'Terminated'].map((status) => <option key={status}>{status}</option>)}</select></label>
        <label className="field-group"><span>Property</span><select value={values.propertyId} onChange={(event) => update('propertyId', event.target.value)}><option value="All">All properties</option>{properties.map((property) => <option value={property.id} key={property.id}>{property.name}</option>)}</select></label>
        <label className="field-group"><span>Duration</span><select value={values.duration} onChange={(event) => update('duration', event.target.value)}><option value="All">Any duration</option><option value="short">Under 1 year</option><option value="one-two">1–2 years</option><option value="long">2+ years</option></select></label>
        <label className="field-group"><span>Sort by</span><select value={values.sort} onChange={(event) => update('sort', event.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="rent-low">Rent: Low to High</option><option value="rent-high">Rent: High to Low</option><option value="ending">Lease ending soonest</option></select></label>
        <button type="button" className="text-button" onClick={onClear}><X size={14} /> Clear filters</button>
      </div>
    </section>
  );
}
