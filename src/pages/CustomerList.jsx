import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function CustomerList({ type }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fn = {
      favorites: api.getFavorites,
      applications: api.getMyApplications,
      viewings: api.getMyViewings,
      inquiries: api.getMyInquiries,
      leases: api.getMyLeases,
      payments: api.getMyPayments
    }[type];

    fn().then((data) => {
      const key = type;
      setItems(data[key] || []);
    }).catch(err => setError(err.message));
  }, [type]);

  const title = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <main className="section narrow">
      <span className="eyebrow">MY ACCOUNT</span>
      <h1>{title}</h1>
      {error && <div className="alert error">{error}</div>}
      {items.length === 0 && !error ? (
        <div className="empty-state"><h3>No {type} yet</h3><p>Your activity will appear here.</p></div>
      ) : (
        <div className="list-stack">
          {items.map((item) => {
            const property = item.property;
            return (
              <div className="list-card" key={item._id}>
                <div>
                  <h3>{property?.title || item.reference || item.leaseNumber || "Rental activity"}</h3>
                  <p className="muted">
                    {item.status ? `Status: ${item.status}` : ""}
                    {property?.location ? ` · ${property.location.city}` : ""}
                  </p>
                </div>
                <span className={`status status-${item.status || "default"}`}>{item.status || "Saved"}</span>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
