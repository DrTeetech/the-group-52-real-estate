import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import LeasesPage from "./pages/LeasesPage.jsx";
import LeaseDetailsPage from "./pages/LeaseDetailsPage.jsx";
import PaymentsPage from "./pages/PaymentsPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/leases" replace />} />
          <Route path="/leases" element={<LeasesPage />} />
          <Route path="/leases/:leaseId" element={<LeaseDetailsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
