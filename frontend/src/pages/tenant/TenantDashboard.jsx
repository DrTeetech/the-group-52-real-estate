import { ArrowRight, Calendar, CreditCard, Home, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { roleNavigation } from '../../data/mockData';
import { useRentalData } from '../../context/ApplicationContext';
import { useProperties } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLeases, getLeaseStatus } from '../../context/LeaseContext';
import { usePayments } from '../../context/PaymentContext';
import { useMaintenance } from '../../context/MaintenanceContext';
import { ROLE } from '../../data/roles';

const formatCurrency = (value) => `₦${new Intl.NumberFormat('en-NG').format(value)}`;
const formatDate = (value) => value
  ? new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
  : 'Not scheduled';

function paymentStatusClass(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'successful') return 'status-success';
  if (normalized === 'pending') return 'status-warning';
  if (normalized === 'failed' || normalized === 'refunded') return 'status-danger';
  return 'status-muted';
}

function displayPaymentStatus(status) {
  if (!status) return 'No payments';
  return String(status).charAt(0).toUpperCase() + String(status).slice(1);
}

const formatNotificationDate = (value) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short' }).format(date);
};

export default function TenantDashboard() {
  const { user } = useAuth();
  const { notifications, loading: notificationsLoading, error: notificationsError } = useNotifications();
  const { applications, loading: rentalLoading, error: rentalError } = useRentalData();
  const { properties, loading: propertiesLoading, error: propertiesError } = useProperties();
  const { leases, loading: leasesLoading, error: leasesError } = useLeases();
  const { payments, loading: paymentsLoading, error: paymentsError } = usePayments();
  const { requests, loading: maintenanceLoading, error: maintenanceError } = useMaintenance();
  const activeLease = user?.id
    ? leases.find((lease) => lease.tenantId === user.id && ['Active', 'Expiring Soon'].includes(getLeaseStatus(lease)))
    : null;
  const currentProperty = properties.find((property) => property.id === activeLease?.propertyId);
  const currentPropertyName = currentProperty?.name || 'No active lease';
  const monthlyRent = activeLease?.monthlyRent || 0;
  const currentTenantId = user?.id;
  const tenantPayments = payments.filter((payment) => payment.tenantId === currentTenantId);
  const tenantRequests = requests.filter((request) => request.tenantId === currentTenantId);
  const latestPayment = [...tenantPayments].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))[0];
  const pendingPayments = tenantPayments.filter((payment) => String(payment.status).toLowerCase() === 'pending');
  const openRequests = tenantRequests.filter((request) => !['resolved', 'completed', 'closed', 'cancelled'].includes(String(request.status).toLowerCase()));
  const latestApplication = applications
    .filter((application) => application.applicantEmail?.toLowerCase() === user.email.toLowerCase())
    .sort((left, right) => new Date(right.date) - new Date(left.date))[0];
  const navItems = roleNavigation[ROLE.TENANT];
  const leaseStatus = activeLease ? getLeaseStatus(activeLease) : 'No active lease';
  const nextPaymentDate = activeLease?.paymentDueDate;
  const dashboardError = rentalError || propertiesError || leasesError || paymentsError || maintenanceError || notificationsError;

  return (
    <DashboardLayout user={user} title="Tenant dashboard" subtitle="Overview" navItems={navItems}>
      {dashboardError && <div className="form-message error-message" role="alert">{dashboardError}</div>}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Current property</span>
          <h3>{propertiesLoading || leasesLoading ? 'Loading…' : activeLease ? currentPropertyName : 'No active lease'}</h3>
          <small>{activeLease ? (currentProperty?.location || 'Nigeria') : 'No active lease'}</small>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Monthly rent</span>
          <h3>{leasesLoading ? 'Loading…' : activeLease ? formatCurrency(monthlyRent) : '—'}</h3>
          <small>{activeLease ? 'Current rent' : 'No active lease'}</small>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Next payment</span>
          <h3>{activeLease && nextPaymentDate ? formatDate(nextPaymentDate) : '—'}</h3>
          <small>{activeLease ? `${formatCurrency(monthlyRent)} due` : 'No active lease'}</small>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Lease status</span>
          <h3>{leaseStatus}</h3>
          <small>{activeLease ? `Valid through ${activeLease.endDate}` : 'Lease details to follow'}</small>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Payment status</span>
          <h3>{paymentsLoading ? 'Loading…' : displayPaymentStatus(latestPayment?.status)}</h3>
          <small>{tenantPayments.length} recorded payment{tenantPayments.length === 1 ? '' : 's'}</small>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Pending payments</span>
          <h3>{paymentsLoading ? 'Loading…' : pendingPayments.length}</h3>
          <small>Awaiting provider verification</small>
        </div>
      </div>

      <div className="panel-card current-property-card">
          {activeLease && currentProperty ? <img src={currentProperty.images?.[0] || currentProperty.image} alt={currentPropertyName} /> : <div className="property-empty-spotlight"><p>{leasesLoading ? 'Loading lease details…' : 'No active lease'}</p></div>}
        <div>
          <p className="eyebrow">CURRENT PROPERTY</p>
          <h2>{activeLease ? currentPropertyName : 'No active lease'}</h2>
          <p>{activeLease ? (currentProperty?.address || currentProperty?.location || 'Property details') : 'This tenant does not currently have an active lease.'}</p>
          <span className={`status-badge ${leaseStatus === 'No active lease' ? 'status-muted' : leaseStatus === 'Expiring Soon' ? 'status-warning' : 'status-success'}`}>{leaseStatus}</span>
          {activeLease && currentProperty && <Link className="text-link" to={`/properties/${currentProperty.id}`}>View property <ArrowRight size={15} /></Link>}
          {activeLease && <Link className="primary-button small-button" to={`/leases/${activeLease.id}`}>View Lease</Link>}
        </div>
      </div>

      <div className="panel-grid two-col">
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">PAYMENT OVERVIEW</p>
              <h3>Payment activity</h3>
            </div>
            <span className="muted-tag">{paymentsLoading ? 'Loading…' : `${pendingPayments.length} pending`}</span>
          </div>
          <div className="amount-showcase">{paymentsLoading ? 'Loading…' : `${tenantPayments.length} record${tenantPayments.length === 1 ? '' : 's'}`}</div>
          <div className="mini-list">
            <div><span>Latest record</span><strong>{latestPayment ? formatCurrency(latestPayment.amount) : 'No payments yet'}</strong></div>
            <div><span>Next rent due</span><strong>{activeLease ? formatDate(nextPaymentDate) : 'No active lease'}</strong></div>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">MAINTENANCE</p>
              <h3>Active requests</h3>
            </div>
            <span className="muted-tag">{maintenanceLoading ? 'Loading…' : `${openRequests.length} open`}</span>
          </div>
          <div className="activity-list compact-list">
            {tenantRequests.slice(0, 3).map((request) => (
              <div key={request.id} className="activity-row">
                <div className="activity-icon orange"><Wrench size={14} /></div>
                <div>
                  <strong>{request.title || request.issue}</strong>
                  <small>{request.priority} · {request.status}</small>
                </div>
              </div>
            ))}
            {!maintenanceLoading && tenantRequests.length === 0 && <p className="property-muted">No maintenance requests yet.</p>}
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <div>
            <p className="eyebrow">RECENT ACTIVITY</p>
            <h3>Payment history</h3>
          </div>
          <Link className="text-link" to="/dashboard/tenant/payments">View all <ArrowRight size={16} /></Link>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Payment</th>
                <th>Property</th>
                <th>Date</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tenantPayments.slice(0, 4).map((payment) => (
                <tr key={payment.id}>
                  <td>{formatCurrency(payment.amount)}</td>
                  <td>{payment.propertyName || '—'}</td>
                  <td>{formatDate(payment.paidDate || payment.createdAt)}</td>
                  <td>{payment.paymentMethod || '—'}</td>
                  <td><span className={`status-badge ${paymentStatusClass(payment.status)}`}>{displayPaymentStatus(payment.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!paymentsLoading && tenantPayments.length === 0 && <p className="property-muted">No payment records yet.</p>}
        </div>
      </div>

      <div className="panel-grid two-col">
        <div className="panel-card">
          <div className="panel-header">
            <div><p className="eyebrow">APPLICATION</p><h3>My application</h3></div>
            <span className={`status-badge ${latestApplication?.status === 'Approved' ? 'status-success' : latestApplication?.status === 'Rejected' ? 'status-danger' : latestApplication ? 'status-warning' : 'status-muted'}`}>{rentalLoading ? 'Loading…' : latestApplication?.status || 'No applications'}</span>
          </div>
          <p className="workspace-intro">{latestApplication ? `Your application for ${latestApplication.property} was last updated ${latestApplication.lastUpdated || latestApplication.date}.` : 'Your submitted applications and updates will appear here.'}</p>
          <Link className="text-link" to="/my-applications">View my applications <ArrowRight size={15} /></Link>
        </div>
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">LEASE SUMMARY</p>
              <h3>Rental details</h3>
            </div>
            <Home size={16} />
          </div>
          {activeLease ? (
            <div className="mini-list">
              <div><span>Property</span><strong>{currentPropertyName}</strong></div>
              <div><span>Rent</span><strong>{formatCurrency(monthlyRent)}</strong></div>
              <div><span>Lease period</span><strong>{activeLease.startDate && activeLease.endDate ? `${activeLease.startDate} - ${activeLease.endDate}` : 'Not started'}</strong></div>
              <div><span>Lease status</span><strong>{getLeaseStatus(activeLease)}</strong></div>
              <div><span>Security deposit</span><strong>{formatCurrency(activeLease.securityDeposit || currentProperty?.securityDeposit || 0)}</strong></div>
            </div>
          ) : (
            <p className="property-muted">No active lease.</p>
          )}
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">UPCOMING</p>
              <h3>Reminders</h3>
            </div>
            <Calendar size={16} />
          </div>
          <div className="activity-list compact-list">
            {activeLease?.paymentDueDate && <div className="activity-row"><div className="activity-icon green"><CreditCard size={14} /></div><div><strong>Rent due</strong><small>{formatDate(activeLease.paymentDueDate)}</small></div></div>}
            {activeLease?.endDate && <div className="activity-row"><div className="activity-icon blue"><Home size={14} /></div><div><strong>Lease ends</strong><small>{formatDate(activeLease.endDate)}</small></div></div>}
            {!activeLease?.paymentDueDate && !activeLease?.endDate && <p className="property-muted">No upcoming lease dates available.</p>}
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <div>
            <p className="eyebrow">NOTIFICATIONS</p>
            <h3>Recent updates</h3>
          </div>
        </div>
        <div className="notifications-list compact-list">
          {notificationsLoading ? <p>Loading notifications…</p> : notifications.slice(0, 3).map((item) => (
            <div key={item.id} className="notification-row">
              <span className={`notice-dot notice-${item.type}`}></span>
              <div>
                <strong>{item.title}</strong>
                <small>{item.message}</small>
              </div>
              <span className="notification-time">{formatNotificationDate(item.createdAt)}</span>
            </div>
          ))}
          {!notificationsLoading && notifications.length === 0 && <p>No recent notifications.</p>}
        </div>
      </div>
    </DashboardLayout>
  );
}
