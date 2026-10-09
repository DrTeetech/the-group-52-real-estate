import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { maintenanceApi } from '../services/api';
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthContext';

const MaintenanceContext = createContext(null);
const today = () => new Date().toISOString().slice(0, 10);

export function MaintenanceProvider({ children }) {
  const { token } = useAuth();
  const { addNotification } = useNotifications();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function reloadMaintenanceRequests() {
    setLoading(true);
    setError('');
    try {
      const response = await maintenanceApi.getMaintenanceRequests();
      setRequests(response.data);
    } catch {
      setError('Unable to load maintenance requests.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      reloadMaintenanceRequests();
      return;
    }

    setRequests([]);
    setLoading(false);
    setError('');
  }, [token]);

  function getMaintenanceById(id) {
    return requests.find((item) => item.id === id || item.requestId === id);
  }

  function getMaintenanceByTenant(tenantId) {
    return requests.filter((item) => item.tenantId === tenantId);
  }

  function getMaintenanceByProperty(propertyId) {
    return requests.filter((item) => item.propertyId === propertyId);
  }

  function getMaintenanceByLease(leaseId) {
    return requests.filter((item) => item.leaseId === leaseId);
  }

  async function addMaintenanceRequest(values) {
    const response = await maintenanceApi.createMaintenanceRequest(values);
    setRequests((current) => [response.data, ...current]);
    return response.data;
  }

  async function updateMaintenanceRequest(id, updates) {
    const response = await maintenanceApi.updateMaintenanceRequest(id, updates);
    setRequests((current) => current.map((item) => item.id === id || item.requestId === id ? response.data : item));
    return response.data;
  }

  async function updateMaintenanceStatus(id, status, details = {}) {
    const response = await maintenanceApi.updateMaintenanceRequest(id, {
      ...details,
      status,
      updatedDate: today(),
      ...(status === 'Resolved' ? { resolvedDate: today() } : {}),
    });
    setRequests((current) => current.map((item) => item.id === id || item.requestId === id ? response.data : item));
    return response.data;
  }

  async function assignMaintenanceRequest(id, assignedTo) {
    const response = await maintenanceApi.assignMaintenanceRequest(id, assignedTo);
    setRequests((current) => current.map((item) => item.id === id || item.requestId === id ? response.data : item));
    return response.data;
  }

  async function resolveMaintenanceRequest(id, resolutionNotes, assignedTo = null) {
    const response = await maintenanceApi.resolveMaintenanceRequest(id, resolutionNotes, assignedTo);
    setRequests((current) => current.map((item) => item.id === id || item.requestId === id ? response.data : item));
    try {
      await addNotification({
        type: 'Maintenance',
        title: 'Maintenance request resolved',
        message: `A maintenance request for ${response.data.propertyName} has been resolved.`,
        relatedId: response.data.id,
        relatedRoute: `/maintenance/${response.data.id}`,
        userId: response.data.tenantId,
        userRole: 'TENANT',
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch {
      // ignore notification failures in mock mode
    }
    return response.data;
  }

  const value = useMemo(() => ({
    requests,
    loading,
    error,
    reloadMaintenanceRequests,
    getMaintenanceById,
    getMaintenanceByTenant,
    getMaintenanceByProperty,
    getMaintenanceByLease,
    addMaintenanceRequest,
    updateMaintenanceRequest,
    updateMaintenanceStatus,
    assignMaintenanceRequest,
    resolveMaintenanceRequest,
  }), [requests, loading, error]);

  return <MaintenanceContext.Provider value={value}>{children}</MaintenanceContext.Provider>;
}

export function useMaintenance() {
  const context = useContext(MaintenanceContext);
  if (!context) throw new Error('useMaintenance must be used inside MaintenanceProvider');
  return context;
}
