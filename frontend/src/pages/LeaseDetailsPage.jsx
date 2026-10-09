import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/Feedback.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { getMyLeaseById } from "../services/leaseService.js";
import { formatDate, formatMoney } from "../utils/formatters.js";

export default function LeaseDetailsPage() {
  const { leaseId } = useParams();
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLease = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setLease(await getMyLeaseById(leaseId));
    } catch (requestError) {
      setError(requestError.message || "Unable to retrieve lease details.");
    } finally {
      setLoading(false);
    }
  }, [leaseId]);

  useEffect(() => {
    loadLease();
  }, [loadLease]);

  return (
    <section>
      <Link className="back-link" to="/leases">
        <span aria-hidden="true">←</span> All leases
      </Link>
      {loading ? (
        <LoadingState label="Loading lease details..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadLease} />
      ) : !lease ? (
        <EmptyState
          title="Lease not found"
          message="This lease is not available in your account."
        />
      ) : (
        <LeaseDetail lease={lease} />
      )}
    </section>
  );
}

function LeaseDetail({ lease }) {
  const property = lease.property || {};
  const location = property.location || {};
  const place = [location.area, location.city, location.state, location.country]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <div className="detail-heading">
        <div>
          <p className="eyebrow">{lease.leaseNumber || "Lease details"}</p>
          <h1>{property.title || "Property details unavailable"}</h1>
          <p className="page-subtitle">{place || "Location not provided"}</p>
        </div>
        <StatusBadge status={lease.status} />
      </div>
      <div className="detail-panel">
        <h2>Agreement overview</h2>
        <dl className="detail-grid">
          <Detail label="Lease starts" value={formatDate(lease.startDate)} />
          <Detail label="Lease ends" value={formatDate(lease.endDate)} />
          <Detail
            label="Rent"
            value={`${formatMoney(lease.rentAmount, lease.currency)} / ${lease.rentPeriod || "period not provided"}`}
          />
          <Detail
            label="Service charge"
            value={formatMoney(lease.serviceCharge, lease.currency)}
          />
          <Detail
            label="Security deposit"
            value={formatMoney(lease.securityDeposit, lease.currency)}
          />
          <Detail label="Property code" value={property.propertyCode || "Not provided"} />
          <Detail label="Status" value={<StatusBadge status={lease.status} />} />
          <Detail
            label="Application status"
            value={lease.rentalApplication?.status || "Not provided"}
          />
        </dl>
      </div>
      {lease.document?.url && (
        <a
          className="button button-outline document-link"
          href={lease.document.url}
          target="_blank"
          rel="noreferrer"
        >
          View lease document
        </a>
      )}
    </>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detail-item">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
