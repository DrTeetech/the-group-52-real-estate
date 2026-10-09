import { useEffect, useMemo, useState } from 'react';
import { Mail, MapPin, PencilLine, Phone, ShieldCheck, UserRound } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { roleNavigation } from '../../data/mockData.js';
import { roleLabel } from '../../data/roles.js';

export default function ProfilePage() {
  const { user, updateCurrentUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    location: user?.location || '',
    company: user?.company || '',
  });
  const [saveState, setSaveState] = useState({ status: 'idle', message: '' });

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      location: user.location || '',
      company: user.company || '',
    });
  }, [user]);

  const initials = useMemo(() => {
    return (user?.name || 'KO')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'KO';
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const cleanName = form.name.trim();
    const cleanPhone = form.phone.trim();

    if (!cleanName) {
      setSaveState({ status: 'error', message: 'Please add your full name.' });
      return;
    }

    if (cleanPhone && !/^[0-9+()\-\s]+$/.test(cleanPhone)) {
      setSaveState({ status: 'error', message: 'Please enter a valid phone number.' });
      return;
    }

    updateCurrentUser({
      name: cleanName,
      phone: cleanPhone,
      location: form.location.trim(),
      company: form.company.trim(),
      avatar: initials,
    });

    setSaveState({ status: 'success', message: 'Profile updated in the frontend mock state.' });
  };

  const navItems = user ? roleNavigation[user.role] || roleNavigation.ADMIN : roleNavigation.ADMIN;

  return (
    <DashboardLayout user={user} title="Profile" subtitle="Account overview" navItems={navItems}>
      <div className="profile-page-grid">
        <div className="panel-card profile-summary-card">
          <div className="profile-avatar-block">
            <div className="avatar avatar-xl">{initials}</div>
            <div>
              <p className="eyebrow">PROFILE</p>
              <h3>{user?.name || 'User profile'}</h3>
              <p>{roleLabel(user?.role)}</p>
            </div>
          </div>
          <div className="profile-meta-list">
            <div><Mail size={15} /><span>{user?.email}</span></div>
            <div><Phone size={15} /><span>{user?.phone || 'No phone number saved'}</span></div>
            <div><MapPin size={15} /><span>{user?.location || 'Location not provided'}</span></div>
            <div><ShieldCheck size={15} /><span>{user?.company || 'Keyhouse account'}</span></div>
          </div>
        </div>

        <form className="panel-card profile-form-card" onSubmit={handleSubmit}>
          <div className="panel-header with-actions">
            <div>
              <p className="eyebrow">EDIT PROFILE</p>
              <h3>Account details</h3>
            </div>
            <span className="muted-tag">Session saved</span>
          </div>

          <div className="form-grid">
            <label className="field-group">
              <span>Full name</span>
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Full name" />
            </label>
            <label className="field-group">
              <span>Email address</span>
              <input type="email" value={user?.email || ''} readOnly disabled />
            </label>
            <label className="field-group">
              <span>Phone number</span>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" />
            </label>
            <label className="field-group">
              <span>Location</span>
              <input type="text" name="location" value={form.location} onChange={handleChange} placeholder="Location" />
            </label>
            <label className="field-group span-two">
              <span>Company / team</span>
              <input type="text" name="company" value={form.company} onChange={handleChange} placeholder="Company or team" />
            </label>
          </div>

          {saveState.message ? (
            <p className={`profile-save-message ${saveState.status === 'error' ? 'is-error' : 'is-success'}`}>
              {saveState.message}
            </p>
          ) : null}

          <div className="form-actions">
            <button type="submit" className="primary-button">
              <PencilLine size={15} /> Save changes
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
