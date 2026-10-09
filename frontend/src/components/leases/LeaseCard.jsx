import { ArrowUpRight, CalendarDays, Pencil, RefreshCw, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import LeaseStatusBadge from './LeaseStatusBadge';

const currency = (amount) => `₦${new Intl.NumberFormat('en-NG').format(amount || 0)}`;

export default function LeaseCard({ lease, tenant, property, status, canManage, onRenew, onTerminate }) {
  return (
    <article className="rental-record-card lease-record-card">
      <div className="rental-record-topline"><span className="record-id">{lease.id}</span><LeaseStatusBadge status={status} /></div>
      <h2>{tenant?.name || lease.tenantName || 'Tenant record unavailable'}</h2>
      <p className="record-subtitle">{property?.name || lease.propertyName || 'Property record unavailable'}</p>
      <div className="rental-record-facts">
        <span><CalendarDays size={14} /> {lease.startDate} – {lease.endDate}</span>
        <span>{currency(lease.monthlyRent)} / month</span>
      </div>
      <div className="lease-card-actions">
        <Link className="secondary-link" to={`/leases/${lease.id}`}>View details <ArrowUpRight size={15} /></Link>
        {canManage && <Link className="toolbar-button" to={`/leases/${lease.id}/edit`} aria-label={`Edit lease ${lease.id}`}><Pencil size={14} /> Edit</Link>}
        {canManage && !['Draft', 'Terminated'].includes(status) && <button type="button" className="toolbar-button" onClick={() => onRenew(lease)} aria-label={`Renew lease ${lease.id}`}><RefreshCw size={14} /> Renew</button>}
        {canManage && status === 'Active' && <button type="button" className="toolbar-button delete-action" onClick={() => onTerminate(lease)} aria-label={`Terminate lease ${lease.id}`}><XCircle size={14} /> Terminate</button>}
      </div>
    </article>
  );
}
