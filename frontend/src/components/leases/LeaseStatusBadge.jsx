const statusClasses = {
  Draft: 'status-muted',
  Active: 'status-success',
  'Expiring Soon': 'status-warning',
  Expired: 'status-danger',
  Terminated: 'status-neutral',
};

export default function LeaseStatusBadge({ status }) {
  return <span className={`status-badge ${statusClasses[status] || 'status-muted'}`}>{status || 'Draft'}</span>;
}
