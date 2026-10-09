import { ImagePlus, X } from 'lucide-react';
import { useState } from 'react';

const propertyTypes = ['Apartment', 'House', 'Duplex', 'Villa', 'Studio', 'Commercial'];
const propertyStatuses = ['Available', 'Occupied', 'Maintenance', 'Unlisted'];
const amenityOptions = ['Parking', 'Security', 'Water', 'Electricity', 'Kitchen', 'Air conditioning', 'Internet', 'Generator', 'Gym', 'Pool', 'Laundry', 'Balcony', 'Concierge', 'Backup Power'];
const fallbackImage = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80';

function getInitialForm(property) {
  return {
    name: property?.name || '',
    type: property?.type || 'Apartment',
    description: property?.description || '',
    address: property?.address || '',
    city: property?.city || '',
    state: property?.state || '',
    country: property?.country || 'Nigeria',
    bedrooms: property?.bedrooms ?? 1,
    bathrooms: property?.bathrooms ?? 1,
    squareFootage: property?.squareFootage ?? '',
    monthlyRent: property?.monthlyRent ?? '',
    securityDeposit: property?.securityDeposit ?? '',
    status: property?.status === 'Vacant' ? 'Available' : property?.status || 'Available',
    amenities: property?.amenities || [],
    units: property?.units || 1,
  };
}

export default function PropertyForm({ property, onSubmit, submitting, submitLabel }) {
  const [form, setForm] = useState(() => getInitialForm(property));
  const [imagePreview, setImagePreview] = useState(property?.images?.[0] || property?.image || '');
  const [error, setError] = useState('');

  function change(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  }

  function toggleAmenity(amenity) {
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }));
  }

  function handleImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Choose an image smaller than 5 MB.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(String(reader.result));
      setError('');
    };
    reader.onerror = () => setError('Unable to preview this image.');
    reader.readAsDataURL(file);
  }

  async function submit(event) {
    event.preventDefault();
    const requiredValues = [form.name, form.description, form.address, form.city, form.state, form.country, form.squareFootage, form.monthlyRent, form.securityDeposit];
    if (requiredValues.some((value) => !String(value).trim())) {
      setError('Complete all required property and location fields.');
      return;
    }

    const monthlyRent = Number(form.monthlyRent);
    const securityDeposit = Number(form.securityDeposit);
    const bedrooms = Number(form.bedrooms);
    const bathrooms = Number(form.bathrooms);
    const squareFootage = Number(form.squareFootage);
    if (!Number.isFinite(monthlyRent) || monthlyRent <= 0) {
      setError('Monthly rent must be a number greater than zero.');
      return;
    }
    if (!Number.isFinite(securityDeposit) || securityDeposit < 0) {
      setError('Security deposit must be a valid non-negative amount.');
      return;
    }
    if (![bedrooms, bathrooms, squareFootage].every((value) => Number.isFinite(value) && value >= 0) || squareFootage === 0) {
      setError('Bedrooms, bathrooms, and square footage must be valid non-negative numbers.');
      return;
    }

    await onSubmit({
      ...form,
      location: `${form.city}, ${form.state}`,
      bedrooms,
      bathrooms,
      squareFootage,
      monthlyRent,
      securityDeposit,
      occupancy: form.status === 'Occupied' ? property?.occupancy || 100 : 0,
      tenant: form.status === 'Occupied' ? property?.tenant || null : null,
      lease: form.status === 'Occupied' ? property?.lease || null : null,
      images: imagePreview ? [imagePreview] : [],
      image: imagePreview || fallbackImage,
    });
  }

  return (
    <form className="property-form" onSubmit={submit} noValidate>
      <section className="panel-card property-form-section">
        <div className="property-form-heading"><span>01</span><div><p className="eyebrow">THE BASICS</p><h2>Property information</h2></div></div>
        <div className="property-form-grid">
          <label className="field-group"><span>Property name *</span><input name="name" value={form.name} onChange={change} placeholder="e.g. Palmview Residence" /></label>
          <label className="field-group"><span>Property type *</span><select name="type" value={form.type} onChange={change}>{propertyTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label className="field-group full-field"><span>Description *</span><textarea name="description" rows="4" value={form.description} onChange={change} placeholder="Describe the property and what makes it distinctive." /></label>
        </div>
      </section>

      <section className="panel-card property-form-section">
        <div className="property-form-heading"><span>02</span><div><p className="eyebrow">THE ADDRESS</p><h2>Location</h2></div></div>
        <div className="property-form-grid">
          <label className="field-group full-field"><span>Street address *</span><input name="address" value={form.address} onChange={change} placeholder="House number and street" /></label>
          <label className="field-group"><span>City *</span><input name="city" value={form.city} onChange={change} placeholder="Lagos" /></label>
          <label className="field-group"><span>State *</span><input name="state" value={form.state} onChange={change} placeholder="Lagos" /></label>
          <label className="field-group"><span>Country *</span><input name="country" value={form.country} onChange={change} /></label>
        </div>
      </section>

      <section className="panel-card property-form-section">
        <div className="property-form-heading"><span>03</span><div><p className="eyebrow">THE DETAILS</p><h2>Size and availability</h2></div></div>
        <div className="property-form-grid property-form-grid-four">
          <label className="field-group"><span>Bedrooms</span><input name="bedrooms" type="number" min="0" step="1" value={form.bedrooms} onChange={change} /></label>
          <label className="field-group"><span>Bathrooms</span><input name="bathrooms" type="number" min="0" step="1" value={form.bathrooms} onChange={change} /></label>
          <label className="field-group"><span>Square footage *</span><input name="squareFootage" type="number" min="1" step="1" value={form.squareFootage} onChange={change} placeholder="e.g. 1200" /></label>
          <label className="field-group"><span>Status *</span><select name="status" value={form.status} onChange={change}>{propertyStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        </div>
      </section>

      <section className="panel-card property-form-section">
        <div className="property-form-heading"><span>04</span><div><p className="eyebrow">THE NUMBERS</p><h2>Rental terms</h2></div></div>
        <div className="property-form-grid">
          <label className="field-group"><span>Monthly rent (₦) *</span><input name="monthlyRent" type="number" min="1" step="1000" value={form.monthlyRent} onChange={change} placeholder="1,200,000" /></label>
          <label className="field-group"><span>Security deposit (₦) *</span><input name="securityDeposit" type="number" min="0" step="1000" value={form.securityDeposit} onChange={change} placeholder="2,400,000" /></label>
        </div>
      </section>

      <section className="panel-card property-form-section">
        <div className="property-form-heading"><span>05</span><div><p className="eyebrow">WHAT'S INCLUDED</p><h2>Amenities</h2></div></div>
        <div className="amenity-checkbox-grid">
          {amenityOptions.map((amenity) => (
            <label key={amenity} className="amenity-checkbox">
              <input type="checkbox" checked={form.amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} />
              <span>{amenity}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="panel-card property-form-section">
        <div className="property-form-heading"><span>06</span><div><p className="eyebrow">FIRST IMPRESSION</p><h2>Property image</h2></div></div>
        <label className="image-upload-control">
          <ImagePlus size={20} />
          <span><strong>Choose an image</strong><small>Preview only; files are not uploaded to a server.</small></span>
          <input type="file" accept="image/*" onChange={handleImage} />
        </label>
        {imagePreview && <div className="property-image-preview"><img src={imagePreview} alt="Property preview" /><button type="button" className="icon-button" aria-label="Remove image" onClick={() => setImagePreview('')}><X size={16} /></button></div>}
      </section>

      {error && <div className="form-message error-message" role="alert">{error}</div>}
      <div className="property-form-actions">
        <button type="submit" className="primary-button" disabled={submitting}>{submitting ? 'Saving property…' : submitLabel}</button>
      </div>
    </form>
  );
}
