import { useMemo, useState } from 'react';
import { Download, Filter, TrendingUp } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getLeaseStatus, useLeases } from '../../context/LeaseContext.jsx';
import { useProperties } from '../../context/PropertyContext.jsx';
import { useRentalData } from '../../context/ApplicationContext.jsx';
import { usePayments } from '../../context/PaymentContext.jsx';
import { useMaintenance } from '../../context/MaintenanceContext.jsx';
import { roleNavigation } from '../../data/mockData.js';

const formatCurrency = (value) => `₦${new Intl.NumberFormat('en-NG').format(value)}`;

function normalizeDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizePropertyStatus(value) {
  const normalized = String(value || '').trim().toLowerCase();
  const map = { available: 'Available', rented: 'Occupied', occupied: 'Occupied', maintenance: 'Maintenance', unavailable: 'Maintenance', draft: 'Unlisted', reserved: 'Unlisted' };
  return map[normalized] || (value || 'Unlisted');
}

function normalizeApplicationStatus(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
  const map = {
    submitted: 'Pending',
    pending: 'Pending',
    under_review: 'Under Review',
    approved: 'Approved',
    approved_application: 'Approved',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
    cancelled: 'Cancelled',
  };
  return map[normalized] || (value || 'Pending');
}

function normalizePaymentStatus(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
  const map = {
    pending: 'Pending',
    successful: 'Successful',
    failed: 'Failed',
    refunded: 'Refunded',
    overdue: 'Overdue',
    paid: 'Successful',
  };
  return map[normalized] || (value || 'Pending');
}

function normalizeMaintenanceStatus(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
  const map = {
    submitted: 'Submitted',
    under_review: 'Under Review',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    completed: 'Resolved',
    resolved: 'Resolved',
    closed: 'Closed',
    cancelled: 'Closed',
  };
  return map[normalized] || (value || 'Submitted');
}

function normalizePropertyName(property) {
  if (!property) return '';
  if (property.name) return property.name;
  if (property.title) return property.title;
  return property.propertyName || 'Property';
}

function resolvePropertyName(propertyId, properties) {
  const property = properties.find((item) => String(item.id) === String(propertyId));
  return property ? normalizePropertyName(property) : 'Property';
}

function matchesDateRange(value, range) {
  if (range === 'all') return true;
  const date = normalizeDate(value);
  if (!date) return true;

  const now = new Date();
  const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((dateOnly.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  switch (range) {
    case '7': return diffDays >= 0 && diffDays <= 7;
    case '30': return diffDays >= 0 && diffDays <= 30;
    case '90': return diffDays >= 0 && diffDays <= 90;
    case 'year': return diffDays >= 0 && diffDays <= 365;
    default: return true;
  }
}

function exportCsv(rows, filename) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { properties, loading: propertiesLoading } = useProperties();
  const { applications, loading: applicationsLoading } = useRentalData();
  const { leases, loading: leasesLoading } = useLeases();
  const { payments, loading: paymentsLoading } = usePayments();
  const { requests: maintenanceRequests, loading: maintenanceLoading } = useMaintenance();
  const [dateRange, setDateRange] = useState('30');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const isLoading = propertiesLoading || applicationsLoading || leasesLoading || paymentsLoading || maintenanceLoading;

  const propertyOptions = ['all', ...properties.map((property) => normalizePropertyName(property))];

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => propertyFilter === 'all' || normalizePropertyName(property) === propertyFilter);
  }, [properties, propertyFilter]);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const applicationProperty = normalizePropertyName(application.propertyDetails || application.property || { name: application.propertyName || application.property || 'Property' });
      const matchesProperty = propertyFilter === 'all' || applicationProperty === propertyFilter;
      const matchesStatus = statusFilter === 'all' || normalizeApplicationStatus(application.status) === statusFilter;
      const matchesDate = matchesDateRange(application.date || application.lastUpdated || application.createdAt, dateRange);
      return matchesProperty && matchesStatus && matchesDate;
    });
  }, [applications, dateRange, propertyFilter, statusFilter]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const paymentProperty = resolvePropertyName(payment.propertyId || payment.property || payment.propertyDetails?._id || payment.property?._id, properties);
      const matchesProperty = propertyFilter === 'all' || paymentProperty === propertyFilter;
      const matchesStatus = statusFilter === 'all' || normalizePaymentStatus(payment.status || payment.paymentStatus) === statusFilter;
      const matchesDate = matchesDateRange(payment.date || payment.paidDate || payment.createdAt, dateRange);
      return matchesProperty && matchesStatus && matchesDate;
    });
  }, [dateRange, payments, properties, propertyFilter, statusFilter]);

  const filteredLeases = useMemo(() => {
    return leases.filter((lease) => {
      const propertyName = resolvePropertyName(lease.propertyId || lease.property, properties);
      const matchesProperty = propertyFilter === 'all' || propertyName === propertyFilter;
      const matchesStatus = statusFilter === 'all' || getLeaseStatus(lease) === statusFilter;
      const matchesDate = matchesDateRange(lease.startDate || lease.createdAt || lease.updatedAt, dateRange);
      return matchesProperty && matchesStatus && matchesDate;
    });
  }, [dateRange, leases, properties, propertyFilter, statusFilter]);

  const filteredMaintenance = useMemo(() => {
    return maintenanceRequests.filter((request) => {
      const propertyName = resolvePropertyName(request.propertyId || request.property, properties);
      const matchesProperty = propertyFilter === 'all' || propertyName === propertyFilter;
      const matchesStatus = statusFilter === 'all' || normalizeMaintenanceStatus(request.status) === statusFilter;
      const matchesDate = matchesDateRange(request.submittedDate || request.updatedDate || request.createdAt, dateRange);
      return matchesProperty && matchesStatus && matchesDate;
    });
  }, [dateRange, maintenanceRequests, properties, propertyFilter, statusFilter]);

  const reportStats = useMemo(() => {
    const occupied = filteredProperties.filter((property) => normalizePropertyStatus(property.status) === 'Occupied').length;
    const available = filteredProperties.filter((property) => normalizePropertyStatus(property.status) === 'Available').length;
    const maintenanceCount = filteredProperties.filter((property) => normalizePropertyStatus(property.status) === 'Maintenance').length;
    const unlisted = filteredProperties.filter((property) => normalizePropertyStatus(property.status) === 'Unlisted').length;
    const occupancyRate = filteredProperties.length ? ((occupied / filteredProperties.length) * 100).toFixed(1) : '0.0';

    const pendingApps = filteredApplications.filter((app) => {
      const status = normalizeApplicationStatus(app.status);
      return status === 'Pending' || status === 'Under Review';
    }).length;
    const approvedApps = filteredApplications.filter((app) => normalizeApplicationStatus(app.status) === 'Approved').length;
    const rejectedApps = filteredApplications.filter((app) => normalizeApplicationStatus(app.status) === 'Rejected').length;

    const activeLeases = filteredLeases.filter((lease) => getLeaseStatus(lease) === 'Active').length;
    const expiringSoon = filteredLeases.filter((lease) => getLeaseStatus(lease) === 'Expiring Soon').length;
    const expiredLeases = filteredLeases.filter((lease) => getLeaseStatus(lease) === 'Expired').length;
    const terminatedLeases = filteredLeases.filter((lease) => String(lease.status || '').toLowerCase() === 'terminated').length;

    const successfulPayments = filteredPayments.filter((payment) => normalizePaymentStatus(payment.status || payment.paymentStatus) === 'Successful').length;
    const pendingPayments = filteredPayments.filter((payment) => normalizePaymentStatus(payment.status || payment.paymentStatus) === 'Pending').length;
    const failedPayments = filteredPayments.filter((payment) => normalizePaymentStatus(payment.status || payment.paymentStatus) === 'Failed').length;
    const overduePayments = filteredPayments.filter((payment) => normalizePaymentStatus(payment.status || payment.paymentStatus) === 'Overdue').length;
    const collectedTotal = filteredPayments.filter((payment) => normalizePaymentStatus(payment.status || payment.paymentStatus) === 'Successful').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const outstandingTotal = filteredPayments.filter((payment) => normalizePaymentStatus(payment.status || payment.paymentStatus) !== 'Successful').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const submittedMaintenance = filteredMaintenance.filter((request) => normalizeMaintenanceStatus(request.status) === 'Submitted').length;
    const inProgressMaintenance = filteredMaintenance.filter((request) => normalizeMaintenanceStatus(request.status) === 'In Progress').length;
    const resolvedMaintenance = filteredMaintenance.filter((request) => normalizeMaintenanceStatus(request.status) === 'Resolved').length;
    const closedMaintenance = filteredMaintenance.filter((request) => normalizeMaintenanceStatus(request.status) === 'Closed').length;
    const highPriorityMaintenance = filteredMaintenance.filter((request) => {
      const priority = String(request.priority || '').trim().toLowerCase();
      return priority === 'high' || priority === 'urgent' || priority === 'emergency';
    }).length;

    return {
      totalProperties: filteredProperties.length,
      available,
      occupied,
      maintenanceCount,
      unlisted,
      occupancyRate,
      totalApplications: filteredApplications.length,
      pendingApps,
      approvedApps,
      rejectedApps,
      totalLeases: filteredLeases.length,
      activeLeases,
      expiringSoon,
      expiredLeases,
      terminatedLeases,
      totalPayments: filteredPayments.length,
      successfulPayments,
      pendingPayments,
      failedPayments,
      overduePayments,
      collectedTotal,
      outstandingTotal,
      totalMaintenance: filteredMaintenance.length,
      submittedMaintenance,
      inProgressMaintenance,
      resolvedMaintenance,
      closedMaintenance,
      highPriorityMaintenance,
    };
  }, [filteredApplications, filteredLeases, filteredMaintenance, filteredPayments, filteredProperties]);

  const monthlyTrend = useMemo(() => {
    const buckets = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return {
        label: date.toLocaleString('en-US', { month: 'short' }),
        value: 0,
      };
    });

    filteredPayments.forEach((payment) => {
      const paymentDate = normalizeDate(payment.date);
      if (!paymentDate) return;
      const offset = (new Date().getFullYear() - paymentDate.getFullYear()) * 12 + (new Date().getMonth() - paymentDate.getMonth());
      if (offset >= 0 && offset < buckets.length) {
        buckets[offset].value += Number(payment.amount || 0);
      }
    });

    return buckets;
  }, [filteredPayments]);

  const recentPayments = [...filteredPayments].sort((left, right) => new Date(right.date || right.paidDate || right.createdAt || 0) - new Date(left.date || left.paidDate || left.createdAt || 0)).slice(0, 4);
  const recentApplications = [...filteredApplications].sort((left, right) => new Date(right.date || right.lastUpdated || right.createdAt || 0) - new Date(left.date || left.lastUpdated || left.createdAt || 0)).slice(0, 4);
  const upcomingExpirations = [...filteredLeases]
    .filter((lease) => ['Active', 'Expiring Soon'].includes(getLeaseStatus(lease)))
    .sort((left, right) => new Date(left.endDate || 0) - new Date(right.endDate || 0))
    .slice(0, 4);
  const recentMaintenance = [...filteredMaintenance].sort((left, right) => new Date(right.submittedDate || right.updatedDate || right.createdAt || 0) - new Date(left.submittedDate || left.updatedDate || left.createdAt || 0)).slice(0, 4);

  const exportRows = [
    ...recentApplications.map((item) => ({ title: item.applicant || item.applicantName || 'Applicant', type: 'Application', status: normalizeApplicationStatus(item.status), date: item.date || item.lastUpdated || item.createdAt, amount: Number(item.income || 0) })),
    ...recentPayments.map((item) => ({ title: item.tenantName || item.tenant || 'Tenant', type: 'Payment', status: normalizePaymentStatus(item.status || item.paymentStatus), date: item.date || item.paidDate || item.createdAt, amount: Number(item.amount || 0) })),
    ...recentMaintenance.map((item) => ({ title: item.issue || item.title || 'Maintenance item', type: 'Maintenance', status: normalizeMaintenanceStatus(item.status), date: item.submittedDate || item.updatedDate || item.createdAt, amount: 0 }))
  ];

  const navItems = user ? roleNavigation[user.role] || roleNavigation.ADMIN : roleNavigation.ADMIN;

  if (isLoading) {
    return (
      <DashboardLayout user={user} title="Reports" subtitle="Portfolio insights" navItems={navItems}>
        <div className="panel-card empty-state-card">
          <p className="eyebrow">LOADING</p>
          <h3>Loading portfolio data…</h3>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} title="Reports" subtitle="Portfolio insights" navItems={navItems}>
      <div className="report-toolbar panel-card">
        <div className="report-toolbar-header">
          <div>
            <p className="eyebrow">REPORT FILTERS</p>
            <h3>Portfolio overview</h3>
          </div>
          <button type="button" className="secondary-button" onClick={() => exportCsv(exportRows, 'keyhouse-report-summary.csv')}>
            <Download size={15} /> Export CSV
          </button>
        </div>
        <div className="report-filter-grid">
          <label className="field-group compact-field">
            <span>Date range</span>
            <select value={dateRange} onChange={(event) => setDateRange(event.target.value)}>
              <option value="all">All data</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="year">This year</option>
            </select>
          </label>
          <label className="field-group compact-field">
            <span>Property</span>
            <select value={propertyFilter} onChange={(event) => setPropertyFilter(event.target.value)}>
              {propertyOptions.map((option) => (
                <option key={option} value={option}>{option === 'all' ? 'All properties' : option}</option>
              ))}
            </select>
          </label>
          <label className="field-group compact-field">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
              <option value="Submitted">Submitted</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </label>
        </div>
      </div>

      <div className="report-summary-grid stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Total properties</span>
          <h3>{reportStats.totalProperties}</h3>
          <small>{reportStats.available} available • {reportStats.occupied} occupied</small>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Occupancy rate</span>
          <h3>{reportStats.occupancyRate}%</h3>
          <small>{reportStats.maintenanceCount} in maintenance</small>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Applications</span>
          <h3>{reportStats.totalApplications}</h3>
          <small>{reportStats.pendingApps} pending • {reportStats.approvedApps} approved</small>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Leases</span>
          <h3>{reportStats.totalLeases}</h3>
          <small>{reportStats.activeLeases} active • {reportStats.expiringSoon} expiring</small>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Successful payments</span>
          <h3>{reportStats.successfulPayments}</h3>
          <small>{formatCurrency(reportStats.collectedTotal)} collected</small>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Outstanding</span>
          <h3>{formatCurrency(reportStats.outstandingTotal)}</h3>
          <small>{reportStats.pendingPayments} pending • {reportStats.overduePayments} overdue</small>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Maintenance</span>
          <h3>{reportStats.totalMaintenance}</h3>
          <small>{reportStats.inProgressMaintenance} in progress • {reportStats.resolvedMaintenance} resolved</small>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">High priority</span>
          <h3>{reportStats.highPriorityMaintenance}</h3>
          <small>{reportStats.submittedMaintenance} submitted</small>
        </div>
      </div>

      <div className="panel-grid two-col">
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">VISUAL</p>
              <h3>Monthly payment trend</h3>
            </div>
            <TrendingUp size={16} />
          </div>
          <div className="chart-bars" aria-label="Monthly payment chart">
            {monthlyTrend.map((item) => (
              <div key={item.label} className="chart-bar-group">
                <div className="chart-bar-wrap">
                  <span className="chart-bar" style={{ height: `${Math.max((item.value / Math.max(...monthlyTrend.map((entry) => entry.value), 1)) * 100, 10)}%` }} />
                </div>
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">STATUS MIX</p>
              <h3>Application pipeline</h3>
            </div>
            <Filter size={16} />
          </div>
          <div className="status-stack">
            <div><span>Pending</span><strong>{reportStats.pendingApps}</strong></div>
            <div><span>Approved</span><strong>{reportStats.approvedApps}</strong></div>
            <div><span>Rejected</span><strong>{reportStats.rejectedApps}</strong></div>
            <div><span>Active leases</span><strong>{reportStats.activeLeases}</strong></div>
            <div><span>Expiring soon</span><strong>{reportStats.expiringSoon}</strong></div>
            <div><span>Expired</span><strong>{reportStats.expiredLeases}</strong></div>
          </div>
        </div>
      </div>

      <div className="panel-grid two-col">
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">TREND</p>
              <h3>Recent payments</h3>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.length ? recentPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.tenantName || payment.tenant}</td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td><span className={`status-badge ${payment.status === 'Successful' ? 'status-success' : payment.status === 'Pending' ? 'status-warning' : 'status-danger'}`}>{payment.status}</span></td>
                    <td>{payment.date}</td>
                  </tr>
                )) : <tr><td colSpan="4">No payments found for the current filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">PIPELINE</p>
              <h3>Recent applications</h3>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Property</th>
                  <th>Status</th>
                  <th>Income</th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.length ? recentApplications.map((application) => (
                  <tr key={application.id}>
                    <td>{application.applicant}</td>
                    <td>{application.property}</td>
                    <td><span className={`status-badge ${application.status === 'Approved' ? 'status-success' : application.status === 'Rejected' ? 'status-danger' : 'status-warning'}`}>{application.status}</span></td>
                    <td>{formatCurrency(application.income)}</td>
                  </tr>
                )) : <tr><td colSpan="4">No applications are available for this view.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="panel-grid two-col">
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">LEASES</p>
              <h3>Upcoming expirations</h3>
            </div>
          </div>
          <div className="mini-list">
            {upcomingExpirations.length ? upcomingExpirations.map((lease) => {
              const propertyName = properties.find((property) => property.id === lease.propertyId)?.name ?? 'Property';
              return (
                <div key={lease.id}>
                  <span>{propertyName} • {lease.endDate}</span>
                  <strong>{getLeaseStatus(lease)}</strong>
                </div>
              );
            }) : <p className="property-muted">No expirations match the current filters.</p>}
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">MAINTENANCE</p>
              <h3>Recent requests</h3>
            </div>
          </div>
          <div className="mini-list">
            {recentMaintenance.length ? recentMaintenance.map((request) => (
              <div key={request.id}>
                <span>{request.issue} • {request.property}</span>
                <strong>{request.status}</strong>
              </div>
            )) : <p className="property-muted">No maintenance records are available.</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
