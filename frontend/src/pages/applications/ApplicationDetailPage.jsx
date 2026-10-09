import { useState } from 'react';
import { ArrowLeft, ArrowUpRight, FileText, MapPin } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRentalData } from '../../context/ApplicationContext';
import { useProperties } from '../../context/PropertyContext';
import { roleNavigation } from '../../data/mockData';
import DashboardLayout from '../../layouts/DashboardLayout';
import EmptyState from '../../components/properties/EmptyState';
import ApplicationReviewModal from '../../components/applications/ApplicationReviewModal';
import ApplicationStatusBadge from '../../components/applications/ApplicationStatusBadge';

const currency = (amount) => `₦${new Intl.NumberFormat('en-NG').format(amount || 0)}`;

export default function ApplicationDetailPage({ tenantView = false }) {
  const { id } = useParams();
  const { user } = useAuth();
  const { applications, loading, error, updateApplicationStatus, approveApplication } = useRentalData();
  const { properties } = useProperties();
  const location = useLocation();
  const [mode, setMode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [actionError, setActionError] = useState('');
  const application = applications.find((item) => item.id === id);
  const property = application
    ? properties.find((item) => item.id === application.propertyId) || application.propertyDetails
    : null;
  const canAct = !tenantView && ['Pending', 'Under Review'].includes(application?.status);
  const belongsToTenant = application?.applicantEmail?.toLowerCase() === user.email.toLowerCase();

  async function confirmAction(reason) {
    setSubmitting(true);
    setActionError('');
    try {
      if (mode === 'approve') {
        await approveApplication(id);
        setNotice('Application approved. No tenant record or lease was created.');
      } else {
        await updateApplicationStatus(id, 'Rejected', { rejectionReason: reason });
        setNotice('Application rejected. The reason has been saved.');
      }
      setMode('');
    } catch (reviewError) {
      setActionError(reviewError.message || 'Unable to update this application.');
      setMode('');
    } finally {
      setSubmitting(false);
    }
  }

  async function markUnderReview() {
    setSubmitting(true);
    setActionError('');
    try {
      await updateApplicationStatus(id, 'Under Review');
      setNotice('Application marked under review.');
    } catch (reviewError) {
      setActionError(reviewError.message || 'Unable to update this application.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout user={user} title="Application details" subtitle={application?.id || 'Rental application'} navItems={roleNavigation[user.role]}>
      {loading ? (
        <div className="property-loading-state">Loading applications...</div>
      ) : error ? (
        <div className="form-message error-message" role="alert">Unable to load applications.</div>
      ) : !application || (tenantView && !belongsToTenant) ? (
        <EmptyState title="Application not found." detail="This application is not available for this account." action={<Link className="secondary-link" to={tenantView ? '/my-applications' : '/applications'}>Back to applications</Link>} />
      ) : (
        <div className="application-detail-page">
          {notice && <div className="form-message success-message" role="status">{notice}</div>}
          {actionError && <div className="form-message error-message" role="alert">{actionError}</div>}
          <div className="application-detail-heading">
            <div><p className="eyebrow">RENTAL APPLICATION · {application.id}</p><h2>{tenantView ? application.property : application.applicant}</h2><p>{tenantView ? 'Your application and review progress.' : `Application for ${application.property}`}</p></div>
            <ApplicationStatusBadge status={application.status} />
          </div>

          {application.status === 'Approved' && tenantView && (
            <section className="application-approved-callout"><strong>Application Approved</strong><p>Your next step will be lease creation. No lease has been created yet.</p>{property && <Link to={`/properties/${property.id}`}>View your property <ArrowUpRight size={15} /></Link>}</section>
          )}
          {application.status === 'Rejected' && tenantView && application.rejectionReason && <div className="form-message error-message"><strong>Review note:</strong> {application.rejectionReason}</div>}

          <div className="panel-grid two-col application-detail-grid">
            <section className="panel-card">
              <div className="panel-header"><div><p className="eyebrow">APPLICANT</p><h3>Applicant information</h3></div></div>
              <div className="mini-list">
                <div><span>Full name</span><strong>{application.applicant}</strong></div>
                <div><span>Email</span><strong>{application.applicantEmail}</strong></div>
                <div><span>Phone</span><strong>{application.applicantPhone}</strong></div>
                {!tenantView && <div><span>Date of birth</span><strong>{application.dateOfBirth}</strong></div>}
                <div><span>Employment status</span><strong>{application.employmentStatus || application.employment}</strong></div>
                {!tenantView && <div><span>Employer</span><strong>{application.employer}</strong></div>}
                {!tenantView && <div><span>Job title</span><strong>{application.jobTitle}</strong></div>}
                <div><span>Monthly income</span><strong>{currency(application.income)}</strong></div>
              </div>
            </section>

            <section className="panel-card">
              <div className="panel-header"><div><p className="eyebrow">PROPERTY</p><h3>Requested home</h3></div></div>
              {property ? (
                <div className="application-property-summary">
                  <img src={property.images?.[0] || property.image} alt={property.name} />
                  <div><strong>{property.name}</strong><span><MapPin size={14} /> {property.location}</span><small>{currency(property.monthlyRent)} / month · {property.bedrooms} beds · {property.bathrooms} baths</small><Link to={`/properties/${property.id}`}>View property</Link></div>
                </div>
              ) : <p className="property-muted">The requested property is no longer listed.</p>}
            </section>

            <section className="panel-card">
              <div className="panel-header"><div><p className="eyebrow">APPLICATION</p><h3>Submission information</h3></div></div>
              <div className="mini-list">
                <div><span>Application ID</span><strong>{application.id}</strong></div>
                <div><span>Submission date</span><strong>{application.date}</strong></div>
                <div><span>Last updated</span><strong>{application.lastUpdated || application.date}</strong></div>
                <div><span>Status</span><strong>{application.status}</strong></div>
                <div><span>Preferred move-in</span><strong>{application.moveInDate}</strong></div>
                <div><span>Number of occupants</span><strong>{application.occupants}</strong></div>
                {!tenantView && <div><span>Current address</span><strong>{application.currentAddress}</strong></div>}
              </div>
              {application.additionalInfo && <p className="application-notes">{application.additionalInfo}</p>}
              {application.status === 'Rejected' && !tenantView && application.rejectionReason && <p className="application-notes"><strong>Rejection reason:</strong> {application.rejectionReason}</p>}
            </section>

            <section className="panel-card">
              <div className="panel-header"><div><p className="eyebrow">DOCUMENTS</p><h3>Supporting documents</h3></div></div>
              <div className="application-document-list">{(application.documents || []).map((document, index) => <div key={`${document}-${index}`}><FileText size={16} /><span>{document}</span><small>Mock record</small></div>)}</div>
            </section>
          </div>

          {canAct && (
            <div className="application-review-actions">
              <Link className="secondary-link" to="/applications"><ArrowLeft size={15} /> Back to queue</Link>
              <div>
                {application.status === 'Pending' && <button type="button" className="toolbar-button" onClick={markUnderReview} disabled={submitting}>Mark under review</button>}
                <button type="button" className="danger-button" onClick={() => setMode('reject')} disabled={submitting}>Reject</button>
                <button type="button" className="primary-button" onClick={() => setMode('approve')} disabled={submitting || property?.status !== 'Available'}>Approve</button>
              </div>
              {property && property.status !== 'Available' && <p className="property-muted">This property is no longer available, so this application cannot be approved.</p>}
            </div>
          )}
          {application.status === 'Approved' && !tenantView && application.tenantId && <Link className="secondary-link" to={`/tenants/${application.tenantId}`}>View tenant record <ArrowUpRight size={15} /></Link>}
          <ApplicationReviewModal mode={mode} application={application} submitting={submitting} onCancel={() => setMode('')} onConfirm={confirmAction} />
        </div>
      )}
    </DashboardLayout>
  );
}
