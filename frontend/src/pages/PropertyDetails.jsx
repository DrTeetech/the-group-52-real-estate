import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getPropertyImage } from "../utils/propertyImages";

export default function PropertyDetails() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [inquiry, setInquiry] = useState("");
  const [viewing, setViewing] = useState({ scheduledFor: "", type: "physical", notes: "" });
  const [application, setApplication] = useState({
    employmentStatus: "employed",
    employer: "",
    monthlyIncome: "",
    intendedMoveInDate: "",
    occupants: 1,
    notes: ""
  });

  useEffect(() => {
    api.getProperty(slug)
      .then((data) => setProperty(data.property))
      .catch((err) => setMessage(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="page-center">Loading property...</div>;
  if (!property) return <main className="section"><div className="alert error">{message || "Property not found"}</div></main>;

  const image = getPropertyImage(property);

  async function sendInquiry(e) {
    e.preventDefault();
    try {
      await api.createInquiry(property._id, inquiry);
      setInquiry("");
      setMessage("Inquiry sent successfully.");
    } catch (err) { setMessage(err.message); }
  }

  async function requestViewing(e) {
    e.preventDefault();
    try {
      await api.createViewing(property._id, viewing);
      setMessage("Viewing request submitted.");
      setViewing({ scheduledFor: "", type: "physical", notes: "" });
    } catch (err) { setMessage(err.message); }
  }

  async function submitApplication(e) {
    e.preventDefault();
    try {
      await api.createApplication(property._id, {
        ...application,
        monthlyIncome: application.monthlyIncome === "" ? undefined : Number(application.monthlyIncome),
        occupants: Number(application.occupants)
      });
      setMessage("Rental application submitted.");
    } catch (err) { setMessage(err.message); }
  }

  return (
    <main className="section">
      <Link to="/properties" className="back-link">← Back to properties</Link>

      <div className="detail-layout">
        <div>
          <div className="detail-image">
            <img src={image} alt={property.title} onError={(e) => { e.currentTarget.style.display = "none"; }} />
          </div>

          <div className="detail-content">
            <span className="eyebrow">{property.propertyType}</span>
            <h1>{property.title}</h1>
            <p className="location">📍 {property.location?.address || property.location?.area}, {property.location?.city}, {property.location?.state}</p>
            <div className="price-large">
              {property.rent?.currency === "USD" ? "$" : "₦"}
              {Number(property.rent?.amount || 0).toLocaleString()}
              <small> / {property.rent?.period}</small>
            </div>

            <div className="detail-stats">
              <div><strong>{property.bedrooms ?? 0}</strong><span>Bedrooms</span></div>
              <div><strong>{property.bathrooms ?? 0}</strong><span>Bathrooms</span></div>
              <div><strong>{property.parkingSpaces ?? 0}</strong><span>Parking</span></div>
              <div><strong>{property.furnished ? "Yes" : "No"}</strong><span>Furnished</span></div>
            </div>

            <h2>Description</h2>
            <p className="description">{property.description}</p>

            {property.amenities?.length > 0 && (
              <>
                <h2>Amenities</h2>
                <div className="chips">{property.amenities.map(a => <span key={a}>{a}</span>)}</div>
              </>
            )}
          </div>
        </div>

        <aside className="action-stack">
          {message && <div className="alert">{message}</div>}

          {!user ? (
            <div className="panel">
              <h3>Interested in this property?</h3>
              <p>Create an account to save the property, ask questions, request a viewing and apply.</p>
              <Link className="btn btn-primary full" to="/login">Login to continue</Link>
            </div>
          ) : (
            <>
              <form className="panel" onSubmit={sendInquiry}>
                <h3>Ask about this property</h3>
                <textarea required value={inquiry} onChange={e => setInquiry(e.target.value)} placeholder="Write your question..." />
                <button className="btn btn-primary full">Send Inquiry</button>
              </form>

              <form className="panel" onSubmit={requestViewing}>
                <h3>Request a viewing</h3>
                <label>Date & time</label>
                <input required type="datetime-local" value={viewing.scheduledFor} onChange={e => setViewing({...viewing, scheduledFor: e.target.value})} />
                <label>Viewing type</label>
                <select value={viewing.type} onChange={e => setViewing({...viewing, type: e.target.value})}>
                  <option value="physical">Physical</option>
                  <option value="virtual">Virtual</option>
                </select>
                <textarea value={viewing.notes} onChange={e => setViewing({...viewing, notes: e.target.value})} placeholder="Optional notes" />
                <button className="btn btn-primary full">Request Viewing</button>
              </form>

              <form className="panel" onSubmit={submitApplication}>
                <h3>Rental application</h3>
                <select value={application.employmentStatus} onChange={e => setApplication({...application, employmentStatus: e.target.value})}>
                  {["employed","self_employed","business_owner","student","retired","unemployed"].map(x => <option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}
                </select>
                <input placeholder="Employer" value={application.employer} onChange={e => setApplication({...application, employer: e.target.value})} />
                <input type="number" min="0" placeholder="Monthly income" value={application.monthlyIncome} onChange={e => setApplication({...application, monthlyIncome: e.target.value})} />
                <label>Intended move-in date</label>
                <input type="date" value={application.intendedMoveInDate} onChange={e => setApplication({...application, intendedMoveInDate: e.target.value})} />
                <input type="number" min="1" placeholder="Number of occupants" value={application.occupants} onChange={e => setApplication({...application, occupants: e.target.value})} />
                <textarea placeholder="Additional notes" value={application.notes} onChange={e => setApplication({...application, notes: e.target.value})} />
                <button className="btn btn-primary full">Submit Application</button>
              </form>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
