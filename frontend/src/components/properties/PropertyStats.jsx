const statuses = [
  ['Total properties', null],
  ['Available', 'Available'],
  ['Occupied', 'Occupied'],
  ['Maintenance', 'Maintenance'],
];

export default function PropertyStats({ properties }) {
  return (
    <div className="stats-grid property-stats-grid">
      {statuses.map(([label, status]) => (
        <div className="stat-card" key={label}>
          <span className="stat-card-label">{label}</span>
          <h3>{status ? properties.filter((property) => property.status === status).length : properties.length}</h3>
        </div>
      ))}
    </div>
  );
}
