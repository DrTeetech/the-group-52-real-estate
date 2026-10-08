import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-mark">G52</span>
        <span>Group 52 Estates</span>
      </Link>

      <nav>
        <NavLink to="/properties">Properties</NavLink>
        {user && <NavLink to="/dashboard">Dashboard</NavLink>}
      </nav>

      <div className="nav-actions">
        {user ? (
          <>
            <span className="welcome">Hi, {user.firstName}</span>
            <button className="btn btn-outline" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link className="btn btn-outline" to="/login">Login</Link>
            <Link className="btn btn-primary" to="/register">Get Started</Link>
          </>
        )}
      </div>
    </header>
  );
}
