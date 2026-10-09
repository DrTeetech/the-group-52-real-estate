import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProperties } from '../../context/PropertyContext';
import { useRentalData } from '../../context/ApplicationContext';
import { roleNavigation } from '../../data/mockData';
import DashboardLayout from '../../layouts/DashboardLayout';
import EmptyState from '../../components/properties/EmptyState';
import RentalApplicationForm from '../../components/applications/RentalApplicationForm';

export default function ApplicationFormPage() {
  const { user } = useAuth();
  const { properties, loading: propertiesLoading } = useProperties();
  const { submitApplication } = useRentalData();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const availableProperties = properties.filter((property) => property.status === 'Available');

  async function submit(values) {
    setSubmitting(true);
    setError('');
    try {
      const application = await submitApplication(values);
      navigate(`/my-applications/${application.id}`, { replace: true, state: { notice: 'Your application was submitted.' } });
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit your application.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout user={user} title="Rental application" subtitle="Apply for a home" navItems={roleNavigation[user.role]}>
      <div className="property-form-page-heading">
        <div><p className="eyebrow">A GOOD PLACE TO BEGIN</p><h2>Tell us a little about yourself.</h2><p>Your application is shared with the property team for review.</p></div>
        <Link className="secondary-link" to="/properties"><ArrowLeft size={15} /> Browse properties</Link>
      </div>
      {error && <div className="form-message error-message" role="alert">{error}</div>}
      {propertiesLoading ? (
        <div className="property-loading-state">Loading properties...</div>
      ) : availableProperties.length === 0 ? (
        <EmptyState title="No available properties." detail="There are no listings accepting applications right now." action={<Link className="secondary-link" to="/properties">Browse properties</Link>} />
      ) : (
        <RentalApplicationForm user={user} properties={availableProperties} selectedPropertyId={searchParams.get('propertyId')} onSubmit={submit} submitting={submitting} />
      )}
    </DashboardLayout>
  );
}
