import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, Bell, BriefcaseBusiness, CalendarDays, Home, IndianRupee, LogOut, MapPin, Plus, Search, Settings, Star, UsersRound, UserRound } from 'lucide-react';
import Avatar from '../components/Avatar.jsx';
import ProfileCompletion from '../components/ProfileCompletion.jsx';
import SiteHeader from '../components/SiteHeader.jsx';
import PreviewDock from '../components/PreviewDock.jsx';
import Toast from '../components/Toast.jsx';
import ProfilePage from './ProfilePage.jsx';
import { apiRequest } from '../lib/api.js';

const demoPeople = [
  { _id: 'demo-c1', name: 'Ramesh Kumar', profession: 'Carpenter', experience: 5, rating: 4.8, reviewCount: 24, availability: true, expectedRate: 500, rateUnit: 'day', skills: ['Table making', 'Furniture repair'], location: { district: 'Rampur', state: 'Uttar Pradesh' } },
  { _id: 'demo-p1', name: 'Suresh Yadav', profession: 'Plumber', experience: 7, rating: 4.7, reviewCount: 18, availability: true, expectedRate: 350, rateUnit: 'hour', skills: ['Pipeline repair', 'Bathroom fittings'], location: { district: 'Rampur', state: 'Uttar Pradesh' } },
];
const demoJobs = [
  { _id: 'demo-j1', title: 'Build a dining table', profession: 'Carpenter', description: 'Make a sturdy six-seat table.', payment: 2500, paymentUnit: 'total', jobType: 'contract', duration: '2 days', location: { district: 'Rampur', state: 'Uttar Pradesh' }, customer: { name: 'Anil Sharma' } },
  { _id: 'demo-j2', title: 'Repair water pipeline', profession: 'Plumber', description: 'Fix a leaking kitchen pipeline.', payment: 900, paymentUnit: 'day', jobType: 'hourly', duration: 'A few hours', location: { district: 'Rampur', state: 'Uttar Pradesh' }, customer: { name: 'Sunita Devi' } },
];

function Modal({ title, onClose, children }) {
  return <div className="dialog-backdrop" role="presentation" onClick={onClose}><section className="action-dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}><div className="dialog-heading"><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Close">×</button></div>{children}</section></div>;
}

export default function DashboardPage({ lang, setLang, role, user, people = [], jobs = [], onHome, onSwitchRole, onSignOut, demo, announce, notice = '' }) {
  const [activeView, setActiveView] = useState('overview');
  const [profile, setProfile] = useState(user || {});
  const [workers, setWorkers] = useState(people);
  const [openJobs, setOpenJobs] = useState(jobs);
  const [bookings, setBookings] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [applicants, setApplicants] = useState({});
  const [modal, setModal] = useState('');
  const [target, setTarget] = useState(null);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const worker = role === 'worker';

  const refresh = useCallback(async () => {
    if (demo) {
      setProfile(user || {}); setWorkers(demoPeople); setOpenJobs(demoJobs); return;
    }
    try {
      const common = await apiRequest('/api/user/me');
      setProfile(common.user);
      if (worker) {
        const [workerProfile, bookingData, applicationData, jobData] = await Promise.all([
          apiRequest('/api/workers/me'), apiRequest('/api/booking/my'), apiRequest('/api/applications/my'), apiRequest('/api/jobs'),
        ]);
        setProfile(workerProfile.worker); setBookings(bookingData.bookings || []); setApplications(applicationData.applications || []); setOpenJobs(jobData.jobs || []);
      } else {
        const [bookingData, myJobData, workerData] = await Promise.all([
          apiRequest('/api/booking/my'), apiRequest('/api/jobs/my'), apiRequest('/api/workers?limit=8'),
        ]);
        setBookings(bookingData.bookings || []); setMyJobs(myJobData.jobs || []); setWorkers(workerData.workers || []);
      }
    } catch (error) { announce(error.message); }
  }, [demo, user, worker, announce]);

  useEffect(() => { refresh(); }, [refresh]);

  const doAction = async (path, options, success) => {
    if (demo) { announce('This action needs a real account connected to the backend.'); return; }
    try { await apiRequest(path, options); announce(success); setModal(''); await refresh(); }
    catch (error) { announce(error.message); }
  };

  const saveProfile = async (next) => {
    if (demo) { setProfile(next); announce('Demo profile updated for this session.'); return; }
    const body = { ...next, age: next.age ? Number(next.age) : undefined, experience: next.experience === '' ? undefined : Number(next.experience), expectedRate: next.expectedRate === '' ? undefined : Number(next.expectedRate) };
    const { user: saved } = await apiRequest('/api/user/me', { method: 'PUT', body });
    if (worker) {
      const { worker: savedWorker } = await apiRequest('/api/workers/me', { method: 'PUT', body });
      setProfile(savedWorker);
    } else setProfile(saved);
    announce('Profile saved.');
  };

  const setAvailability = async () => {
    if (demo || availabilityBusy) return;
    setAvailabilityBusy(true);
    try {
      const result = await apiRequest('/api/workers/me/availability', { method: 'PUT', body: { availability: !profile.availability } });
      setProfile((current) => ({ ...current, availability: result.availability })); announce('Availability updated.');
    } catch (error) { announce(error.message); }
    finally { setAvailabilityBusy(false); }
  };

  const loadApplicants = async (job) => {
    if (demo) { announce('Applicant details appear after a worker applies to a posted job.'); return; }
    try { const response = await apiRequest(`/api/jobs/${job._id}/applications`); setApplicants((current) => ({ ...current, [job._id]: response.applications || [] })); setTarget(job); setModal('applicants'); }
    catch (error) { announce(error.message); }
  };

  const displayName = profile.name || (worker ? 'Worker' : 'Customer');
  const locationLabel = profile.location?.district || profile.location?.village || profile.address || 'Add your location';
  const profileFields = [profile.name, profile.age, profile.email, profile.phone, profile.address, profile.pinCode, profile.location?.district, profile.location?.state, ...(worker ? [profile.profession, profile.experience, profile.bio, profile.expectedRate] : [])];
  const completion = Math.round(profileFields.filter((value) => value !== undefined && value !== null && value !== '').length / profileFields.length * 100);
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const metrics = worker
    ? [{ icon: <BriefcaseBusiness size={18}/>, label: 'Open opportunities', value: openJobs.length, hint: 'Jobs accepting applications', tone: 'sage' }, { icon: <CalendarDays size={18}/>, label: 'My bookings', value: bookings.filter((item) => ['pending', 'accepted'].includes(item.status)).length, hint: 'Requests and confirmed work', tone: 'gold' }, { icon: <Star size={18}/>, label: 'Your rating', value: profile.rating || '—', hint: `${profile.reviewCount || 0} reviews`, tone: 'rose' }]
    : [{ icon: <UsersRound size={18}/>, label: 'Workers nearby', value: workers.length, hint: 'Profiles in your area', tone: 'sage' }, { icon: <BriefcaseBusiness size={18}/>, label: 'Your open jobs', value: myJobs.filter((job) => job.status === 'open').length, hint: 'Jobs accepting applicants', tone: 'gold' }, { icon: <CalendarDays size={18}/>, label: 'My requests', value: bookings.length, hint: 'Quick job bookings', tone: 'rose' }];

  const statusAction = (item, status, kind) => doAction(kind === 'booking' ? `/api/booking/${item._id}/status` : `/api/jobs/${item._id}/status`, { method: 'PUT', body: { status } }, `${kind === 'booking' ? 'Booking' : 'Job'} ${status}.`);
  const changeApplication = (id, status) => doAction(`/api/applications/${id}/status`, { method: 'PUT', body: { status } }, `Application ${status}.`);

  return <div className={`${lang === 'hi' ? 'app hindi' : 'app'} dashboard-app`}>
    <SiteHeader mode="dashboard" role={role} lang={lang} setLang={setLang} t={{}}/>
    <div className="dashboard-shell wrap">
      <aside className="dashboard-sidebar">
        <div className="sidebar-user"><ProfileCompletion profile={{ initials, profilePhoto: profile.profileImage }} completion={completion} onClick={() => setActiveView('profile')}/><button className="sidebar-user-name" onClick={() => setActiveView('profile')}><strong>{displayName}</strong><span>{worker ? profile.profession || 'Worker' : 'Local customer'} · {locationLabel}</span></button></div>
        {worker && <button className={`availability-toggle ${profile.availability ? 'is-available' : ''}`} type="button" onClick={setAvailability} disabled={availabilityBusy || demo}><span/>{profile.availability ? 'Available for work' : 'Not available'}</button>}
        <button className={`sidebar-link ${activeView === 'overview' ? 'active' : ''}`} onClick={() => setActiveView('overview')}><Home size={17}/> Overview</button>
        <button className={`sidebar-link ${activeView === 'profile' ? 'active' : ''}`} onClick={() => setActiveView('profile')}><UserRound size={17}/> My profile</button>
        <button className={`sidebar-link ${activeView === 'discover' ? 'active' : ''}`} onClick={() => setActiveView('discover')}>{worker ? <BriefcaseBusiness size={17}/> : <Search size={17}/>} {worker ? 'Find work' : 'Find workers'}</button>
        <button className={`sidebar-link ${activeView === 'activity' ? 'active' : ''}`} onClick={() => setActiveView('activity')}><CalendarDays size={17}/> {worker ? 'My work' : 'My requests & jobs'}</button>
        <button className="sidebar-link" onClick={() => announce('Settings will be available soon.')}><Settings size={17}/> Settings</button>
        <button className="sidebar-link sidebar-logout" onClick={onSignOut}><LogOut size={17}/> Sign out</button>
      </aside>
      <main className="dashboard-content">
        {activeView === 'profile' ? <ProfilePage profile={{ ...profile, initials, area: locationLabel }} worker={worker} editable onSave={saveProfile} announce={announce}/> : activeView === 'discover' ? <>
          <div className="dashboard-welcome"><div><div className="eyebrow eyebrow-muted">LOCAL MARKETPLACE <span className="eyebrow-dot"/></div><h1>{worker ? 'Find work nearby' : 'Find local workers'}</h1><p>{worker ? 'Browse open jobs and apply when the work is right for you.' : 'Discover available workers and send a direct request.'}</p></div>{!worker && <button className="button button-dark" onClick={() => setModal('post-job')}><Plus size={16}/> Post a long-term job</button>}</div>
          <div className="dashboard-list">{worker ? openJobs.map((job) => <article className="dashboard-list-row" key={job._id}><Avatar initials={(job.customer?.name || 'UC').slice(0, 2).toUpperCase()} color="gold"/><div className="dashboard-row-main"><strong>{job.title}</strong><span>{job.profession} · {job.location?.district}, {job.location?.state} · {job.duration || job.jobType}</span></div><div className="dashboard-row-pay"><strong>₹{job.payment}</strong><span>per {job.paymentUnit || 'month'}</span></div><button onClick={() => { setTarget(job); setModal('apply'); }} aria-label="Apply to job"><ArrowUpRight size={17}/></button></article>) : workers.map((person) => <article className="dashboard-list-row" key={person._id}><Avatar initials={person.name?.slice(0, 2).toUpperCase()} color="sage"/><div className="dashboard-row-main"><strong>{person.name}</strong><span>{person.profession} · {person.location?.district || person.location?.village} · {person.experience || 0} years</span></div><div className="dashboard-row-pay"><strong>{person.rating || 'New'} ★</strong><span>{person.reviewCount || 0} reviews</span></div><button onClick={() => { setTarget(person); setModal('booking'); }} aria-label="Request worker"><ArrowUpRight size={17}/></button></article>)}</div>
        </> : activeView === 'activity' ? <>
          <div className="dashboard-welcome"><div><div className="eyebrow eyebrow-muted">YOUR ACTIVITY <span className="eyebrow-dot"/></div><h1>{worker ? 'My work' : 'Requests and jobs'}</h1><p>Review updates, applications and hiring activity.</p></div></div>
          {worker ? <><h2 className="activity-section-title">Quick job requests</h2>{bookings.map((booking) => <article className="dashboard-list-row" key={booking._id}><Avatar initials={(booking.customer?.name || 'C').slice(0, 2).toUpperCase()} color="gold"/><div className="dashboard-row-main"><strong>{booking.profession} · {booking.description}</strong><span>{booking.customer?.name} · {booking.location?.district || booking.location?.village} · {booking.status}</span></div><div className="dashboard-row-pay"><strong>{booking.budget ? `₹${booking.budget}` : 'Discuss rate'}</strong><span>{booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'Flexible date'}</span></div><div className="row-actions">{booking.status === 'pending' && <><button onClick={() => statusAction(booking, 'accepted', 'booking')}>Accept</button><button onClick={() => statusAction(booking, 'rejected', 'booking')}>Decline</button></>}{booking.status === 'accepted' && <button onClick={() => statusAction(booking, 'completed', 'booking')}>Mark complete</button>}</div></article>)}<h2 className="activity-section-title">Job applications</h2>{applications.map((app) => <article className="dashboard-list-row" key={app._id}><Avatar initials={(app.job?.title || 'J').slice(0, 2).toUpperCase()} color="sage"/><div className="dashboard-row-main"><strong>{app.job?.title || 'Job application'}</strong><span>{app.job?.location?.district} · {app.status}</span></div><div className="dashboard-row-pay"><strong>{app.expectedRate ? `₹${app.expectedRate}` : 'Rate discussed'}</strong><span>{app.job?.customer?.name || 'Employer'}{app.status === 'accepted' && app.job?.customer?.phone ? ` · ${app.job.customer.phone}` : ''}</span></div>{app.status === 'pending' && <button onClick={() => doAction(`/api/applications/${app._id}/withdraw`, { method: 'PUT' }, 'Application withdrawn.')}>Withdraw</button>}</article>)}</> : <><h2 className="activity-section-title">Quick bookings</h2>{bookings.map((booking) => <article className="dashboard-list-row" key={booking._id}><Avatar initials={(booking.worker?.name || 'W').slice(0, 2).toUpperCase()} color="sage"/><div className="dashboard-row-main"><strong>{booking.profession} · {booking.description}</strong><span>{booking.worker?.name} · {booking.status}</span></div><div className="dashboard-row-pay"><strong>{booking.budget ? `₹${booking.budget}` : 'Discuss rate'}</strong><span>{booking.location?.district || booking.location?.village}</span></div><div className="row-actions">{['pending', 'accepted'].includes(booking.status) && <button onClick={() => statusAction(booking, 'cancelled', 'booking')}>Cancel</button>}{booking.status === 'completed' && <button onClick={() => { setTarget(booking); setModal('review-booking'); }}>Leave review</button>}</div></article>)}<h2 className="activity-section-title">Your posted jobs</h2>{myJobs.map((job) => <article className="dashboard-list-row" key={job._id}><Avatar initials="JB" color="gold"/><div className="dashboard-row-main"><strong>{job.title}</strong><span>{job.profession} · {job.location?.district} · {job.status} · {job.applicationCount || 0} applicants</span></div><div className="row-actions"><button onClick={() => loadApplicants(job)}>Applicants</button>{job.status === 'hired' && <button onClick={() => statusAction(job, 'completed', 'job')}>Mark complete</button>}{['open', 'hired'].includes(job.status) && <button onClick={() => statusAction(job, 'cancelled', 'job')}>Cancel</button>}{job.status === 'completed' && <button onClick={() => { setTarget(job); setModal('review-job'); loadApplicants(job); }}>Review worker</button>}</div></article>)}</>}
        </> : <>
          <div className="dashboard-welcome"><div><div className="eyebrow eyebrow-muted">{new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()} <span className="eyebrow-dot"/></div><h1>{worker ? `Good to see you, ${displayName.split(' ')[0]}!` : `Welcome, ${displayName.split(' ')[0]}!`}</h1><p>{worker ? 'Here’s what’s happening with work in your area today.' : 'Here’s what’s happening in your neighbourhood today.'}</p></div><button className="button button-dark" onClick={() => worker ? setActiveView('profile') : setModal('post-job')}>{worker ? 'Edit my profile' : <><Plus size={16}/> Post a job</>}</button></div>
          <div className="dashboard-metrics">{metrics.map((item) => <article className="metric-card" key={item.label}><div className={`metric-icon ${item.tone}`}>{item.icon}</div><span>{item.label}</span><strong>{item.value}</strong><small>{item.hint}</small></article>)}</div>
          <section className="dashboard-panel"><div className="panel-heading"><div><span className="panel-kicker">{worker ? 'OPEN JOBS' : 'LOCAL TALENT'}</span><h2>{worker ? 'Opportunities for you' : 'Workers you may need'}</h2></div><button className="panel-link-button" onClick={() => setActiveView('discover')}>Explore all <ArrowRight size={14}/></button></div>
            <div className="dashboard-list">{(worker ? openJobs : workers).slice(0, 5).map((item) => <article className="dashboard-list-row" key={item._id}><Avatar initials={worker ? (item.customer?.name || 'UC').slice(0, 2).toUpperCase() : item.name?.slice(0, 2).toUpperCase()} color={worker ? 'gold' : 'sage'}/><div className="dashboard-row-main"><strong>{worker ? item.title : item.name}</strong><span>{worker ? `${item.profession} · ${item.location?.district || item.location?.village}` : `${item.profession} · ${item.location?.district || item.location?.village} · ${item.experience || 0} years`}</span></div><div className="dashboard-row-pay"><strong>{worker ? `₹${item.payment}` : `${item.rating || 'New'} ★`}</strong><span>{worker ? item.paymentUnit || item.jobType : `${item.reviewCount || 0} reviews`}</span></div><button onClick={() => worker ? (setTarget(item), setModal('apply')) : (setTarget(item), setModal('booking'))} aria-label={worker ? 'Apply to job' : 'Request worker'}><ArrowUpRight size={17}/></button></article>)}</div>
          </section>
          <div className="dashboard-bottom"><section className="dashboard-panel small-panel"><div className="panel-heading"><div><span className="panel-kicker">YOUR PROFILE</span><h2>{worker ? 'Help people find you' : 'Your location'}</h2></div><button onClick={() => setActiveView('profile')}><ArrowUpRight size={16}/></button></div><p>{worker ? 'A complete profile makes it easier for nearby customers to find your skills.' : 'Your location helps us show available workers and jobs in your area.'}</p><div className="profile-progress"><span><i style={{ width: `${completion}%` }}/></span><strong>{worker ? `Profile ${completion}% complete` : locationLabel}</strong></div></section>
            <section className="dashboard-panel small-panel activity-panel"><div className="panel-heading"><div><span className="panel-kicker">ACCOUNT STATUS</span><h2>{worker ? 'Availability' : 'Your marketplace'}</h2></div><Bell size={16}/></div><div className="activity-item"><span className="activity-dot"/><p>{worker ? (profile.availability ? 'Your profile is visible to nearby customers.' : 'Turn availability on when you are ready for work.') : `${bookings.length} quick job request${bookings.length === 1 ? '' : 's'} so far.`}<small>Updated from your account</small></p></div><div className="activity-item"><span className="activity-dot muted"/><p>{worker ? `${profile.rating || 0} average rating from ${profile.reviewCount || 0} reviews.` : `${myJobs.length} job post${myJobs.length === 1 ? '' : 's'} created.`}<small>Keep your profile current</small></p></div></section>
          </div>
        </>}
      </main>
    </div>
    <PreviewDock mode="dashboard" role={role} onSwitch={onSwitchRole} onHome={onHome}/><Toast message={notice}/>

    {modal === 'booking' && <Modal title={`Request ${target?.profession || 'worker'}`} onClose={() => setModal('')}><form className="action-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); doAction('/api/booking', { method: 'POST', body: { workerId: target._id, description: data.get('description'), location: { village: profile.address, district: profile.location?.district, state: profile.location?.state }, scheduledDate: data.get('date') || undefined, budget: data.get('budget') ? Number(data.get('budget')) : undefined } }, 'Your request was sent.'); }}><label>What work do you need?<textarea required name="description" placeholder="Describe the repair or work"/></label><label>Preferred date<input name="date" type="date"/></label><label>Budget (optional)<input name="budget" type="number" min="0" placeholder="₹"/></label><button className="button button-dark" type="submit">Send request</button></form></Modal>}
    {modal === 'post-job' && <Modal title="Post a longer job" onClose={() => setModal('')}><form className="action-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const userLocation = profile.location || {}; doAction('/api/jobs', { method: 'POST', body: { title: data.get('title'), description: data.get('description'), profession: data.get('profession'), location: { village: userLocation.village || profile.address, district: userLocation.district || data.get('district'), state: userLocation.state || data.get('state') }, jobType: data.get('jobType'), duration: data.get('duration'), workingHours: data.get('hours'), startDate: data.get('startDate') || undefined, positions: Number(data.get('positions') || 1), payment: Number(data.get('payment')), paymentUnit: data.get('paymentUnit') } }, 'Your job was posted.'); }}><label>Job title<input name="title" required/></label><label>Description<textarea name="description" required/></label><label>Profession<input name="profession" required placeholder="Carpenter, plumber…"/></label><div className="form-split"><label>District<input name="district" required defaultValue={profile.location?.district}/></label><label>State<input name="state" required defaultValue={profile.location?.state}/></label></div><label>Job type<select name="jobType"><option value="contract">Fixed contract</option><option value="hourly">Hourly</option><option value="part-time">Part-time</option><option value="full-time">Full-time</option></select></label><div className="form-split"><label>Duration<input name="duration" placeholder="e.g. 1 month"/></label><label>Working hours<input name="hours" placeholder="e.g. 9am–5pm"/></label></div><div className="form-split"><label>Pay amount<input name="payment" type="number" min="0" required/></label><label>Pay unit<select name="paymentUnit"><option value="day">Per day</option><option value="hour">Per hour</option><option value="month">Per month</option><option value="total">Total</option></select></label></div><div className="form-split"><label>Positions<input name="positions" type="number" min="1" defaultValue="1"/></label><label>Start date<input name="startDate" type="date"/></label></div><button className="button button-dark" type="submit">Publish job</button></form></Modal>}
    {modal === 'apply' && <Modal title={`Apply: ${target?.title}`} onClose={() => setModal('')}><form className="action-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); doAction(`/api/jobs/${target._id}/apply`, { method: 'POST', body: { message: data.get('message'), expectedRate: data.get('rate') ? Number(data.get('rate')) : undefined } }, 'Your application was sent.'); }}><p>{target?.description}</p><label>Message (optional)<textarea name="message" placeholder="Introduce yourself and your experience"/></label><label>Your expected rate (optional)<input name="rate" type="number" min="0" placeholder="₹"/></label><button className="button button-dark" type="submit">Send application</button></form></Modal>}
    {modal === 'applicants' && <Modal title={`Applicants · ${target?.title}`} onClose={() => setModal('')}><div className="applicant-list">{(applicants[target?._id] || []).length ? applicants[target._id].map((app) => <article key={app._id}><Avatar initials={app.worker?.name?.slice(0, 2).toUpperCase()} color="sage"/><div><strong>{app.worker?.name}</strong><p>{app.worker?.profession} · {app.worker?.experience || 0} years · ★ {app.worker?.rating || 0}</p><small>{app.message || 'No message'} · {app.expectedRate ? `₹${app.expectedRate} expected` : 'Rate not specified'}</small></div>{app.status === 'pending' && <div className="row-actions"><button onClick={() => changeApplication(app._id, 'accepted')}>Accept</button><button onClick={() => changeApplication(app._id, 'rejected')}>Decline</button></div>}<span>{app.status}</span></article>) : <p>No applicants yet.</p>}</div></Modal>}
    {(modal === 'review-booking' || modal === 'review-job') && <Modal title="Leave a review" onClose={() => setModal('')}><form className="action-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const body = { rating: Number(data.get('rating')), comment: data.get('comment') }; if (modal === 'review-booking') body.bookingId = target._id; else { body.jobId = target._id; body.workerId = data.get('workerId'); } doAction('/api/reviews', { method: 'POST', body }, 'Thank you. Your review was saved.'); }}><label>Rating<select name="rating"><option value="5">5 stars · Excellent</option><option value="4">4 stars · Good</option><option value="3">3 stars · Okay</option><option value="2">2 stars</option><option value="1">1 star</option></select></label>{modal === 'review-job' && <label>Hired worker<select name="workerId" required defaultValue=""> <option value="" disabled>Select an accepted applicant</option>{(applicants[target?._id] || []).filter((app) => app.status === 'accepted').map((app) => <option value={app.worker?._id} key={app._id}>{app.worker?.name} · {app.worker?.profession}</option>)}</select><button className="text-button" type="button" onClick={() => loadApplicants(target)}>Load accepted workers</button></label>}<label>Comment<textarea name="comment"/></label><button className="button button-dark" type="submit">Submit review</button></form></Modal>}
  </div>;
}
