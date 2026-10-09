import { ArrowRight, CalendarDays, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRentalData } from '../../context/ApplicationContext';
import { useLeases, getLeaseStatus } from '../../context/LeaseContext';
import { useProperties } from '../../context/PropertyContext';
import { usePayments } from '../../context/PaymentContext';
import { useMaintenance } from '../../context/MaintenanceContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import { roleNavigation } from '../../data/mockData';
import { ROLE } from '../../data/roles';

const formatCurrency = (value) => `₦${new Intl.NumberFormat('en-NG').format(value)}`;

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { applications, loading: rentalLoading, error: rentalError } = useRentalData();
  const { leases, loading: leasesLoading, error: leasesError } = useLeases();
  const { properties, loading: propertiesLoading, error: propertiesError } = useProperties();
  const { payments, loading: paymentsLoading, error: paymentsError } = usePayments();
  const { requests, loading: maintenanceLoading, error: maintenanceError } = useMaintenance();
  const navItems = roleNavigation[ROLE.PROPERTY_MANAGER];
  const dashboardError = rentalError || leasesError || propertiesError || paymentsError || maintenanceError;
  const activeLeases = leases.filter((lease) => getLeaseStatus(lease) === 'Active');
  const expiringSoonLeases = leases.filter((lease) => getLeaseStatus(lease) === 'Expiring Soon');
  const expiredLeases = leases.filter((lease) => getLeaseStatus(lease) === 'Expired');
  const activeTenantCount = new Set(activeLeases.map((lease) => lease.tenantId).filter(Boolean)).size;
  const upcomingExpirations = [...leases]
    .filter((lease) => ['Active', 'Expiring Soon'].includes(getLeaseStatus(lease)))
    .sort((left, right) => new Date(left.endDate) - new Date(right.endDate))
    .slice(0, 4);
  const occupiedProperties = properties.filter((property) => ['occupied', 'rented'].includes(String(property.status).toLowerCase()));
  const availableProperties = properties.filter((property) => String(property.status).toLowerCase() === 'available');
  const pendingApplications = applications.filter((application) => ['pending', 'under review'].includes(String(application.status).toLowerCase()));
  const pendingPayments = payments.filter((payment) => String(payment.status).toLowerCase() === 'pending');
  const pendingPaymentAmount = pendingPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const openRequests = requests.filter((request) => !['resolved', 'completed', 'closed', 'cancelled'].includes(String(request.status).toLowerCase()));

  return (
    <DashboardLayout user={user} title="Property manager dashboard" subtitle="Overview" navItems={navItems}>
      {dashboardError && <div className="form-message error-message" role="alert">{dashboardError}</div>}
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-card-label">Managed properties</span><h3>{propertiesLoading ? '…' : properties.length}</h3><small>Assigned portfolio</small></div>
        <div className="stat-card"><span className="stat-card-label">Occupied properties</span><h3>{propertiesLoading ? '…' : occupiedProperties.length}</h3><small>Currently occupied</small></div>
        <div className="stat-card"><span className="stat-card-label">Available properties</span><h3>{propertiesLoading ? '…' : availableProperties.length}</h3><small>Ready for applications</small></div>
        <div className="stat-card"><span className="stat-card-label">Tenants on active leases</span><h3>{leasesLoading ? '…' : activeTenantCount}</h3><small>From current lease records</small></div>
        <div className="stat-card"><span className="stat-card-label">Pending applications</span><h3>{rentalLoading ? '…' : pendingApplications.length}</h3><small>Awaiting review</small></div>
        <div className="stat-card"><span className="stat-card-label">Active leases</span><h3>{leasesLoading ? '…' : activeLeases.length}</h3><small>Currently in effect</small></div>
        <div className="stat-card"><span className="stat-card-label">Expiring soon</span><h3>{leasesLoading ? '…' : expiringSoonLeases.length}</h3><small>Approaching expiration</small></div>
        <div className="stat-card"><span className="stat-card-label">Expired leases</span><h3>{leasesLoading ? '…' : expiredLeases.length}</h3><small>Need attention</small></div>
      </div>

      <div className="panel-grid two-col">
        <div className="panel-card">
          <div className="panel-header">
            <div><p className="eyebrow">APPLICATIONS</p><h3>Recent applications</h3></div>
            <span className="muted-tag">{pendingApplications.length} pending</span>
          </div>
          <div className="mini-list">
            {applications.slice(0, 3).map((item) => (
              <div key={item.id}><span>{item.applicant} · {item.property}</span><strong>{item.status}</strong></div>
            ))}
            {!rentalLoading && applications.length === 0 && <p className="property-muted">No applications to review.</p>}
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <div><p className="eyebrow">FINANCIALS</p><h3>Pending payment records</h3></div>
            <span className="muted-tag">{paymentsLoading ? '…' : pendingPayments.length}</span>
          </div>
          <div className="mini-list">
            <div><span>Amount recorded as pending</span><strong>{paymentsLoading ? '…' : formatCurrency(pendingPaymentAmount)}</strong></div>
            <div><span>Open maintenance</span><strong>{maintenanceLoading ? '…' : openRequests.length}</strong></div>
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
          <div className="panel-header"><div><p className="eyebrow">MAINTENANCE</p><h3>Open requests</h3></div><Wrench size={17} /></div>
          <div className="mini-list">
            {requests.filter((request) => !['resolved', 'completed', 'closed', 'cancelled'].includes(String(request.status).toLowerCase())).slice(0, 3).map((request) => (
              <div key={request.id}><span>{request.title || request.issue} · {request.propertyName}</span><strong>{request.status}</strong></div>
            ))}
            {!maintenanceLoading && openRequests.length === 0 && <p className="property-muted">No open maintenance requests.</p>}
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <div><p className="eyebrow">RECENT PAYMENTS</p><h3>Latest transactions</h3></div>
          <Link className="text-link" to="/payments">View all <ArrowRight size={16} /></Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Property</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.slice(0, 5).map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.tenantName || 'Tenant'}</td>
                  <td>{payment.propertyName || 'Property'}</td>
                  <td>{formatCurrency(payment.amount)}</td>
                  <td><span className={`status-badge ${String(payment.status).toLowerCase() === 'successful' ? 'status-success' : String(payment.status).toLowerCase() === 'pending' ? 'status-warning' : 'status-danger'}`}>{payment.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!paymentsLoading && payments.length === 0 && <p className="property-muted">No payment records yet.</p>}
        </div>
      </div>
    </DashboardLayout>
  );
}
