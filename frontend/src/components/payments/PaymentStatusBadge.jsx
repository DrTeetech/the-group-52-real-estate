const statusClasses = {
  Successful: 'status-success',
  Pending: 'status-warning',
  Failed: 'status-danger',
  Overdue: 'status-neutral',
};

export default function PaymentStatusBadge({ status = 'Pending' }) {
  const className = statusClasses[status] || 'status-neutral';
  return <span className={`status-badge ${className}`}>{status}</span>;
}
