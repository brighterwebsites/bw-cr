export default function StubPage({
  icon,
  title,
  note,
}: {
  icon: string
  title: string
  note?: string
}) {
  return (
    <div className="stub-page">
      <div className="stub-card">
        <div className="stub-card-icon">{icon}</div>
        <h2>{title}</h2>
        {note && <p>{note}</p>}
      </div>
    </div>
  )
}
