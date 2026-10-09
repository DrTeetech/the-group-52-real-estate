import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { paymentApi } from '../services/api';
import { useRentalData } from './ApplicationContext';
import { useProperties } from './PropertyContext';
import { useLeases } from './LeaseContext';
import { useAuth } from './AuthContext';

const PaymentContext = createContext(null);

function formatPaymentReference() {
  return `TXN-${Date.now().toString().slice(-6)}`;
}

export function PaymentProvider({ children }) {
  const { token } = useAuth();
  const { tenants } = useRentalData();
  const { properties } = useProperties();
  const { leases } = useLeases();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function reloadPayments() {
    setLoading(true);
    setError('');
    try {
      const response = await paymentApi.getPayments();
      setPayments(response.data);
    } catch {
      setError('Unable to load payment records.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      reloadPayments();
      return;
    }

    setPayments([]);
    setLoading(false);
    setError('');
  }, [token]);

  function findPaymentById(id) {
    return payments.find((payment) => payment.id === id || payment.paymentId === id);
  }

  function getPaymentsByTenant(tenantId) {
    return payments.filter((payment) => payment.tenantId === tenantId);
  }

  async function createPayment(values) {
    const response = await paymentApi.createPayment(values);
    setPayments((current) => [response.data, ...current]);
    return response.data;
  }

  async function updatePayment(id, updates) {
    const response = await paymentApi.updatePayment(id, updates);
    setPayments((current) => current.map((payment) => payment.id === id || payment.paymentId === id ? response.data : payment));
    return response.data;
  }

  async function simulatePayment({ tenantId, propertyId, leaseId, amount, paymentType = 'Rent', paymentMethod = 'Card', description = '', dueDate = new Date().toISOString().slice(0, 10) }) {
    const tenant = tenants.find((item) => item.id === tenantId);
    if (!tenant) throw new Error('Please select a valid tenant.');

    const property = properties.find((item) => item.id === propertyId)
      || (leaseId ? leases.find((lease) => lease.id === leaseId)?.propertyId && properties.find((item) => item.id === leases.find((lease) => lease.id === leaseId).propertyId) : null);

    const lease = leaseId ? leases.find((item) => item.id === leaseId) : null;
    if (!lease && leaseId) throw new Error('We could not validate the linked lease.');

    const paymentAmount = Number(amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      throw new Error('Enter a valid amount greater than zero.');
    }

    const paymentRecord = {
      id: `pay-${Date.now()}`,
      paymentId: `PAY-${Date.now().toString().slice(-6)}`,
      tenantId: tenant.id,
      tenantName: tenant.name,
      propertyId: propertyId || (lease ? lease.propertyId : ''),
      propertyName: property?.name || (lease ? properties.find((item) => item.id === lease.propertyId)?.name : ''),
      leaseId: leaseId || (lease ? lease.id : ''),
      amount: paymentAmount,
      currency: 'NGN',
      paymentType,
      paymentMethod,
      dueDate,
      transactionReference: formatPaymentReference(),
      description: description || `${paymentType} payment`,
      createdAt: new Date().toISOString(),
    };

    const response = await paymentApi.createPayment(paymentRecord);
    setPayments((current) => [response.data, ...current]);
    return response.data;
  }

  const value = useMemo(() => ({
    payments,
    loading,
    error,
    reloadPayments,
    findPaymentById,
    getPaymentsByTenant,
    createPayment,
    updatePayment,
    simulatePayment,
  }), [payments, loading, error]);

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
}

export function usePayments() {
  const context = useContext(PaymentContext);
  if (!context) throw new Error('usePayments must be used inside PaymentProvider');
  return context;
}
