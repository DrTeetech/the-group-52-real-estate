import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { applicationApi, tenantApi } from '../services/api';
import { useProperties } from './PropertyContext';
import { useAuth } from './AuthContext';

const ApplicationContext = createContext(null);

export function ApplicationProvider({ children }) {
  const { token } = useAuth();
  const { properties, updateProperty } = useProperties();
  const [applications, setApplications] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function reloadRentalData() {
    setLoading(true);
    setError('');
    try {
      const [applicationResponse, tenantResponse] = await Promise.all([
        applicationApi.getApplications(),
        tenantApi.getTenants(),
      ]);
      setApplications(applicationResponse.data);
      setTenants(tenantResponse.data);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load applications and tenants.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      reloadRentalData();
      return;
    }

    setApplications([]);
    setLoading(false);
    setError('');
  }, [token]);

  async function submitApplication(values) {
    const property = properties.find((item) => item.id === values.propertyId);
    if (!property || property.status !== 'Available') {
      throw new Error('This property is no longer available for applications.');
    }
    const response = await applicationApi.createApplication({
      ...values,
      propertyId: property.id,
    });
    setApplications((current) => [response.data, ...current]);
    return response.data;
  }

  async function updateApplicationStatus(id, status, extra = {}) {
    const response = await applicationApi.updateApplication(id, {
      ...extra,
      status,
    });
    setApplications((current) => current.map((item) => item.id === id ? response.data : item));
    return response.data;
  }

  async function updateTenantRecord(id, updates) {
    const response = await tenantApi.updateTenant(id, updates);
    setTenants((current) => current.map((tenant) => tenant.id === id ? response.data : tenant));
    return response.data;
  }

  async function approveApplication(id) {
    const application = applications.find((item) => item.id === id);
    if (!application) throw new Error('Application not found.');
    if (!['Pending', 'Under Review'].includes(application.status)) throw new Error('This application is no longer awaiting review.');

    const property = properties.find((item) => item.id === application.propertyId);
    if (!property || property.status !== 'Available') {
      throw new Error('The selected property is no longer available.');
    }

    const response = await applicationApi.updateApplication(id, {
      status: 'Approved',
    });
    setApplications((current) => current.map((item) => item.id === id ? response.data : item));
    return response.data;
  }

  async function deleteApplication(id) {
    await applicationApi.deleteApplication(id);
    setApplications((current) => current.filter((item) => item.id !== id));
  }

  const value = useMemo(() => ({
    applications,
    tenants,
    loading,
    error,
    reloadRentalData,
    submitApplication,
    updateApplicationStatus,
    updateTenantRecord,
    approveApplication,
    deleteApplication,
  }), [applications, tenants, loading, error, properties]);

  return <ApplicationContext.Provider value={value}>{children}</ApplicationContext.Provider>;
}

export function useRentalData() {
  const context = useContext(ApplicationContext);
  if (!context) throw new Error('useRentalData must be used inside ApplicationProvider');
  return context;
}
