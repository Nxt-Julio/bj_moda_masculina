export function GateCard({ title, text, actionLabel, onAction }) {
  return (
    <section className="card empty-card">
      <h1>{title}</h1>
      <p className="small">{text}</p>
      {actionLabel ? (
        <button className="btn" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
