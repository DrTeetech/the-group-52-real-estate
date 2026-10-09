import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { getPropertyImage } from "../utils/propertyImages";

export default function PropertyCard({ property }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const image = getPropertyImage(property);

  async function toggleFavorite() {
    if (!user) return;
    setBusy(true);
    try {
      if (saved) {
        await api.removeFavorite(property._id);
        setSaved(false);
      } else {
        await api.addFavorite(property._id);
        setSaved(true);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="property-card">
      <div className="property-image">
        <img src={image} alt={property.title} loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        {property.isFeatured && <span className="badge badge-featured">Featured</span>}
        {user && (
          <button
            className={`favorite-btn ${saved ? "saved" : ""}`}
            onClick={toggleFavorite}
            disabled={busy}
            title="Save property"
          >
            {saved ? "♥" : "♡"}
          </button>
        )}
      </div>

      <div className="property-body">
        <div className="property-type">{property.propertyType}</div>
        <h3>{property.title}</h3>
        <p className="muted">
          {property.location?.area}, {property.location?.city}
        </p>

        <div className="property-stats">
          <span>{property.bedrooms ?? 0} beds</span>
          <span>{property.bathrooms ?? 0} baths</span>
          <span>{property.furnished ? "Furnished" : "Unfurnished"}</span>
        </div>

        <div className="card-footer">
          <strong>
            {property.rent?.currency === "USD" ? "$" : "₦"}
            {Number(property.rent?.amount || 0).toLocaleString()}
            <small>/{property.rent?.period}</small>
          </strong>
          <Link className="btn btn-primary btn-small" to={`/properties/${property.slug}`}>
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
