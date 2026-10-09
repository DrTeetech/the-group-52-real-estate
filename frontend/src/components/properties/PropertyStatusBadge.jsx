const statusClasses = {
  Available: 'status-success',
  Occupied: 'status-neutral',
  Maintenance: 'status-warning',
  Unlisted: 'status-muted',
};

export default function PropertyStatusBadge({ status }) {
  return <span className={`status-badge ${statusClasses[status] || 'status-muted'}`}>{status || 'Unlisted'}</span>;
}
