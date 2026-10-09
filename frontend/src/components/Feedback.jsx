export function LoadingState({ label = "Loading..." }) {
  return (
    <div className="feedback" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="feedback feedback-error" role="alert">
      <div>
        <strong>We couldn’t load this information.</strong>
        <p>{message}</p>
      </div>
      {onRetry && (
        <button className="button button-outline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">
        —
      </span>
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}
