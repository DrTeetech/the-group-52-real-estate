import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user?.role !== "customer") {
    return (
      <main className="access-denied">
        <p className="eyebrow">Tenant portal</p>
        <h1>Customer access required</h1>
        <p>
          Lease and payment history are available to authenticated customer
          accounts.
        </p>
      </main>
    );
  }

  return <Outlet />;
}
