export default function TenantStats({ tenants, properties }) {
  const stats = [
    ['Total tenants', tenants.length],
    ['Active tenants', tenants.filter((tenant) => tenant.status === 'Active').length],
    ['Pending tenants', tenants.filter((tenant) => tenant.status === 'Pending').length],
    ['Vacant properties', properties.filter((property) => property.status === 'Available').length],
  ];

  return <div className="stats-grid rental-stats-grid">{stats.map(([label, value]) => <div className="stat-card" key={label}><span className="stat-card-label">{label}</span><h3>{value}</h3></div>)}</div>;
}
