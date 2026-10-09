import { ArrowRight, CalendarDays, ShieldCheck, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRentalData } from '../../context/ApplicationContext';
import { useProperties } from '../../context/PropertyContext';
import { useLeases, getLeaseStatus } from '../../context/LeaseContext';
import { usePayments } from '../../context/PaymentContext';
import { useMaintenance } from '../../context/MaintenanceContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import { roleNavigation } from '../../data/mockData';
import { ROLE } from '../../data/roles';

const formatCurrency = (value) => `₦${new Intl.NumberFormat('en-NG').format(value)}`;

export default function AdminDashboard() {
  const { user } = useAuth();
  const { applications, loading: rentalLoading, error: rentalError } = useRentalData();
  const { properties, loading: propertiesLoading, error: propertiesError } = useProperties();
  const { leases, loading: leasesLoading, error: leasesError } = useLeases();
  const { payments, loading: paymentsLoading, error: paymentsError } = usePayments();
  const { requests, loading: maintenanceLoading, error: maintenanceError } = useMaintenance();
  const navItems = roleNavigation[ROLE.ADMIN];
  const activeLeases = leases.filter((lease) => getLeaseStatus(lease) === 'Active');
  const activeTenantCount = new Set(activeLeases.map((lease) => lease.tenantId).filter(Boolean)).size;
  const expiringSoonLeases = leases.filter((lease) => getLeaseStatus(lease) === 'Expiring Soon');
  const expiredLeases = leases.filter((lease) => getLeaseStatus(lease) === 'Expired');
  const upcomingExpirations = [...leases]
    .filter((lease) => ['Active', 'Expiring Soon'].includes(getLeaseStatus(lease)))
    .sort((left, right) => new Date(left.endDate) - new Date(right.endDate))
    .slice(0, 4);
  const pendingApplications = applications.filter((application) => ['pending', 'under review'].includes(String(application.status).toLowerCase()));
  const pendingPayments = payments.filter((payment) => String(payment.status).toLowerCase() === 'pending');
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = payments
    .filter((payment) => {
      if (String(payment.status).toLowerCase() !== 'successful') return false;
      const date = new Date(payment.paidDate || payment.createdAt);
      return !Number.isNaN(date.getTime()) && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const occupiedProperties = properties.filter((property) => ['occupied', 'rented'].includes(String(property.status).toLowerCase()));
  const openRequests = requests.filter((request) => !['resolved', 'completed', 'closed', 'cancelled'].includes(String(request.status).toLowerCase()));
  const dashboardError = rentalError || propertiesError || leasesError || paymentsError || maintenanceError;

  return (
    <DashboardLayout user={user} title="Admin dashboard" subtitle="Overview" navItems={navItems}>
      {dashboardError && <div className="form-message error-message" role="alert">{dashboardError}</div>}
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-card-label">Properties</span><h3>{propertiesLoading ? '…' : properties.length}</h3><small>Portfolio records</small></div>
        <div className="stat-card"><span className="stat-card-label">Tenants on active leases</span><h3>{leasesLoading ? '…' : activeTenantCount}</h3><small>From current lease records</small></div>
        <div className="stat-card"><span className="stat-card-label">Applications</span><h3>{rentalLoading ? '…' : applications.length}</h3><small>{pendingApplications.length} pending review</small></div>
        <div className="stat-card"><span className="stat-card-label">Active leases</span><h3>{leasesLoading ? '…' : activeLeases.length}</h3><small>Currently in effect</small></div>
        <div className="stat-card"><span className="stat-card-label">Expiring soon</span><h3>{leasesLoading ? '…' : expiringSoonLeases.length}</h3><small>Approaching expiration</small></div>
        <div className="stat-card"><span className="stat-card-label">Expired leases</span><h3>{leasesLoading ? '…' : expiredLeases.length}</h3><small>Need action</small></div>
        <div className="stat-card"><span className="stat-card-label">Pending payment records</span><h3>{paymentsLoading ? '…' : pendingPayments.length}</h3><small>Awaiting provider verification</small></div>
        <div className="stat-card"><span className="stat-card-label">Successful payments this month</span><h3>{paymentsLoading ? '…' : formatCurrency(monthlyRevenue)}</h3><small>From verified payment records</small></div>
      </div>

      <div className="panel-grid two-col">
        <div className="panel-card">
          <div className="panel-header">
            <div><p className="eyebrow">SYSTEM HEALTH</p><h3>Finance overview</h3></div>
            <TrendingUp size={16} />
          </div>
          <div className="mini-list">
            <div><span>Successful payments this month</span><strong>{paymentsLoading ? '…' : formatCurrency(monthlyRevenue)}</strong></div>
            <div><span>Pending payment records</span><strong>{paymentsLoading ? '…' : pendingPayments.length}</strong></div>
            <div><span>Pending applications</span><strong>{rentalLoading ? '…' : pendingApplications.length}</strong></div>
            <div><span>Open maintenance</span><strong>{maintenanceLoading ? '…' : openRequests.length}</strong></div>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <div><p className="eyebrow">OPERATIONS</p><h3>Portfolio status</h3></div>
            <ShieldCheck size={16} />
          </div>
          <div className="mini-list">
            <div><span>Occupied properties</span><strong>{propertiesLoading ? '…' : occupiedProperties.length}</strong></div>
            <div><span>Available properties</span><strong>{propertiesLoading ? '…' : properties.filter((property) => String(property.status).toLowerCase() === 'available').length}</strong></div>
            <div><span>Open maintenance requests</span><strong>{maintenanceLoading ? '…' : openRequests.length}</strong></div>
          </div>
        </div>
      </div>

      <div className="panel-grid two-col">
        <div className="panel-card">
          <div className="panel-header"><div><p className="eyebrow">LEASES</p><h3>Upcoming Lease Expirations</h3></div><CalendarDays size={17} /></div>
          <div className="mini-list">
            {upcomingExpirations.length ? upcomingExpirations.map((lease) => (
              <div key={lease.id}><span>{lease.id} · {lease.endDate}</span><strong>{getLeaseStatus(lease)}</strong></div>
            )) : <p className="property-muted">No upcoming lease expirations.</p>}
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <div><p className="eyebrow">APPLICATIONS</p><h3>Latest submissions</h3></div>
            <Link className="text-link" to="/applications">View all <ArrowRight size={16} /></Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Property</th>
                  <th>Income</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 5).map((item) => (
                  <tr key={item.id}>
                    <td>{item.applicant}</td>
                    <td>{item.property}</td>
                    <td>{formatCurrency(item.income)}</td>
                    <td><span className={`status-badge ${item.status === 'Pending' ? 'status-warning' : item.status === 'Approved' ? 'status-success' : 'status-danger'}`}>{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rentalLoading && applications.length === 0 && <p className="property-muted">No applications have been submitted.</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
