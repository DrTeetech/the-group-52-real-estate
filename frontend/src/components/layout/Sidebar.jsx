import { useEffect, useRef } from 'react';
import {
  ArrowUpRight,
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  Home,
  LifeBuoy,
  Settings,
  User,
  Users,
  X,
  BriefcaseBusiness,
  BarChart3,
  FolderKanban,
} from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { roleLabel } from '../../data/roles';

const defaultItems = [
  { label: 'Overview', icon: Home, to: '/dashboard' },
  { label: 'Properties', icon: Building2, to: '/properties' },
  { label: 'Applications', icon: ClipboardList, to: '/applications' },
  { label: 'Tenants', icon: Users, to: '/dashboard/manager/tenants' },
  { label: 'Leases', icon: FileText, to: '/leases' },
  { label: 'Payments', icon: CreditCard, to: '/payments' },
  { label: 'Maintenance', icon: LifeBuoy, to: '/maintenance' },
  { label: 'Notifications', icon: Bell, to: '/notifications' },
  { label: 'Reports', icon: BarChart3, to: '/reports' },
  { label: 'Settings', icon: Settings, to: '/settings' },
];

const iconMap = {
  home: Home,
  building: Building2,
  file: FileText,
  credit: CreditCard,
  tool: LifeBuoy,
  clipboard: ClipboardList,
  bell: Bell,
  user: User,
  users: Users,
  settings: Settings,
  chart: BarChart3,
  docs: FolderKanban,
  briefcase: BriefcaseBusiness,
};

export default function Sidebar({ open, onClose, onEscape, items = defaultItems, user, onLogout }) {
  const profileLabel = roleLabel(user?.role);
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (open) sidebarRef.current?.querySelector('.sidebar-close')?.focus();
  }, [open]);

  function handleKeyDown(event) {
    if (event.key === 'Escape' && open) {
      onEscape?.();
      return;
    }

    if (event.key !== 'Tab' || !open) return;
    const focusable = [...sidebarRef.current.querySelectorAll('a[href], button:not([disabled])')];
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      <button
        className={`drawer-scrim${open ? ' is-visible' : ''}`}
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
      />
      <aside ref={sidebarRef} id="workspace-sidebar" className={`sidebar${open ? ' is-open' : ''}`} aria-label="Main navigation" onKeyDown={handleKeyDown}>
        <div className="sidebar-brand-row">
          <Link className="brand sidebar-brand" to="/" onClick={onClose}>
            <span className="brand-mark">k.</span>
            <span>keyhouse</span>
          </Link>
          <button className="icon-button sidebar-close" type="button" aria-label="Close menu" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        <p className="sidebar-label">WORKSPACE</p>
        <nav className="sidebar-nav">
          {items.map(({ label, icon, to, active, end = true }) => {
            const Icon = iconMap[icon] || Home;
            return to ? (
              <NavLink key={label} to={to} end={end} className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`} onClick={onClose}>
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
              </NavLink>
            ) : (
              <span key={label} className="sidebar-link is-disabled" title="Available in a later phase">
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
                <span className="soon-dot" />
              </span>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon"><LifeBuoy size={17} /></span>
            <div><strong>Need a hand?</strong><span>We’re here to help.</span></div>
            <ArrowUpRight size={15} />
          </div>
          <div className="sidebar-profile">
            <div className="avatar avatar-small">{user?.avatar || 'KO'}</div>
            <div className="profile-copy"><strong>{user?.name || 'Guest User'}</strong><span>{profileLabel}</span></div>
            {onLogout ? (
              <button type="button" className="profile-more" onClick={onLogout} aria-label="Logout">↗</button>
            ) : (
              <span className="profile-more">···</span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

