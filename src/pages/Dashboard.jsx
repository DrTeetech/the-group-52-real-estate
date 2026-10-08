import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const cards = [
  ["♥", "Favorites", "/dashboard/favorites"],
  ["▣", "Applications", "/dashboard/applications"],
  ["◷", "Viewings", "/dashboard/viewings"],
  ["?", "Inquiries", "/dashboard/inquiries"],
  ["⌂", "My Leases", "/dashboard/leases"],
  ["₦", "Payments", "/dashboard/payments"]
];

export default function Dashboard() {
  const { user } = useAuth();
  const staff = ["agent", "property_manager", "admin", "super_admin"].includes(user?.role);

  return (
    <main className="section">
      <div className="dashboard-hero">
        <div>
          <span className="eyebrow">CUSTOMER PORTAL</span>
          <h1>Welcome, {user?.firstName}.</h1>
          <p>Manage your property search and rental journey.</p>
        </div>
        <Link to="/properties" className="btn btn-primary">Find a Property</Link>
      </div>

      <div className="dashboard-grid">
        {cards.map(([icon, title, href]) => (
          <Link className="dashboard-card" to={href} key={href}>
            <span className="dashboard-icon">{icon}</span>
            <div><h3>{title}</h3><p>View and manage</p></div>
            <span>→</span>
          </Link>
        ))}
      </div>

      {staff && (
        <div className="panel staff-banner">
          <div>
            <span className="eyebrow">STAFF ACCESS</span>
            <h2>{user.role.replaceAll("_", " ")} portal</h2>
            <p>You have access to the management endpoints supported by your role.</p>
          </div>
          <Link className="btn btn-primary" to="/staff">Open Staff Dashboard</Link>
        </div>
      )}
    </main>
  );
}
