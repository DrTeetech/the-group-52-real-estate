import { useEffect, useMemo, useState } from 'react';
import { BellRing, KeyRound, Moon, Palette, ShieldCheck, UserCog } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { roleNavigation } from '../../data/mockData.js';

const defaultPreferences = {
  application: true,
  lease: true,
  payment: true,
  maintenance: true,
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { preferences, updatePreferences } = useNotifications();
  const [theme, setTheme] = useState(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'));
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordState, setPasswordState] = useState({ status: 'idle', message: '' });
  const [notificationState, setNotificationState] = useState({ ...defaultPreferences, ...preferences });

  useEffect(() => {
    setNotificationState({ ...defaultPreferences, ...preferences });
  }, [preferences]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('keyhouse-theme', theme);
  }, [theme]);

  const navItems = user ? roleNavigation[user.role] || roleNavigation.ADMIN : roleNavigation.ADMIN;

  const accountSummary = useMemo(() => ({
    email: user?.email || 'N/A',
    role: user?.role || 'Guest',
    status: 'Active',
  }), [user]);

  const handleToggle = (key) => {
    const next = { ...notificationState, [key]: !notificationState[key] };
    setNotificationState(next);
    updatePreferences(next);
  };

  const handlePasswordChange = (event) => {
    event.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordState({ status: 'error', message: 'All password fields are required.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordState({ status: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordState({ status: 'error', message: 'The new password and confirmation do not match.' });
      return;
    }

    setPasswordState({
      status: 'success',
      message: 'Password updates are stored in the current session state and are ready for backend API integration when the auth service is expanded.',
    });
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <DashboardLayout user={user} title="Settings" subtitle="Workspace preferences" navItems={navItems}>
      <div className="settings-page-grid">
        <div className="panel-card settings-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">ACCOUNT</p>
              <h3>Profile and status</h3>
            </div>
            <UserCog size={16} />
          </div>
          <div className="settings-list">
            <div><span>Profile</span><Link to="/profile">View profile</Link></div>
            <div><span>Email</span><strong>{accountSummary.email}</strong></div>
            <div><span>Role</span><strong>{accountSummary.role}</strong></div>
            <div><span>Account status</span><strong>{accountSummary.status}</strong></div>
          </div>
        </div>

        <div className="panel-card settings-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">PREFERENCES</p>
              <h3>Appearance</h3>
            </div>
            <Palette size={16} />
          </div>
          <div className="toggle-row">
            <div>
              <strong>Theme</strong>
              <small>Switch between light and dark surfaces.</small>
            </div>
            <button type="button" className="toggle-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <span className={`toggle-knob ${theme === 'dark' ? 'is-on' : ''}`} />
              <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
            </button>
          </div>
          <div className="toggle-row">
            <div>
              <strong>Language</strong>
              <small>English</small>
            </div>
            <span className="muted-tag">EN</span>
          </div>
        </div>

        <div className="panel-card settings-card settings-wide">
          <div className="panel-header">
            <div>
              <p className="eyebrow">NOTIFICATIONS</p>
              <h3>Delivery preferences</h3>
            </div>
            <BellRing size={16} />
          </div>
          <div className="settings-toggle-stack">
            {[
              ['application', 'Application notifications'],
              ['lease', 'Lease notifications'],
              ['payment', 'Payment notifications'],
              ['maintenance', 'Maintenance notifications'],
            ].map(([key, label]) => (
              <label key={key} className="toggle-row switch-row">
                <div>
                  <strong>{label}</strong>
                </div>
                <input type="checkbox" checked={notificationState[key]} onChange={() => handleToggle(key)} />
              </label>
            ))}
          </div>
        </div>

        <div className="panel-card settings-card settings-wide">
          <div className="panel-header">
            <div>
              <p className="eyebrow">SECURITY</p>
              <h3>Change password</h3>
            </div>
            <KeyRound size={16} />
          </div>
          <form className="password-form" onSubmit={handlePasswordChange}>
            <label className="field-group">
              <span>Current password</span>
              <input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>New password</span>
              <input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>Confirm new password</span>
              <input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
            </label>
            {passwordState.message ? (
              <p className={`profile-save-message ${passwordState.status === 'error' ? 'is-error' : 'is-success'}`}>
                {passwordState.message}
              </p>
            ) : null}
            <div className="form-actions">
              <button className="primary-button" type="submit">
                <ShieldCheck size={15} /> Update password
              </button>
            </div>
          </form>
        </div>

        <div className="panel-card settings-card settings-wide">
          <div className="panel-header">
            <div>
              <p className="eyebrow">SESSION</p>
              <h3>Sign out controls</h3>
            </div>
            <Moon size={16} />
          </div>
          <p className="settings-note">Use the existing sign-out controls in the top bar to end the current session.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
