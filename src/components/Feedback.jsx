export function LoadingState({ label = 'Memuat data' }) {
  return (
    <div className="loading-state" role="status" aria-label={label} aria-busy="true">
      <span className="loading-line" />
      <span className="loading-line loading-line-short" />
      <span className="loading-line" />
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="notice notice-error" role="alert">
      <p>{message}</p>
      {onRetry && <button className="button button-outline" type="button" onClick={onRetry}>Coba lagi</button>}
    </div>
  )
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="empty-state" role="status">
      <span className="empty-rule" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{message}</p>
      {action}
    </div>
  )
}
