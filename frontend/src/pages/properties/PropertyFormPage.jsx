import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProperties } from '../../context/PropertyContext';
import { roleNavigation } from '../../data/mockData';
import DashboardLayout from '../../layouts/DashboardLayout';
import EmptyState from '../../components/properties/EmptyState';
import PropertyForm from '../../components/properties/PropertyForm';

export default function PropertyFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { user } = useAuth();
  const { properties, loading, error, addProperty, updateProperty } = useProperties();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const property = isEditing ? properties.find((item) => item.id === id) : null;

  async function saveProperty(values) {
    setSubmitting(true);
    setSubmitError('');
    try {
      const saved = isEditing ? await updateProperty(id, values) : await addProperty(values);
      navigate(`/properties/${saved.id}`, {
        replace: true,
        state: { notice: isEditing ? 'Property changes saved.' : 'Property added to your portfolio.' },
      });
    } catch {
      setSubmitError('Unable to save this property. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout
      user={user}
      title={isEditing ? 'Edit property' : 'Add property'}
      subtitle="Portfolio"
      navItems={roleNavigation[user.role]}
    >
      <div className="property-form-page-heading">
        <div>
          <p className="eyebrow">{isEditing ? 'UPDATE LISTING' : 'NEW LISTING'}</p>
          <h2>{isEditing ? property?.name || 'Property details' : 'Give a good place its details.'}</h2>
          <p>{isEditing ? 'Keep the listing accurate for everyone who relies on it.' : 'Add the information your team and future tenants need.'}</p>
        </div>
        <Link className="secondary-link" to="/properties"><ArrowLeft size={15} /> Back to properties</Link>
      </div>

      {loading ? (
        <div className="property-loading-state">Loading properties...</div>
      ) : error ? (
        <div className="form-message error-message" role="alert">Unable to load properties.</div>
      ) : isEditing && !property ? (
        <EmptyState title="Property not found." detail="It may have been deleted or is no longer available." action={<Link className="secondary-link" to="/properties">Back to properties</Link>} />
      ) : (
        <>
          {submitError && <div className="form-message error-message" role="alert">{submitError}</div>}
          <PropertyForm property={property} onSubmit={saveProperty} submitting={submitting} submitLabel={isEditing ? 'Save changes' : 'Add property'} />
        </>
      )}
    </DashboardLayout>
  );
}
