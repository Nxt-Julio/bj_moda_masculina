export function SectionHeader({ kicker, title }) {
  return (
    <div className="section-header">
      {kicker ? <p className="section-kicker">{kicker}</p> : null}
      <h2>{title}</h2>
    </div>
  );
}
