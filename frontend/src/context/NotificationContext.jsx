import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { notificationApi } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('keyhouse-notification-preferences');
      return saved ? JSON.parse(saved) : { application: true, lease: true, payment: true, maintenance: true };
    } catch {
      return { application: true, lease: true, payment: true, maintenance: true };
    }
  });

  useEffect(() => {
    localStorage.setItem('keyhouse-notification-preferences', JSON.stringify(preferences));
  }, [preferences]);

  async function reloadNotifications() {
    const version = ++requestVersion.current;
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      return { data: [] };
    }

    setLoading(true);
    setError('');
    try {
      const response = await notificationApi.getNotifications();
      if (version === requestVersion.current) setNotifications(response.data);
      return response;
    } catch (loadError) {
      if (version === requestVersion.current) {
        setNotifications([]);
        setError(loadError.message || 'Unable to load notifications.');
      }
      return { data: [] };
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return undefined;
    if (!user?.id) {
      requestVersion.current += 1;
      setNotifications([]);
      setError('');
      setLoading(false);
      return undefined;
    }

    setNotifications([]);
    reloadNotifications();
    return () => {
      requestVersion.current += 1;
    };
  }, [authLoading, user?.id]);

  function getUserNotifications(user) {
    if (!user?.id) return [];
    return notifications.filter((notification) => notification.userId === user.id);
  }

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  async function addNotification(values) {
    try {
      const response = await notificationApi.addNotification(values);
      if (response.data.userId === user?.id) {
        setNotifications((current) => [response.data, ...current]);
      }
      return response.data;
    } catch (mutationError) {
      setError(mutationError.message || 'Unable to create notification.');
      throw mutationError;
    }
  }

  async function markAsRead(notificationId) {
    try {
      const response = await notificationApi.markNotificationAsRead(notificationId);
      setNotifications((current) => current.map((notification) => notification.id === notificationId || notification.notificationId === notificationId ? response.data : notification));
      return response.data;
    } catch (mutationError) {
      setError(mutationError.message || 'Unable to update notification.');
      throw mutationError;
    }
  }

  async function markAllAsRead() {
    try {
      const response = await notificationApi.markAllNotificationsAsRead();
      setNotifications(response.data);
      return response;
    } catch (mutationError) {
      setError(mutationError.message || 'Unable to mark notifications as read.');
      throw mutationError;
    }
  }

  async function deleteNotification(notificationId) {
    try {
      await notificationApi.deleteNotification(notificationId);
      setNotifications((current) => current.filter((notification) => notification.id !== notificationId && notification.notificationId !== notificationId));
    } catch (mutationError) {
      setError(mutationError.message || 'Unable to delete notification.');
      throw mutationError;
    }
  }

  function updatePreferences(nextPreferences) {
    setPreferences((current) => ({ ...current, ...nextPreferences }));
  }

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    error,
    preferences,
    reloadNotifications,
    getUserNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
  }), [notifications, loading, error, unreadCount, preferences, user?.id]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used inside NotificationProvider');
  return context;
}
