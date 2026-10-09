import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { propertyApi } from '../services/api';
import { useAuth } from './AuthContext';

const PropertyContext = createContext(null);

export function PropertyProvider({ children }) {
  const { token } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function reloadProperties() {
    setLoading(true);
    setError('');
    try {
      const response = await propertyApi.getProperties();
      setProperties(response.data);
    } catch {
      setError('Unable to load properties.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      reloadProperties();
      return;
    }

    setProperties([]);
    setLoading(false);
    setError('');
  }, [token]);

  async function addProperty(values) {
    const response = await propertyApi.createProperty(values);
    setProperties((current) => [response.data, ...current]);
    return response.data;
  }

  async function updateProperty(id, values) {
    const response = await propertyApi.updateProperty(id, values);
    setProperties((current) => current.map((property) => property.id === id ? response.data : property));
    return response.data;
  }

  async function deleteProperty(id) {
    await propertyApi.deleteProperty(id);
    setProperties((current) => current.filter((property) => property.id !== id));
  }

  const value = useMemo(() => ({
    properties,
    loading,
    error,
    reloadProperties,
    addProperty,
    updateProperty,
    deleteProperty,
  }), [properties, loading, error]);

  return <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>;
}

export function useProperties() {
  const context = useContext(PropertyContext);
  if (!context) throw new Error('useProperties must be used inside PropertyProvider');
  return context;
}
