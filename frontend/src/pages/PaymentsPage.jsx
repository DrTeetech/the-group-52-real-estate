import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "../components/Feedback.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { getMyPayments } from "../services/paymentService.js";
import { formatDate, formatLabel, formatMoney } from "../utils/formatters.js";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPayments(await getMyPayments());
    } catch (requestError) {
      setError(requestError.message || "Unable to retrieve your payments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Your records</p>
          <h1>Payments</h1>
          <p className="page-subtitle">
            Review payment records associated with your account.
          </p>
        </div>
        <span className="heading-count">
          {payments.length} {payments.length === 1 ? "record" : "records"}
        </span>
      </div>

      {loading ? (
        <LoadingState label="Loading your payment history..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadPayments} />
      ) : payments.length === 0 ? (
        <EmptyState
          title="No payment records yet"
          message="Payments recorded for your account will be listed here."
        />
      ) : (
        <div className="payment-list">
          {payments.map((payment) => (
            <PaymentCard key={payment._id} payment={payment} />
          ))}
        </div>
      )}
      <p className="payment-disclaimer">
        Payment statuses are provided by the server. This page does not initiate
        payments or calculate rent due.
      </p>
    </section>
  );
}

function PaymentCard({ payment }) {
  const property = payment.property || {};
  const lease = payment.lease || {};
  const paymentDate = payment.paidAt || payment.createdAt;

  return (
    <article className="payment-card">
      <div className="payment-main">
        <div className="payment-amount">
          <strong>{formatMoney(payment.amount, payment.currency)}</strong>
          <span>{formatLabel(payment.type)}</span>
        </div>
        <StatusBadge status={payment.status} />
      </div>
      <dl className="payment-meta">
        <PaymentField label="Reference" value={payment.reference} />
        <PaymentField label="Date" value={formatDate(paymentDate)} />
        <PaymentField label="Method" value={formatLabel(payment.provider)} />
        <PaymentField
          label="Property"
          value={property.title || property.propertyCode || "Not provided"}
        />
        <PaymentField label="Lease" value={lease.leaseNumber || "Not provided"} />
      </dl>
    </article>
  );
}

function PaymentField({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "Not provided"}</dd>
    </div>
  );
}
