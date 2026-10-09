const STATUS_LABELS = {
  active: "Active",
  pending: "Pending",
  expired: "Expired",
  terminated: "Terminated",
  cancelled: "Cancelled",
  successful: "Successful",
  failed: "Failed",
  refunded: "Refunded",
};

export default function StatusBadge({ status }) {
  const normalized = (status || "unknown").toLowerCase();
  return (
    <span className={`status-badge status-${normalized}`}>
      {STATUS_LABELS[normalized] || normalized.replaceAll("_", " ")}
    </span>
  );
}
