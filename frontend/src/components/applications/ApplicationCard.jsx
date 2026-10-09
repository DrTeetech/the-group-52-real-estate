import { ArrowUpRight, CalendarDays, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import ApplicationStatusBadge from './ApplicationStatusBadge';

const currency = (amount) => `₦${new Intl.NumberFormat('en-NG').format(amount || 0)}`;

export default function ApplicationCard({ application, tenantView = false, detailPath }) {
  return (
    <article className="rental-record-card">
      <div className="rental-record-topline"><span className="record-id">{application.id}</span><ApplicationStatusBadge status={application.status} /></div>
      <h2>{tenantView ? application.property : application.applicant}</h2>
      <p className="record-subtitle">{tenantView ? application.location : application.property}</p>
      <div className="rental-record-facts">
        <span><CalendarDays size={14} /> {application.date}</span>
        <span><UserRound size={14} /> {tenantView ? currency(application.propertyRent) : application.employmentStatus || application.employment}</span>
        {!tenantView && <span>Income {currency(application.income)} / month</span>}
        {tenantView && <span>Updated {application.lastUpdated || application.date}</span>}
      </div>
      <Link className="secondary-link" to={detailPath || `/applications/${application.id}`}>{tenantView ? 'View details' : 'Review application'} <ArrowUpRight size={15} /></Link>
    </article>
  );
}
