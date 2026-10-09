import { useState } from 'react';
import { ArrowRight, FileText, MapPin } from 'lucide-react';

const employmentOptions = ['Full-time', 'Part-time', 'Self-employed', 'Contract', 'Unemployed'];
const documentsToRequest = ['Government ID', 'Proof of income', 'Employment letter'];

export default function RentalApplicationForm({ user, properties, selectedPropertyId, onSubmit, submitting }) {
  const [form, setForm] = useState({
    applicant: user?.name || '',
    applicantEmail: user?.email || '',
    applicantPhone: user?.phone || '',
    dateOfBirth: '',
    employmentStatus: '',
    employer: '',
    jobTitle: '',
    income: '',
    propertyId: selectedPropertyId || '',
    moveInDate: '',
    occupants: 1,
    currentAddress: '',
    additionalInfo: '',
  });
  const [documents, setDocuments] = useState({});
  const [error, setError] = useState('');
  const property = properties.find((item) => item.id === form.propertyId);

  function change(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError('');
  }

  function submit(event) {
    event.preventDefault();
    const requiredValues = [form.applicant, form.applicantEmail, form.applicantPhone, form.dateOfBirth, form.employmentStatus, form.employer, form.jobTitle, form.income, form.propertyId, form.moveInDate, form.occupants, form.currentAddress];
    if (requiredValues.some((value) => String(value).trim() === '')) {
      setError('Complete all required fields before submitting.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.applicantEmail.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (!/^\+?[0-9 ()-]{7,20}$/.test(form.applicantPhone.trim())) {
      setError('Enter a valid phone number.');
      return;
    }
    if (!Number.isFinite(Number(form.income)) || Number(form.income) <= 0) {
      setError('Monthly income must be greater than zero.');
      return;
    }
    if (!Number.isInteger(Number(form.occupants)) || Number(form.occupants) < 1) {
      setError('Number of occupants must be a positive whole number.');
      return;
    }
    if (Number.isNaN(Date.parse(form.dateOfBirth)) || new Date(form.dateOfBirth) >= new Date()) {
      setError('Enter a valid date of birth in the past.');
      return;
    }
    if (Number.isNaN(Date.parse(form.moveInDate))) {
      setError('Choose a valid preferred move-in date.');
      return;
    }
    if (!property || property.status !== 'Available') {
      setError('Select a property that is still available.');
      return;
    }

    onSubmit({
      ...form,
      applicant: form.applicant.trim(),
      applicantEmail: form.applicantEmail.trim().toLowerCase(),
      applicantPhone: form.applicantPhone.trim(),
      income: Number(form.income),
      occupants: Number(form.occupants),
      employment: form.employmentStatus,
      documents: documentsToRequest.map((label) => `${label}${documents[label] ? ` · ${documents[label]}` : ' · Awaiting upload'}`),
    });
  }

  return (
    <form className="rental-application-form" onSubmit={submit} noValidate>
      <section className="panel-card rental-form-section">
        <div className="property-form-heading"><span>01</span><div><p className="eyebrow">PERSONAL INFORMATION</p><h2>About you</h2></div></div>
        <div className="property-form-grid">
          <label className="field-group"><span>Full name *</span><input name="applicant" value={form.applicant} onChange={change} /></label>
          <label className="field-group"><span>Email *</span><input name="applicantEmail" type="email" value={form.applicantEmail} onChange={change} /></label>
          <label className="field-group"><span>Phone *</span><input name="applicantPhone" type="tel" value={form.applicantPhone} onChange={change} /></label>
          <label className="field-group"><span>Date of birth *</span><input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={change} /></label>
        </div>
      </section>

      <section className="panel-card rental-form-section">
        <div className="property-form-heading"><span>02</span><div><p className="eyebrow">EMPLOYMENT INFORMATION</p><h2>Your work</h2></div></div>
        <div className="property-form-grid">
          <label className="field-group"><span>Employment status *</span><select name="employmentStatus" value={form.employmentStatus} onChange={change}><option value="">Choose status</option>{employmentOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="field-group"><span>Employer *</span><input name="employer" value={form.employer} onChange={change} /></label>
          <label className="field-group"><span>Job title *</span><input name="jobTitle" value={form.jobTitle} onChange={change} /></label>
          <label className="field-group"><span>Monthly income (₦) *</span><input name="income" type="number" min="1" step="1000" value={form.income} onChange={change} /></label>
        </div>
      </section>

      <section className="panel-card rental-form-section">
        <div className="property-form-heading"><span>03</span><div><p className="eyebrow">RENTAL INFORMATION</p><h2>Where you’d like to live</h2></div></div>
        <div className="property-form-grid">
          <label className="field-group full-field"><span>Selected property *</span><select name="propertyId" value={form.propertyId} onChange={change}><option value="">Choose an available property</option>{properties.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.location}</option>)}</select></label>
          {property && <div className="application-selected-property"><img src={property.images?.[0] || property.image} alt={property.name} /><div><strong>{property.name}</strong><span><MapPin size={13} /> {property.location}</span><small>₦{new Intl.NumberFormat('en-NG').format(property.monthlyRent)} / month</small></div></div>}
          <label className="field-group"><span>Preferred move-in date *</span><input name="moveInDate" type="date" value={form.moveInDate} onChange={change} /></label>
          <label className="field-group"><span>Number of occupants *</span><input name="occupants" type="number" min="1" step="1" value={form.occupants} onChange={change} /></label>
        </div>
      </section>

      <section className="panel-card rental-form-section">
        <div className="property-form-heading"><span>04</span><div><p className="eyebrow">ADDITIONAL INFORMATION</p><h2>A little more context</h2></div></div>
        <div className="property-form-grid">
          <label className="field-group full-field"><span>Current address *</span><input name="currentAddress" value={form.currentAddress} onChange={change} /></label>
          <label className="field-group full-field"><span>Additional notes</span><textarea name="additionalInfo" rows="4" value={form.additionalInfo} onChange={change} placeholder="Anything else you’d like the property manager to know." /></label>
        </div>
      </section>

      <section className="panel-card rental-form-section">
        <div className="property-form-heading"><span>05</span><div><p className="eyebrow">DOCUMENTS</p><h2>Supporting documents</h2></div></div>
        <p className="property-muted">Document selections are a frontend mock only and are not uploaded.</p>
        <div className="application-document-inputs">
          {documentsToRequest.map((label) => (
            <label className="document-upload-row" key={label}><FileText size={17} /><span><strong>{label}</strong><small>{documents[label] || 'Choose a file, optional for this demo'}</small></span><input type="file" onChange={(event) => setDocuments((current) => ({ ...current, [label]: event.target.files?.[0]?.name || '' }))} /></label>
          ))}
        </div>
      </section>

      {error && <div className="form-message error-message" role="alert">{error}</div>}
      <div className="property-form-actions"><button type="submit" className="primary-button" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit application'} <ArrowRight size={15} /></button></div>
    </form>
  );
}
