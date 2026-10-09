import { getLeaseStatus } from '../../context/LeaseContext';

const statuses = ['Active', 'Expiring Soon', 'Expired', 'Terminated'];

export default function LeaseStats({ leases }) {
  return (
    <div className="stats-grid rental-stats-grid">
      <div className="stat-card"><span className="stat-card-label">Total leases</span><h3>{leases.length}</h3></div>
      {statuses.map((status) => <div className="stat-card" key={status}><span className="stat-card-label">{status}</span><h3>{leases.filter((lease) => getLeaseStatus(lease) === status).length}</h3></div>)}
    </div>
  );
}
