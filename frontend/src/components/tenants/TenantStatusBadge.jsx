const classes = {
  Active: 'status-success',
  Pending: 'status-warning',
  Inactive: 'status-muted',
  'Not Started': 'status-neutral',
  'Expiring Soon': 'status-warning',
  Expired: 'status-danger',
  Paid: 'status-success',
  Overdue: 'status-danger',
};

export default function TenantStatusBadge({ status }) {
  return <span className={`status-badge ${classes[status] || 'status-neutral'}`}>{status || 'Pending'}</span>;
}
