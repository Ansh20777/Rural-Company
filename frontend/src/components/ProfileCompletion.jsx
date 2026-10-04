import Avatar from './Avatar.jsx';

export default function ProfileCompletion({ profile, completion, onClick }) {
  return <button className="profile-completion" type="button" onClick={onClick} aria-label={`Open profile. ${completion}% complete`}>
    <span className="completion-ring" style={{ '--completion': `${completion}%` }}>
      <div className="completion-ring-inner">
        {profile.profilePhoto ? <img src={profile.profilePhoto} alt=""/> : <Avatar initials={profile.initials} color="sage"/>}
      </div>
      <span className="completion-percent">{completion}%</span>
    </span>
    <span className="completion-caption">Profile complete</span>
  </button>;
}
