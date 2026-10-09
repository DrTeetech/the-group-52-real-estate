import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProperties } from '../../context/PropertyContext';
import { useRentalData } from '../../context/ApplicationContext';
import { useLeases } from '../../context/LeaseContext';
import { usePayments } from '../../context/PaymentContext';
import { roleNavigation } from '../../data/mockData';
import { ROLE } from '../../data/roles';
import DashboardLayout from '../../layouts/DashboardLayout';
import PaymentFilters from '../../components/payments/PaymentFilters';
import PaymentModal from '../../components/payments/PaymentModal';
import PaymentStats from '../../components/payments/PaymentStats';
import PaymentTable from '../../components/payments/PaymentTable';

const defaultFilters = {
  query: '',
  status: 'All',
  paymentType: 'All',
  paymentMethod: 'All',
  tenantId: 'All',
  propertyId: 'All',
  leaseId: 'All',
  dateFrom: '',
  dateTo: '',
};

export default function PaymentsPage() {
  const { user } = useAuth();
  const { tenants } = useRentalData();
  const { properties } = useProperties();
  const { leases } = useLeases();
  const { payments, loading, error, simulatePayment } = usePayments();
  const [filters, setFilters] = useState(defaultFilters);
  const [isModalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  const tenantUser = user?.role === ROLE.TENANT ? tenants.find((tenant) => tenant.email.toLowerCase() === user.email.toLowerCase()) : null;
  const tenantLease = tenantUser ? leases.find((lease) => lease.tenantId === tenantUser.id) : null;

  const visiblePayments = useMemo(() => {
    const base = user?.role === ROLE.TENANT && tenantUser
      ? payments.filter((payment) => payment.tenantId === tenantUser.id)
      : payments;

    const query = filters.query.trim().toLowerCase();
    return [...base]
      .filter((payment) => {
        const tenantName = payment.tenantName || payment.tenant || '';
        const propertyName = payment.propertyName || payment.property || '';
        const ref = payment.transactionReference || payment.reference || '';
        const matchesQuery = !query || `${payment.paymentId || payment.id} ${tenantName} ${propertyName} ${ref}`.toLowerCase().includes(query);
        const matchesStatus = filters.status === 'All' || payment.status === filters.status;
        const matchesType = filters.paymentType === 'All' || (payment.paymentType || payment.type) === filters.paymentType;
        const matchesMethod = filters.paymentMethod === 'All' || (payment.paymentMethod || payment.method) === filters.paymentMethod;
        const matchesTenant = filters.tenantId === 'All' || payment.tenantId === filters.tenantId;
        const matchesProperty = filters.propertyId === 'All' || payment.propertyId === filters.propertyId;
        const matchesLease = filters.leaseId === 'All' || payment.leaseId === filters.leaseId;
        const dueDate = payment.dueDate || payment.date || '';
        const matchesDateFrom = !filters.dateFrom || !dueDate || dueDate >= filters.dateFrom;
        const matchesDateTo = !filters.dateTo || !dueDate || dueDate <= filters.dateTo;

        return matchesQuery && matchesStatus && matchesType && matchesMethod && matchesTenant && matchesProperty && matchesLease && matchesDateFrom && matchesDateTo;
      })
      .sort((left, right) => new Date(right.dueDate || right.date || right.createdAt || 0) - new Date(left.dueDate || left.date || left.createdAt || 0));
  }, [tenantUser, user, filters, payments]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const handleSubmitPayment = async (formValues) => {
    try {
      setSubmitting(true);
      const paymentType = (formValues.paymentType || 'Rent').toLowerCase().replaceAll(' ', '_');
      const needsLease = ['rent', 'security_deposit', 'service_charge'].includes(paymentType);
      await simulatePayment({
        tenantId: tenantUser?.id || formValues.tenantId || tenants[0]?.id,
        propertyId: tenantUser?.propertyId || formValues.propertyId || properties[0]?.id,
        leaseId: needsLease ? tenantLease?.id || formValues.leaseId || leases[0]?.id : undefined,
        amount: formValues.amount,
        paymentType: formValues.paymentType,
        paymentMethod: formValues.paymentMethod,
        description: formValues.description,
        dueDate: formValues.dueDate,
      });
      setNotice('Payment recorded as pending. Provider verification is not connected.');
      setModalOpen(false);
    } catch (submitError) {
      setNotice(submitError.message || 'Unable to record the payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={user} title={user.role === ROLE.TENANT ? 'My payments' : 'Payments'} subtitle="Transactions" navItems={roleNavigation[user.role]}>
        <div className="panel-card"><h3>Loading payment ledger...</h3></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} title={user.role === ROLE.TENANT ? 'My payments' : 'Payments'} subtitle="Transactions" navItems={roleNavigation[user.role]}>
      <div className="rental-page-intro">
        <div>
          <p className="eyebrow">PAYMENT MANAGEMENT</p>
          <h2>{user.role === ROLE.TENANT ? 'Track your recent rent activity.' : 'Monitor rent, fees, and payment health.'}</h2>
          <p>{user.role === ROLE.TENANT ? 'Review your payment history and upcoming rent deadlines.' : 'Keep track of every successful, pending, and overdue payment event.'}</p>
        </div>
        {user.role !== ROLE.TENANT && <button type="button" className="primary-button" onClick={() => setModalOpen(true)}>Add mock payment</button>}
      </div>

      {notice && <div className="form-message success-message" role="status">{notice}</div>}
      {error && <div className="form-message error-message" role="alert">{error}</div>}

      <PaymentStats payments={visiblePayments} />
      <PaymentFilters values={filters} onChange={updateFilter} onClear={clearFilters} tenants={tenants} properties={properties} leases={leases} />

      {user.role === ROLE.TENANT && (
        <div className="toolbar-actions" style={{ marginTop: '16px' }}>
          <button type="button" className="primary-button" onClick={() => setModalOpen(true)}>Pay now</button>
        </div>
      )}

      <PaymentTable payments={visiblePayments} />

      <PaymentModal
        open={isModalOpen}
        defaultValues={{
          amount: tenantLease ? tenantLease.monthlyRent : '',
          paymentType: 'Rent',
          paymentMethod: 'Card',
          description: tenantUser ? `Rent payment for ${tenantUser.name}` : 'Monthly payment',
          dueDate: new Date().toISOString().slice(0, 10),
        }}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitPayment}
        submitting={submitting}
      />
    </DashboardLayout>
  );
}
