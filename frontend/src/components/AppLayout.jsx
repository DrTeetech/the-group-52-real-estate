import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  function handleSignOut() {
    signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/leases" aria-label="Homeground home">
          <span className="brand-mark" aria-hidden="true">
            H
          </span>
          <span>homeground</span>
        </NavLink>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink
            to="/leases"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            Leases
          </NavLink>
          <NavLink
            to="/payments"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            Payments
          </NavLink>
        </nav>
        <div className="account-actions">
          {name && <span className="account-name">{name}</span>}
          <button className="button button-quiet" onClick={handleSignOut}>
            Log out
          </button>
        </div>
      </header>
      <main className="page-container">
        <Outlet />
      </main>
      <footer className="footer">
        <span>Homeground tenant portal</span>
        <span>Manage your home, all in one place.</span>
      </footer>
    </div>
  );
}
