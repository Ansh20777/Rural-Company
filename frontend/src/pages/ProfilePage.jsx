import { useRef } from 'react';
import { Camera, Mail, MapPin, Phone, Star, UserRound, BriefcaseBusiness, CalendarDays } from 'lucide-react';
import Avatar from '../components/Avatar.jsx';

function Detail({ icon: Icon, label, value }) {
  return <div className="profile-detail"><span className="profile-detail-icon"><Icon size={17}/></span><span className="profile-detail-copy"><small>{label}</small><strong>{value || 'Add your details'}</strong></span></div>;
}

export default function ProfilePage({ profile, worker, onPhotoChange, announce }) {
  const fileInput = useRef(null);
  const fallbackInitials = profile.initials || 'UC';
  const onSelectPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      announce('Please choose an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onPhotoChange(reader.result);
    reader.readAsDataURL(file);
  };

  return <section className="profile-page">
    <div className="profile-page-heading"><div><span className="panel-kicker">YOUR ACCOUNT</span><h1>My profile</h1><p>Keep your details current so your community knows who they’re connecting with.</p></div><span className="profile-demo-tag">DEMO PROFILE</span></div>
    <article className="profile-card">
      <div className="profile-photo-wrap">
        <div className="profile-photo">{profile.profilePhoto ? <img src={profile.profilePhoto} alt={`${profile.name}'s profile`}/> : <Avatar initials={fallbackInitials} color="sage" large/>}</div>
        <button type="button" className="photo-edit" aria-label="Upload profile photo" onClick={() => fileInput.current?.click()}><Camera size={16}/></button>
        <input ref={fileInput} type="file" accept="image/*" className="visually-hidden" onChange={onSelectPhoto}/>
      </div>
      <h2>{profile.name}</h2>
      <span className="profile-role-label">{worker ? profile.profession : 'Local customer'} · {profile.area}</span>
      <div className="profile-details-grid">
        <Detail icon={UserRound} label="Age" value={profile.age ? `${profile.age} years` : ''}/>
        <Detail icon={Mail} label="Email address" value={profile.email}/>
        <Detail icon={Phone} label="Contact number" value={profile.phone}/>
        <Detail icon={MapPin} label="Home address" value={`${profile.address}${profile.pinCode ? ` · ${profile.pinCode}` : ''}`}/>
      </div>
      {worker && <div className="worker-profile-extras"><div className="profile-extra"><span><BriefcaseBusiness size={16}/> Profession</span><strong>{profile.profession || 'Add your profession'}</strong></div><div className="profile-extra"><span><CalendarDays size={16}/> Experience</span><strong>{profile.experience ? `${profile.experience} years` : 'Add your experience'}</strong></div><div className="profile-extra"><span><Star size={16} fill="currentColor"/> Rating</span><strong>{profile.rating} <small>out of 5</small></strong></div></div>}
    </article>
  </section>;
}
