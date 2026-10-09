const classes = {
  Pending: 'status-warning',
  'Under Review': 'status-neutral',
  Approved: 'status-success',
  Rejected: 'status-danger',
};

export default function ApplicationStatusBadge({ status }) {
  return <span className={`status-badge ${classes[status] || 'status-muted'}`}>{status || 'Pending'}</span>;
}
