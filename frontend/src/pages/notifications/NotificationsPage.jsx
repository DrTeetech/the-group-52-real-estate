import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { roleNavigation } from '../../data/mockData';
import DashboardLayout from '../../layouts/DashboardLayout';

const typeColors = {
  Payment: 'notice-success',
  Lease: 'notice-warning',
  Application: 'notice-info',
  Maintenance: 'notice-neutral',
  System: 'notice-info',
};

function formatRelativeTime(value) {
  if (!value) return 'Just now';
  const date = new Date(value);
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 60) return `${Math.max(1, diffMinutes)} min ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, getUserNotifications, markAsRead, markAllAsRead, unreadCount, loading, error } = useNotifications();
  const [filter, setFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const visibleNotifications = useMemo(() => {
    const userNotifications = getUserNotifications(user);
    return [...userNotifications]
      .filter((notification) => filter === 'All' ? true : filter === 'Unread' ? !notification.read : notification.read)
      .filter((notification) => typeFilter === 'All' ? true : notification.type === typeFilter)
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  }, [filter, getUserNotifications, notifications, typeFilter, user]);

  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead();
    } catch {
      return;
    }
  }

  async function handleMarkAsRead(notificationId) {
    try {
      await markAsRead(notificationId);
    } catch {
      return;
    }
  }

  return (
    <DashboardLayout user={user} title="Notifications" subtitle="Updates" navItems={roleNavigation[user.role]}>
      <div className="rental-page-intro">
        <div>
          <p className="eyebrow">COMMUNICATION CENTER</p>
          <h2>Stay across every update.</h2>
          <p>Keep track of applications, payment changes, lease actions, and maintenance follow-ups.</p>
        </div>
        <div className="toolbar-actions">
          <button type="button" className="secondary-link" onClick={handleMarkAllAsRead} disabled={loading || unreadCount === 0}>Mark all read</button>
        </div>
      </div>

      {error && <div className="form-message error-message" role="alert">{error}</div>}

      <div className="panel-card">
        <div className="panel-header with-actions">
          <div>
            <p className="eyebrow">NOTIFICATIONS</p>
            <h3>{unreadCount} unread alerts</h3>
          </div>
        </div>
        <div className="rental-filter-controls property-filter-grid">
          <div className="field-group">
            <label htmlFor="notification-status">Read state</label>
            <select id="notification-status" className="select-field" value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="All">All</option>
              <option value="Unread">Unread</option>
              <option value="Read">Read</option>
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="notification-type">Type</label>
            <select id="notification-type" className="select-field" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="All">All</option>
              <option value="Payment">Payment</option>
              <option value="Lease">Lease</option>
              <option value="Application">Application</option>
              <option value="Maintenance">Maintenance</option>
              <option value="System">System</option>
            </select>
          </div>
        </div>
      </div>

      <div className="panel-card">
        {loading ? (
          <p className="empty-state-title">Loading notifications…</p>
        ) : visibleNotifications.length === 0 ? (
          <p className="empty-state-title">There are no notifications to show in this view.</p>
        ) : (
          <div className="notifications-list">
            {visibleNotifications.map((notification) => (
              <div key={notification.id} className="notification-row" style={{ borderTop: '1px solid #edf0ea', paddingTop: '14px' }}>
                <span className={`notice-dot ${typeColors[notification.type] || 'notice-neutral'}`} />
                <div>
                  <strong>{notification.title}</strong>
                  <small>{notification.message}</small>
                </div>
                <div style={{ display: 'grid', justifyItems: 'end', gap: '8px' }}>
                  <span className="notification-time">{formatRelativeTime(notification.createdAt)}</span>
                  <div className="toolbar-actions">
                    {notification.relatedRoute && <Link className="secondary-link" to={notification.relatedRoute} style={{ minHeight: '30px', padding: '0 10px' }}>Open</Link>}
                    {!notification.read && <button type="button" className="toolbar-button" onClick={() => handleMarkAsRead(notification.id)}>Mark read</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
