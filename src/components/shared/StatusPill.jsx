export function StatusPill({ status }) {
  return <span className={`status-chip ${status}`}>{status}</span>;
}
