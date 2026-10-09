import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { leaseApi } from '../services/api';
import { useRentalData } from './ApplicationContext';
import { useProperties } from './PropertyContext';
import { useAuth } from './AuthContext';

const LeaseContext = createContext(null);
const dayMs = 24 * 60 * 60 * 1000;
const todayString = () => new Date().toISOString().slice(0, 10);

export function getLeaseStatus(lease, now = new Date()) {
  if (lease.status === 'Draft' || lease.status === 'Terminated') return lease.status;
  if (!lease.endDate || Number.isNaN(Date.parse(lease.endDate))) return 'Active';
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDate = new Date(`${lease.endDate}T00:00:00`);
  if (endDate < today) return 'Expired';
  const daysRemaining = Math.ceil((endDate - today) / dayMs);
  return daysRemaining <= 60 ? 'Expiring Soon' : 'Active';
}

export function isActiveLease(lease) {
  return ['Active', 'Expiring Soon'].includes(getLeaseStatus(lease));
}

function hasApprovedApplication(tenant, applications) {
  return applications.some((application) => application.status === 'Approved'
    && (application.tenantId === tenant.id || application.id === tenant.applicationId));
}

export function LeaseProvider({ children }) {
  const { token } = useAuth();
  const { properties, updateProperty } = useProperties();
  const { tenants, applications, updateTenantRecord } = useRentalData();
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function reloadLeases() {
    setLoading(true);
    setError('');
    try {
      const response = await leaseApi.getLeases();
      setLeases(response.data);
    } catch {
      setError('Unable to load leases.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      reloadLeases();
      return;
    }

    setLeases([]);
    setLoading(false);
    setError('');
  }, [token]);

  function activeLeaseForTenant(tenantId, excludingLeaseId) {
    return leases.find((lease) => lease.tenantId === tenantId
      && lease.id !== excludingLeaseId
      && isActiveLease(lease));
  }

  function activeLeaseForProperty(propertyId, excludingLeaseId) {
    return leases.find((lease) => lease.propertyId === propertyId
      && lease.id !== excludingLeaseId
      && isActiveLease(lease));
  }

  function approvedTenants() {
    return tenants.filter((tenant) => hasApprovedApplication(tenant, applications)
      && !activeLeaseForTenant(tenant.id));
  }

  function eligibleProperties(tenantId) {
    const tenant = tenants.find((item) => item.id === tenantId);
    const approvedApplication = applications.find((application) => application.status === 'Approved'
      && (application.tenantId === tenantId || application.id === tenant?.applicationId));
    if (!tenant || !approvedApplication) return [];
    return properties.filter((property) => {
      const propertyIsApplicantHome = property.id === approvedApplication.propertyId;
      const propertyMatchesTenant = property.tenant?.tenantId === tenant.id
        || property.tenant?.email?.toLowerCase() === tenant.email.toLowerCase();
      const propertyIsOpen = property.status === 'Available' || (propertyIsApplicantHome && propertyIsOpenForTenant(property, propertyMatchesTenant));
      return propertyIsOpen && !activeLeaseForProperty(property.id);
    });
  }

  async function syncLeaseToTenantAndProperty(lease) {
    const tenant = tenants.find((item) => item.id === lease.tenantId);
    const property = properties.find((item) => item.id === lease.propertyId);
    if (!tenant || !property) throw new Error('Lease tenant or property record was not found.');
    const status = getLeaseStatus(lease);
    await updateTenantRecord(tenant.id, {
      propertyId: property.id,
      property: property.name,
      monthlyRent: lease.monthlyRent,
      leaseId: lease.id,
      leaseStatus: status,
      startDate: lease.startDate,
      endDate: lease.endDate,
      paymentDueDate: lease.paymentDueDate,
      status: 'Active',
    });
    await updateProperty(property.id, {
      status: 'Occupied',
      occupancy: 100,
      monthlyRent: lease.monthlyRent,
      securityDeposit: lease.securityDeposit,
      tenant: {
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        tenantId: tenant.id,
        leaseStatus: status,
      },
      lease: {
        id: lease.id,
        startDate: lease.startDate,
        endDate: lease.endDate,
        status,
      },
    });
  }

  async function createLease(values) {
    const tenant = tenants.find((item) => item.id === values.tenantId);
    const property = properties.find((item) => item.id === values.propertyId);
    if (!tenant || !hasApprovedApplication(tenant, applications)) {
      throw new Error('Select a tenant with an approved rental application.');
    }
    if (activeLeaseForTenant(tenant.id)) throw new Error('This tenant already has an active lease.');
    if (activeLeaseForProperty(values.propertyId)) throw new Error('This property already has an active lease.');
    if (!property || !eligibleProperties(tenant.id).some((item) => item.id === property.id)) {
      throw new Error('Select the property approved for this tenant.');
    }

    const response = await leaseApi.createLease({
      ...values,
      applicationId: tenant.applicationId || applications.find((item) => item.tenantId === tenant.id)?.id,
      status: 'Active',
    });
    await syncLeaseToTenantAndProperty(response.data);
    setLeases((current) => [response.data, ...current]);
    return response.data;
  }

  async function updateLease(id, values) {
    const current = leases.find((item) => item.id === id);
    if (!current) throw new Error('Lease not found.');
    if (values.tenantId && values.tenantId !== current.tenantId) throw new Error('Tenant cannot be changed for an existing lease.');
    if (values.propertyId && values.propertyId !== current.propertyId) throw new Error('Property cannot be changed for an existing lease.');
    if (getLeaseStatus(current) === 'Terminated') throw new Error('Terminated leases cannot be edited.');

    const newStatus = values.status || current.status;
    if (newStatus === 'Active' && !isActiveLease(current)) {
      if (activeLeaseForTenant(current.tenantId, id) || activeLeaseForProperty(current.propertyId, id)) {
        throw new Error('An active lease already exists for this tenant or property.');
      }
    }
    const response = await leaseApi.updateLease(id, { ...values, updatedAt: todayString() });
    setLeases((currentLeases) => currentLeases.map((lease) => lease.id === id ? response.data : lease));
    if (['Active', 'Expiring Soon'].includes(getLeaseStatus(response.data))) await syncLeaseToTenantAndProperty(response.data);
    return response.data;
  }

  async function renewLease(id, { endDate, monthlyRent }) {
    const current = leases.find((item) => item.id === id);
    if (!current) throw new Error('Lease not found.');
    if (getLeaseStatus(current) === 'Terminated' || getLeaseStatus(current) === 'Draft') {
      throw new Error('This lease cannot be renewed.');
    }
    if (endDate <= current.endDate) throw new Error('The new lease end date must be after the current end date.');
    if (!Number.isFinite(Number(monthlyRent)) || Number(monthlyRent) <= 0) throw new Error('New monthly rent must be greater than zero.');
    const response = await leaseApi.updateLease(id, {
      endDate,
      monthlyRent: Number(monthlyRent),
      status: 'Active',
      updatedAt: todayString(),
      renewedAt: todayString(),
    });
    setLeases((currentLeases) => currentLeases.map((lease) => lease.id === id ? response.data : lease));
    await syncLeaseToTenantAndProperty(response.data);
    return response.data;
  }

  async function terminateLease(id, reason) {
    const current = leases.find((item) => item.id === id);
    if (!current) throw new Error('Lease not found.');
    if (!isActiveLease(current)) throw new Error('Only an active lease can be terminated.');
    if (!reason?.trim()) throw new Error('A termination reason is required.');

    const response = await leaseApi.updateLease(id, {
      status: 'Terminated',
      terminationReason: reason.trim(),
      terminatedAt: todayString(),
      updatedAt: todayString(),
    });
    const otherActiveLease = activeLeaseForProperty(current.propertyId, id);
    const tenant = tenants.find((item) => item.id === current.tenantId);
    const property = properties.find((item) => item.id === current.propertyId);
    if (tenant && !activeLeaseForTenant(tenant.id, id)) {
      await updateTenantRecord(tenant.id, { leaseId: null, leaseStatus: 'Expired', status: 'Inactive' });
    }
    if (property && !otherActiveLease) {
      await updateProperty(property.id, { status: 'Available', occupancy: 0, tenant: null, lease: null });
    }
    setLeases((currentLeases) => currentLeases.map((lease) => lease.id === id ? response.data : lease));
    return response.data;
  }

  const value = useMemo(() => ({
    leases,
    loading,
    error,
    reloadLeases,
    getLeaseStatus,
    activeLeaseForTenant,
    activeLeaseForProperty,
    approvedTenants: approvedTenants(),
    eligibleProperties,
    createLease,
    updateLease,
    renewLease,
    terminateLease,
  }), [leases, loading, error, tenants, applications, properties]);

  return <LeaseContext.Provider value={value}>{children}</LeaseContext.Provider>;
}

function propertyIsOpenForTenant(property, propertyMatchesTenant) {
  return property.status === 'Occupied' && propertyMatchesTenant;
}

export function useLeases() {
  const context = useContext(LeaseContext);
  if (!context) throw new Error('useLeases must be used inside LeaseProvider');
  return context;
}
