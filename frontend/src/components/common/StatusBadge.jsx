export default function StatusBadge({ status, type = 'neutral' }) {
  const statusClass = `status-badge status-${type || 'neutral'} status-${String(status || '').toLowerCase().replace(/\s+/g, '-')}`;

  return <span className={statusClass}>{status}</span>;
}
