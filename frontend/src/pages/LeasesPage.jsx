import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/Feedback.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { getMyLeases } from "../services/leaseService.js";
import { formatDate, formatMoney } from "../utils/formatters.js";

export default function LeasesPage() {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLeases = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setLeases(await getMyLeases());
    } catch (requestError) {
      setError(requestError.message || "Unable to retrieve your leases.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeases();
  }, [loadLeases]);

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Your tenancy</p>
          <h1>Leases</h1>
          <p className="page-subtitle">
            The key dates and details for your rental agreements.
          </p>
        </div>
        <span className="heading-count">
          {leases.length} {leases.length === 1 ? "lease" : "leases"}
        </span>
      </div>

      {loading ? (
        <LoadingState label="Loading your leases..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadLeases} />
      ) : leases.length === 0 ? (
        <EmptyState
          title="No leases to show yet"
          message="When a lease is created for your account, it will appear here."
        />
      ) : (
        <div className="lease-grid">
          {leases.map((lease) => (
            <LeaseCard key={lease._id} lease={lease} />
          ))}
        </div>
      )}
    </section>
  );
}

function LeaseCard({ lease }) {
  const property = lease.property || {};
  const location = property.location || {};
  const place = [location.area, location.city, location.state]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="lease-card">
      <div className="lease-card-top">
        <span className="property-kicker">
          {property.propertyCode || lease.leaseNumber || "Rental agreement"}
        </span>
        <StatusBadge status={lease.status} />
      </div>
      <h2>{property.title || "Property details unavailable"}</h2>
      <p className="property-location">{place || "Location not provided"}</p>
      <div className="lease-summary">
        <div>
          <span className="detail-label">Lease period</span>
          <strong>
            {formatDate(lease.startDate)} <span aria-hidden="true">—</span>{" "}
            {formatDate(lease.endDate)}
          </strong>
        </div>
        <div>
          <span className="detail-label">Rent</span>
          <strong>
            {formatMoney(lease.rentAmount, lease.currency)}
            <small> / {lease.rentPeriod || "period not provided"}</small>
          </strong>
        </div>
      </div>
      <Link className="card-link" to={`/leases/${lease._id}`}>
        View lease details <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
