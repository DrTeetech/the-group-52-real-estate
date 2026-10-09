import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RoleDashboardRouter from './routes/RoleDashboardRouter.jsx';
import ModulePlaceholder from './pages/ModulePlaceholder.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { ROLE, roleDashboardPath } from './data/roles.js';
import { PropertyProvider } from './context/PropertyContext.jsx';
import { ApplicationProvider } from './context/ApplicationContext.jsx';
import { LeaseProvider } from './context/LeaseContext.jsx';
import { PaymentProvider } from './context/PaymentContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { MaintenanceProvider } from './context/MaintenanceContext.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';
import UnauthorizedPage from './pages/auth/UnauthorizedPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import TenantDashboard from './pages/tenant/TenantDashboard.jsx';
import ManagerDashboard from './pages/manager/ManagerDashboard.jsx';
import LandlordDashboard from './pages/landlord/LandlordDashboard.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import PropertiesPage from './pages/properties/PropertiesPage.jsx';
import PropertyDetailPage from './pages/properties/PropertyDetailPage.jsx';
import PropertyFormPage from './pages/properties/PropertyFormPage.jsx';
import ApplicationsPage from './pages/applications/ApplicationsPage.jsx';
import ApplicationFormPage from './pages/applications/ApplicationFormPage.jsx';
import ApplicationDetailPage from './pages/applications/ApplicationDetailPage.jsx';
import MyApplicationsPage from './pages/applications/MyApplicationsPage.jsx';
import TenantsPage from './pages/tenants/TenantsPage.jsx';
import TenantDetailPage from './pages/tenants/TenantDetailPage.jsx';
import LeasesPage from './pages/leases/LeasesPage.jsx';
import LeaseDetailPage from './pages/leases/LeaseDetailPage.jsx';
import LeaseFormPage from './pages/leases/LeaseFormPage.jsx';
import PaymentsPage from './pages/payments/PaymentsPage.jsx';
import PaymentDetailPage from './pages/payments/PaymentDetailPage.jsx';
import MaintenancePage from './pages/maintenance/MaintenancePage.jsx';
import MaintenanceFormPage from './pages/maintenance/MaintenanceFormPage.jsx';
import MaintenanceDetailPage from './pages/maintenance/MaintenanceDetailPage.jsx';
import NotificationsPage from './pages/notifications/NotificationsPage.jsx';
import ReportsPage from './pages/reports/ReportsPage.jsx';
import ProfilePage from './pages/profile/ProfilePage.jsx';
import SettingsPage from './pages/settings/SettingsPage.jsx';

const staffRoles = [ROLE.ADMIN, ROLE.PROPERTY_MANAGER];
const applicationManagementRoles = [...staffRoles, ROLE.LANDLORD];
const propertyManagementRoles = [...staffRoles, ROLE.LANDLORD];
const propertyRoles = [...propertyManagementRoles, ROLE.TENANT];
const maintenanceRoles = [...staffRoles, ROLE.LANDLORD, ROLE.TENANT];
const notificationRoles = [...staffRoles, ROLE.LANDLORD, ROLE.TENANT];

function DashboardRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={roleDashboardPath[user.role] || '/unauthorized'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <PropertyProvider>
      <ApplicationProvider>
      <LeaseProvider>
      <PaymentProvider>
      <NotificationProvider>
      <MaintenanceProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={[ROLE.ADMIN]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/manager" element={<ProtectedRoute allowedRoles={[ROLE.PROPERTY_MANAGER]}><ManagerDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/landlord" element={<ProtectedRoute allowedRoles={[ROLE.LANDLORD]}><LandlordDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/tenant" element={<ProtectedRoute allowedRoles={[ROLE.TENANT]}><TenantDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/admin/payments" element={<ProtectedRoute allowedRoles={[ROLE.ADMIN]}><PaymentsPage /></ProtectedRoute>} />
        <Route path="/dashboard/manager/payments" element={<ProtectedRoute allowedRoles={[ROLE.PROPERTY_MANAGER]}><PaymentsPage /></ProtectedRoute>} />
        <Route path="/dashboard/tenant/payments" element={<ProtectedRoute allowedRoles={[ROLE.TENANT]}><PaymentsPage /></ProtectedRoute>} />
        <Route path="/dashboard/:role/:section" element={<RoleDashboardRouter />} />

        <Route path="/properties" element={<ProtectedRoute allowedRoles={propertyRoles}><PropertiesPage /></ProtectedRoute>} />
        <Route path="/properties/new" element={<ProtectedRoute allowedRoles={propertyManagementRoles}><PropertyFormPage /></ProtectedRoute>} />
        <Route path="/properties/:id/edit" element={<ProtectedRoute allowedRoles={propertyManagementRoles}><PropertyFormPage /></ProtectedRoute>} />
        <Route path="/properties/:id" element={<ProtectedRoute allowedRoles={propertyRoles}><PropertyDetailPage /></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute allowedRoles={applicationManagementRoles}><ApplicationsPage /></ProtectedRoute>} />
        <Route path="/applications/new" element={<ProtectedRoute allowedRoles={[ROLE.TENANT]}><ApplicationFormPage /></ProtectedRoute>} />
        <Route path="/applications/:id" element={<ProtectedRoute allowedRoles={applicationManagementRoles}><ApplicationDetailPage /></ProtectedRoute>} />
        <Route path="/my-applications" element={<ProtectedRoute allowedRoles={[ROLE.TENANT]}><MyApplicationsPage /></ProtectedRoute>} />
        <Route path="/my-applications/:id" element={<ProtectedRoute allowedRoles={[ROLE.TENANT]}><ApplicationDetailPage tenantView /></ProtectedRoute>} />
        <Route path="/tenants" element={<ProtectedRoute allowedRoles={staffRoles}><TenantsPage /></ProtectedRoute>} />
        <Route path="/tenants/:id" element={<ProtectedRoute allowedRoles={staffRoles}><TenantDetailPage /></ProtectedRoute>} />
        <Route path="/leases" element={<ProtectedRoute allowedRoles={[...staffRoles, ROLE.TENANT]}><LeasesPage /></ProtectedRoute>} />
        <Route path="/leases/new" element={<ProtectedRoute allowedRoles={staffRoles}><LeaseFormPage /></ProtectedRoute>} />
        <Route path="/leases/:id/edit" element={<ProtectedRoute allowedRoles={staffRoles}><LeaseFormPage /></ProtectedRoute>} />
        <Route path="/leases/:id" element={<ProtectedRoute allowedRoles={[...staffRoles, ROLE.TENANT]}><LeaseDetailPage /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute allowedRoles={[...staffRoles, ROLE.TENANT]}><PaymentsPage /></ProtectedRoute>} />
        <Route path="/payments/:id" element={<ProtectedRoute allowedRoles={[...staffRoles, ROLE.TENANT]}><PaymentDetailPage /></ProtectedRoute>} />
        <Route path="/maintenance" element={<ProtectedRoute allowedRoles={maintenanceRoles}><MaintenancePage /></ProtectedRoute>} />
        <Route path="/maintenance/new" element={<ProtectedRoute allowedRoles={maintenanceRoles}><MaintenanceFormPage /></ProtectedRoute>} />
        <Route path="/maintenance/:id" element={<ProtectedRoute allowedRoles={maintenanceRoles}><MaintenanceDetailPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute allowedRoles={staffRoles}><ReportsPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute allowedRoles={notificationRoles}><NotificationsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={staffRoles.concat(ROLE.TENANT)}><ProfilePage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedRoles={staffRoles.concat(ROLE.TENANT)}><SettingsPage /></ProtectedRoute>} />

        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </MaintenanceProvider>
      </NotificationProvider>
      </PaymentProvider>
      </LeaseProvider>
      </ApplicationProvider>
      </PropertyProvider>
    </AuthProvider>
  );
}

