const statuses = ['Pending', 'Under Review', 'Approved', 'Rejected'];

export default function ApplicationStats({ applications }) {
  return (
    <div className="stats-grid rental-stats-grid">
      <div className="stat-card"><span className="stat-card-label">Total applications</span><h3>{applications.length}</h3></div>
      {statuses.map((status) => (
        <div className="stat-card" key={status}><span className="stat-card-label">{status}</span><h3>{applications.filter((item) => item.status === status).length}</h3></div>
      ))}
    </div>
  );
}
