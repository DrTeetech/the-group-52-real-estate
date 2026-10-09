import { ArrowRight, Building2, DollarSign, FileText, HandCoins, Home, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProperties } from '../../context/PropertyContext';
import { useRentalData } from '../../context/ApplicationContext';
import { useLeases, getLeaseStatus } from '../../context/LeaseContext';
import { usePayments } from '../../context/PaymentContext';
import { useMaintenance } from '../../context/MaintenanceContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import { roleNavigation } from '../../data/mockData';
import { ROLE } from '../../data/roles';

const formatCurrency = (value) => `₦${new Intl.NumberFormat('en-NG').format(value)}`;

export default function LandlordDashboard() {
  const { user } = useAuth();
  const { properties, loading: propertiesLoading, error: propertiesError } = useProperties();
  const { error: rentalError } = useRentalData();
  const { leases, loading: leasesLoading, error: leasesError } = useLeases();
  const { payments, loading: paymentsLoading, error: paymentsError } = usePayments();
  const { requests, loading: maintenanceLoading, error: maintenanceError } = useMaintenance();
  const navItems = roleNavigation[ROLE.LANDLORD];
  const activeLeases = leases.filter((lease) => ['Active', 'Expiring Soon'].includes(getLeaseStatus(lease)));
  const pendingPayments = payments.filter((payment) => String(payment.status).toLowerCase() === 'pending');
  const pendingPaymentAmount = pendingPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const openRequests = requests.filter((request) => !['resolved', 'completed', 'closed', 'cancelled'].includes(String(request.status).toLowerCase()));
  const monthlyRent = activeLeases.reduce((sum, lease) => sum + Number(lease.monthlyRent || 0), 0);
  const dashboardError = propertiesError || rentalError || leasesError || paymentsError || maintenanceError;

  return (
    <DashboardLayout user={user} title="Landlord dashboard" subtitle="Overview" navItems={navItems}>
      {dashboardError && <div className="form-message error-message" role="alert">{dashboardError}</div>}
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-card-label">Owned properties</span><h3>{propertiesLoading ? '…' : properties.length}</h3><small>Visible to your account</small></div>
        <div className="stat-card"><span className="stat-card-label">Active leases</span><h3>{leasesLoading ? '…' : activeLeases.length}</h3><small>Currently in effect</small></div>
        <div className="stat-card"><span className="stat-card-label">Monthly rent in active leases</span><h3>{leasesLoading ? '…' : formatCurrency(monthlyRent)}</h3><small>Based on current lease records</small></div>
        <div className="stat-card"><span className="stat-card-label">Pending payment records</span><h3>{paymentsLoading ? '…' : pendingPayments.length}</h3><small>Awaiting verification</small></div>
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <div><p className="eyebrow">PROPERTY PORTFOLIO</p><h3>My properties</h3></div>
          <Link className="text-link" to="/properties">Manage all <ArrowRight size={16} /></Link>
        </div>
        <div className="property-card-list">
              {properties.map((property) => (
            <div key={property.id} className="list-property-item">
              <img src={property.image || property.images?.[0]} alt={property.name || property.title || 'Property'} />
              <div>
                <strong>{property.name || property.title}</strong>
                <small>{property.location}</small>
              </div>
              <div className="property-mini-metric">
                <span>{property.units} units</span>
                <strong>{formatCurrency(property.monthlyRent)}</strong>
              </div>
            </div>
          ))}
          {!propertiesLoading && properties.length === 0 && <p className="property-muted">No owned properties were returned.</p>}
        </div>
      </div>

      <div className="panel-grid two-col">
        <div className="panel-card">
          <div className="panel-header">
            <div><p className="eyebrow">FINANCIAL SUMMARY</p><h3>Cashflow</h3></div>
            <HandCoins size={16} />
          </div>
          <div className="mini-list">
            <div><span>Active lease rent total</span><strong>{leasesLoading ? '…' : formatCurrency(monthlyRent)}</strong></div>
            <div><span>Pending amount recorded</span><strong>{paymentsLoading ? '…' : formatCurrency(pendingPaymentAmount)}</strong></div>
            <div><span>Payment records</span><strong>{paymentsLoading ? '…' : payments.length}</strong></div>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <div><p className="eyebrow">OPERATIONS</p><h3>Maintenance</h3></div>
            <FileText size={16} />
          </div>
          <div className="mini-list">
            <div><span>Open requests</span><strong>{maintenanceLoading ? '…' : openRequests.length}</strong></div>
            <div><span>In progress</span><strong>{maintenanceLoading ? '…' : requests.filter((request) => String(request.status).toLowerCase() === 'in progress').length}</strong></div>
            <div><span>Resolved</span><strong>{maintenanceLoading ? '…' : requests.filter((request) => ['resolved', 'completed'].includes(String(request.status).toLowerCase())).length}</strong></div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
