import { Search, SlidersHorizontal, X } from 'lucide-react';

const propertyTypes = ['Apartment', 'House', 'Duplex', 'Villa', 'Studio', 'Commercial'];

export default function PropertyFilters({ values, onChange, onClear }) {
  function update(name, value) {
    onChange((current) => ({ ...current, [name]: value }));
  }

  return (
    <section className="property-filter-panel" aria-label="Property search and filters">
      <div className="property-search-field">
        <Search size={17} />
        <input
          type="search"
          aria-label="Search properties"
          placeholder="Search by property, location, or type"
          value={values.query}
          onChange={(event) => update('query', event.target.value)}
        />
      </div>
      <div className="property-filter-grid">
        <label className="field-group"><span>Status</span>
          <select value={values.status} onChange={(event) => update('status', event.target.value)}>
            <option value="All">All statuses</option>
            {['Available', 'Occupied', 'Maintenance', 'Unlisted'].map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <label className="field-group"><span>Property type</span>
          <select value={values.type} onChange={(event) => update('type', event.target.value)}>
            <option value="All">All types</option>
            {propertyTypes.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label className="field-group"><span>Minimum rent</span>
          <input type="number" min="0" inputMode="numeric" placeholder="No minimum" value={values.minRent} onChange={(event) => update('minRent', event.target.value)} />
        </label>
        <label className="field-group"><span>Maximum rent</span>
          <input type="number" min="0" inputMode="numeric" placeholder="No maximum" value={values.maxRent} onChange={(event) => update('maxRent', event.target.value)} />
        </label>
        <label className="field-group"><span>Bedrooms</span>
          <select value={values.bedrooms} onChange={(event) => update('bedrooms', event.target.value)}>
            <option value="0">Any</option>
            {[1, 2, 3, 4].map((count) => <option key={count} value={count}>{count}+ bedrooms</option>)}
          </select>
        </label>
        <label className="field-group"><span>Sort by</span>
          <select value={values.sort} onChange={(event) => update('sort', event.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="rent-low">Rent: Low to High</option>
            <option value="rent-high">Rent: High to Low</option>
            <option value="name-asc">Name: A-Z</option>
            <option value="name-desc">Name: Z-A</option>
          </select>
        </label>
      </div>
      <div className="property-filter-footer">
        <span><SlidersHorizontal size={14} /> Filters apply as you choose them</span>
        <button type="button" className="text-button" onClick={onClear}><X size={14} /> Clear filters</button>
      </div>
    </section>
  );
}
