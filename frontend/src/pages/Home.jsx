import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">GROUP 52 REAL ESTATE</span>
          <h1>Find a place that feels like home.</h1>
          <p>
            Discover available properties, request viewings, apply to rent,
            and manage your rental journey from one platform.
          </p>
          <div className="hero-actions">
            <Link to="/properties" className="btn btn-primary btn-large">
              Explore Properties
            </Link>
            <Link to="/register" className="btn btn-light btn-large">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">HOW IT WORKS</span>
            <h2>Rent with less stress.</h2>
          </div>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <span>01</span>
            <h3>Find</h3>
            <p>Search properties by location, type, price, bedrooms and furnishing.</p>
          </div>
          <div className="feature-card">
            <span>02</span>
            <h3>View</h3>
            <p>Save properties, ask questions and request physical or virtual viewings.</p>
          </div>
          <div className="feature-card">
            <span>03</span>
            <h3>Rent</h3>
            <p>Submit an application, receive a lease and manage your payments.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
