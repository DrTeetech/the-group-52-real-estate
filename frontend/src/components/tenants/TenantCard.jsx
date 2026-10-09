import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import TenantStatusBadge from './TenantStatusBadge';

const currency = (amount) => `₦${new Intl.NumberFormat('en-NG').format(amount || 0)}`;

export default function TenantCard({ tenant }) {
  return (
    <article className="rental-record-card tenant-record-card">
      <div className="rental-record-topline"><span className="tenant-initials">{tenant.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><TenantStatusBadge status={tenant.status} /></div>
      <h2>{tenant.name}</h2>
      <p className="tenant-contact-line"><Mail size={14} /> {tenant.email}</p>
      <p className="tenant-contact-line"><Phone size={14} /> {tenant.phone}</p>
      <p className="tenant-contact-line"><MapPin size={14} /> {tenant.property}</p>
      <div className="tenant-record-meta"><span>{currency(tenant.monthlyRent)} / month</span><TenantStatusBadge status={tenant.leaseStatus} /><TenantStatusBadge status={tenant.paymentStatus} /></div>
      <Link className="secondary-link" to={`/tenants/${tenant.id}`}>View tenant <ArrowUpRight size={15} /></Link>
    </article>
  );
}
