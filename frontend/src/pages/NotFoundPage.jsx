import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="auth-shell unauthorized-shell">
      <section className="unauthorized-card">
        <p className="eyebrow">404 • PAGE NOT FOUND</p>
        <h1>We couldn’t find that page.</h1>
        <p>The address may have changed, or the page may not be part of this phase.</p>
        <Link className="primary-button" to="/">Return to Keyhouse</Link>
      </section>
    </main>
  );
}
