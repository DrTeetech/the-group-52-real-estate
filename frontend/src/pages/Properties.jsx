import { useEffect, useState } from "react";
import { api } from "../services/api";
import PropertyCard from "../components/PropertyCard";

const initialFilters = {
  city: "",
  state: "",
  propertyType: "",
  minPrice: "",
  maxPrice: "",
  bedrooms: "",
  furnished: ""
};

export default function Properties() {
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState({ properties: [], pages: 0, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProperties(next = filters) {
    setLoading(true);
    setError("");
    try {
      const result = await api.getProperties({ ...next, page: 1, limit: 12 });
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProperties();
  }, []);

  function change(e) {
    setFilters((old) => ({ ...old, [e.target.name]: e.target.value }));
  }

  function submit(e) {
    e.preventDefault();
    loadProperties();
  }

  return (
    <main className="section">
      <div className="page-heading">
        <div>
          <span className="eyebrow">AVAILABLE HOMES</span>
          <h1>Find your next property</h1>
          <p className="muted">Only public and currently available properties are shown.</p>
        </div>
      </div>

      <form className="filters" onSubmit={submit}>
        <input name="city" placeholder="City" value={filters.city} onChange={change} />
        <input name="state" placeholder="State" value={filters.state} onChange={change} />
        <select name="propertyType" value={filters.propertyType} onChange={change}>
          <option value="">Property type</option>
          {["apartment","duplex","house","bungalow","terrace","penthouse","studio","land","commercial"].map(x =>
            <option key={x} value={x}>{x}</option>
          )}
        </select>
        <input name="minPrice" type="number" placeholder="Min rent" value={filters.minPrice} onChange={change} />
        <input name="maxPrice" type="number" placeholder="Max rent" value={filters.maxPrice} onChange={change} />
        <input name="bedrooms" type="number" min="0" placeholder="Min bedrooms" value={filters.bedrooms} onChange={change} />
        <select name="furnished" value={filters.furnished} onChange={change}>
          <option value="">Furnished?</option>
          <option value="true">Furnished</option>
          <option value="false">Unfurnished</option>
        </select>
        <button className="btn btn-primary" type="submit">Search</button>
      </form>

      {loading && <div className="page-center">Loading properties...</div>}
      {error && <div className="alert error">{error}</div>}

      {!loading && !error && data.properties?.length === 0 && (
        <div className="empty-state">
          <h3>No properties found</h3>
          <p>Try changing your search filters.</p>
        </div>
      )}

      <div className="property-grid">
        {data.properties?.map((property) => (
          <PropertyCard key={property._id} property={property} />
        ))}
      </div>
    </main>
  );
}
