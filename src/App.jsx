import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Properties from "./pages/Properties";
import PropertyDetails from "./pages/PropertyDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CustomerList from "./pages/CustomerList";
import StaffDashboard from "./pages/StaffDashboard";
import ApplicationsPage from "./pages/ApplicationsPage";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:slug" element={<PropertyDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/dashboard/favorites" element={<CustomerList type="favorites" />} />
          <Route path="/dashboard/viewings" element={<CustomerList type="viewings" />} />
          <Route path="/dashboard/inquiries" element={<CustomerList type="inquiries" />} />
          <Route path="/dashboard/leases" element={<CustomerList type="leases" />} />
          <Route path="/dashboard/payments" element={<CustomerList type="payments" />} />
        </Route>

        <Route element={<ProtectedRoute roles={["agent","property_manager","admin","super_admin"]} />}>
          <Route path="/staff" element={<StaffDashboard />} />
        </Route>

        <Route path="*" element={<main className="page-center"><h1>404</h1><p>Page not found.</p></main>} />
      </Routes>
      <footer className="footer">© Group 52 Estates · Real Estate Rental Platform</footer>
    </>
  );
}

export default App;
