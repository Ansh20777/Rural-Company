export default function Avatar({ initials, color, large = false }) {
  return <div className={`avatar ${color} ${large ? 'avatar-large' : ''}`} aria-hidden="true">{initials}</div>;
}
