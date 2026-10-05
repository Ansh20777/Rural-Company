import { useRef, useState } from 'react';
import { Camera, Mail, MapPin, Phone, Star, UserRound, BriefcaseBusiness, CalendarDays, Save } from 'lucide-react';
import Avatar from '../components/Avatar.jsx';

function Detail({ icon: Icon, label, value }) {
  return <div className="profile-detail"><span className="profile-detail-icon"><Icon size={17}/></span><span className="profile-detail-copy"><small>{label}</small><strong>{value || 'Add your details'}</strong></span></div>;
}

export default function ProfilePage({ profile, worker, onSave, editable = false, announce }) {
  const fileInput = useRef(null);
  const [draft, setDraft] = useState(profile);
  const [saving, setSaving] = useState(false);
  const update = (field) => (event) => setDraft((current) => ({ ...current, [field]: event.target.value }));
  const updateLocation = (field) => (event) => setDraft((current) => ({ ...current, location: { ...(current.location || {}), [field]: event.target.value } }));
  // Shrink photos in the browser before upload (max 512px JPEG) so we never send multi-MB base64 strings
  const resizeImage = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 512 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
    img.src = url;
  });
  const onSelectPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 15 * 1024 * 1024) { announce('Please choose a photo (image file under 15 MB).'); return; }
    try { const image = await resizeImage(file); setDraft((current) => ({ ...current, profileImage: image })); }
    catch (error) { announce(error.message); }
  };
  const save = async (event) => {
    event.preventDefault(); setSaving(true);
    try { await onSave(draft); }
    catch (error) { announce(error.message); }
    finally { setSaving(false); }
  };
  const initials = profile.initials || profile.name?.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'UC';
  const address = [profile.address, profile.location?.district, profile.location?.state, profile.pinCode].filter(Boolean).join(' · ');
  return <section className="profile-page">
    <div className="profile-page-heading"><div><span className="panel-kicker">YOUR ACCOUNT</span><h1>My profile</h1><p>Keep your details current so your community knows who they’re connecting with.</p></div><span className="profile-demo-tag">{editable ? 'PROFILE' : 'PREVIEW'}</span></div>
    <form onSubmit={save}>
      <article className="profile-card">
        <div className="profile-photo-wrap"><div className="profile-photo">{(draft.profileImage || profile.profileImage) ? <img src={draft.profileImage || profile.profileImage} alt={`${profile.name || 'Your'} profile photo`}/> : <Avatar initials={initials} color="sage" large/>}</div>
          {editable && <><button type="button" className="photo-edit" aria-label="Upload profile photo" onClick={() => fileInput.current?.click()}><Camera size={16}/></button><input ref={fileInput} type="file" accept="image/*" className="visually-hidden" onChange={onSelectPhoto}/></>}
        </div>
        {editable ? <label className="profile-name-input">Full name<input value={draft.name || ''} onChange={update('name')} required/></label> : <h2>{profile.name}</h2>}
        <span className="profile-role-label">{worker ? profile.profession || 'Worker' : 'Local customer'} · {profile.area || profile.location?.district || 'Your community'}</span>
        <div className="profile-details-grid">
          {editable ? <>
            <label className="profile-edit-field"><span><UserRound size={17}/> Age</span><input type="number" min="18" max="100" value={draft.age || ''} onChange={update('age')}/></label>
            <Detail icon={Mail} label="Email address" value={profile.email}/>
            <label className="profile-edit-field"><span><Phone size={17}/> Contact number</span><input value={draft.phone || ''} onChange={update('phone')} type="tel"/></label>
            <label className="profile-edit-field"><span><MapPin size={17}/> Home address</span><input value={draft.address || ''} onChange={update('address')} placeholder="House, street and village"/></label>
            <label className="profile-edit-field"><span><MapPin size={17}/> District</span><input value={draft.location?.district || ''} onChange={updateLocation('district')}/></label>
            <label className="profile-edit-field"><span><MapPin size={17}/> State</span><input value={draft.location?.state || ''} onChange={updateLocation('state')}/></label>
            <label className="profile-edit-field"><span><MapPin size={17}/> PIN code</span><input value={draft.pinCode || ''} onChange={update('pinCode')} inputMode="numeric" maxLength="6" pattern="[0-9]{6}"/></label>
          </> : <>
            <Detail icon={UserRound} label="Age" value={profile.age ? `${profile.age} years` : ''}/><Detail icon={Mail} label="Email address" value={profile.email}/><Detail icon={Phone} label="Contact number" value={profile.phone}/><Detail icon={MapPin} label="Home address" value={address}/>
          </>}
        </div>
        {worker && <div className="worker-profile-extras">{editable ? <>
          <label className="profile-edit-field"><span><BriefcaseBusiness size={16}/> Profession</span><input value={draft.profession || ''} onChange={update('profession')}/></label>
          <label className="profile-edit-field"><span><CalendarDays size={16}/> Experience (years)</span><input type="number" min="0" value={draft.experience ?? ''} onChange={update('experience')}/></label>
          <label className="profile-edit-field"><span><IndianRupeeIcon/> Expected rate</span><input type="number" min="0" value={draft.expectedRate ?? ''} onChange={update('expectedRate')}/></label>
          <label className="profile-edit-field"><span>Rate unit</span><select value={draft.rateUnit || 'day'} onChange={update('rateUnit')}><option value="hour">Per hour</option><option value="day">Per day</option><option value="month">Per month</option></select></label>
          <label className="profile-edit-field"><span>Skills (comma-separated)</span><input value={(draft.skills || []).join(', ')} onChange={(event) => setDraft((current) => ({ ...current, skills: event.target.value.split(',').map((skill) => skill.trim()).filter(Boolean) }))}/></label>
          <label className="profile-edit-field"><span>About your work</span><textarea value={draft.bio || ''} onChange={update('bio')} maxLength="500"/></label>
        </> : <>
          <div className="profile-extra"><span><BriefcaseBusiness size={16}/> Profession</span><strong>{profile.profession || 'Add your profession'}</strong></div><div className="profile-extra"><span><CalendarDays size={16}/> Experience</span><strong>{profile.experience ? `${profile.experience} years` : 'Add your experience'}</strong></div><div className="profile-extra"><span><Star size={16} fill="currentColor"/> Rating</span><strong>{profile.rating || 0} <small>out of 5 · {profile.reviewCount || 0} reviews</small></strong></div>
        </>}</div>}
        {editable && <button className="button button-dark profile-save" type="submit" disabled={saving}><Save size={16}/>{saving ? 'Saving…' : 'Save profile'}</button>}
      </article>
    </form>
  </section>;
}

function IndianRupeeIcon() { return <span aria-hidden="true">₹</span>; }
