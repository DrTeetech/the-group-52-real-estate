import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roleNavigation } from '../data/mockData';
import { ROLE, roleDashboardPath } from '../data/roles';
import ModulePlaceholder from '../pages/ModulePlaceholder';
import TenantDashboard from '../pages/tenant/TenantDashboard';
import ManagerDashboard from '../pages/manager/ManagerDashboard';
import LandlordDashboard from '../pages/landlord/LandlordDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';
import MaintenancePage from '../pages/maintenance/MaintenancePage';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import ReportsPage from '../pages/reports/ReportsPage';
import ProfilePage from '../pages/profile/ProfilePage';
import SettingsPage from '../pages/settings/SettingsPage';

const roleBySlug = {
  admin: ROLE.ADMIN,
  manager: ROLE.PROPERTY_MANAGER,
  landlord: ROLE.LANDLORD,
  tenant: ROLE.TENANT,
};

const sectionLabels = {
  application: 'My Application',
  applications: 'Applications',
  documents: 'Documents',
  lease: 'My Lease',
  leases: 'Leases',
  maintenance: 'Maintenance',
  notifications: 'Notifications',
  payments: 'Payments',
  profile: 'Profile',
  properties: 'Properties',
  property: 'My Property',
  reports: 'Reports',
  settings: 'Settings',
  tenants: 'Tenants',
};

export default function RoleDashboardRouter() {
  const { role: roleSlug, section } = useParams();
  const { user } = useAuth();
  const role = roleBySlug[roleSlug];

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!role || user.role !== role) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (section) {
    if (section === 'maintenance') return <MaintenancePage />;
    if (section === 'notifications') return <NotificationsPage />;
    if (section === 'reports') return <ReportsPage />;
    if (section === 'profile') return <ProfilePage />;
    if (section === 'settings') return <SettingsPage />;
    const label = sectionLabels[section] || 'Workspace';
    return <ModulePlaceholder title={label} navItems={roleNavigation[role]} />;
  }

  switch (user.role) {
    case ROLE.TENANT:
      return <TenantDashboard />;
    case ROLE.PROPERTY_MANAGER:
      return <ManagerDashboard />;
    case ROLE.LANDLORD:
      return <LandlordDashboard />;
    case ROLE.ADMIN:
      return <AdminDashboard />;
    default:
      return <Navigate to={roleDashboardPath[user.role] || '/unauthorized'} replace />;
  }
}
