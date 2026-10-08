import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Bell, BriefcaseBusiness, CalendarDays, Globe, Home, LogOut, Plus, Search, Star, UsersRound, UserRound } from 'lucide-react';
import Avatar from '../components/Avatar.jsx';
import ProfileCompletion from '../components/ProfileCompletion.jsx';
import SiteHeader from '../components/SiteHeader.jsx';
import Toast from '../components/Toast.jsx';
import ProfilePage from './ProfilePage.jsx';
import { apiRequest, buildSearchParams, formatDistance, formatMoney, unitLabel } from '../lib/api.js';

const demoPeople = [
  { _id: 'demo-c1', name: 'Ramesh Kumar', profession: 'Carpenter', experience: 5, rating: 4.8, reviewCount: 24, availability: true, expectedRate: 500, rateUnit: 'day', skills: ['Table making', 'Furniture repair'], location: { district: 'Rampur', state: 'Uttar Pradesh' } },
  { _id: 'demo-p1', name: 'Suresh Yadav', profession: 'Plumber', experience: 7, rating: 4.7, reviewCount: 18, availability: true, expectedRate: 350, rateUnit: 'hour', skills: ['Pipeline repair', 'Bathroom fittings'], location: { district: 'Rampur', state: 'Uttar Pradesh' } },
];
const demoJobs = [
  { _id: 'demo-j1', title: 'Build a dining table', profession: 'Carpenter', description: 'Make a sturdy six-seat table.', payment: 2500, paymentUnit: 'total', jobType: 'contract', duration: '2 days', location: { district: 'Rampur', state: 'Uttar Pradesh' }, customer: { name: 'Anil Sharma' } },
  { _id: 'demo-j2', title: 'Repair water pipeline', profession: 'Plumber', description: 'Fix a leaking kitchen pipeline.', payment: 900, paymentUnit: 'day', jobType: 'hourly', duration: 'A few hours', location: { district: 'Rampur', state: 'Uttar Pradesh' }, customer: { name: 'Sunita Devi' } },
];

const VIEWS = ['overview', 'profile', 'discover', 'activity'];
const viewFromHash = () => { const v = window.location.hash.replace('#', ''); return VIEWS.includes(v) ? v : 'overview'; };

// Lists of workers/jobs near the user's own PIN code (30 km). If that PIN can't be located, fall back to everything.
async function fetchNearby(path, pin, limit = 20) {
  if (pin) {
    try { return await apiRequest(`${path}?${buildSearchParams({ pin, radius: '30', limit })}`); }
    catch (error) { if (!/PIN/i.test(error.message)) throw error; }
  }
  return apiRequest(`${path}?limit=${limit}`);
}

async function loadDashboardData(worker) {
  const common = await apiRequest('/api/user/me');
  if (worker) {
    const [workerProfile, bookingData, applicationData, jobData] = await Promise.all([
      apiRequest('/api/workers/me'), apiRequest('/api/booking/my'), apiRequest('/api/applications/my'), fetchNearby('/api/jobs', common.user?.pinCode),
    ]);
    return { profile: workerProfile.worker, bookings: bookingData.bookings || [], applications: applicationData.applications || [], openJobs: jobData.jobs || [] };
  }
  const [bookingData, myJobData, workerData] = await Promise.all([
    apiRequest('/api/booking/my'), apiRequest('/api/jobs/my'), fetchNearby('/api/workers', common.user?.pinCode),
  ]);
  return { profile: common.user, bookings: bookingData.bookings || [], myJobs: myJobData.jobs || [], workers: workerData.workers || [] };
}

function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => {
    const previous = document.activeElement;
    const first = ref.current?.querySelector('input, textarea, select, button:not(.dialog-close)') || ref.current;
    first?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') { closeRef.current(); return; }
      if (event.key !== 'Tab' || !ref.current) return;   // keep keyboard focus inside the dialog
      const items = [...ref.current.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea')];
      if (!items.length) return;
      const firstItem = items[0]; const lastItem = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) { event.preventDefault(); lastItem.focus(); }
      else if (!event.shiftKey && document.activeElement === lastItem) { event.preventDefault(); firstItem.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, []);
  return <div className="dialog-backdrop" role="presentation" onClick={onClose}><section ref={ref} tabIndex={-1} className="action-dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}><div className="dialog-heading"><h2>{title}</h2><button type="button" className="dialog-close" onClick={onClose} aria-label="Close">×</button></div>{children}</section></div>;
}

export default function DashboardPage({ lang, setLang, role, user, onHome, intent = null, onIntentUsed, onSignOut, demo, announce, notice = '' }) {
  // The current page lives in the URL hash (/dashboard#profile) so Back/Forward and refresh stay on the same page
  const [activeView, setActiveViewState] = useState(viewFromHash);
  const setActiveView = useCallback((view) => {
    if (viewFromHash() !== view) window.history.pushState({}, '', `/dashboard${view === 'overview' ? '' : `#${view}`}`);
    setActiveViewState(view);
    window.scrollTo({ top: 0 });
  }, []);
  useEffect(() => {
    const sync = () => setActiveViewState(viewFromHash());
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => { window.removeEventListener('popstate', sync); window.removeEventListener('hashchange', sync); };
  }, []);
  const [profile, setProfile] = useState(user || {});
  const [workers, setWorkers] = useState(demo ? demoPeople : []);
  const [openJobs, setOpenJobs] = useState(demo ? demoJobs : []);
  const [loading, setLoading] = useState(!demo);
  const [bookings, setBookings] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [applicants, setApplicants] = useState({});
  // Contact / Apply clicked on the home page: open that form straight away
  const [modal, setModal] = useState(() => (intent ? (intent.type === 'booking' ? 'booking' : 'apply') : ''));
  const [target, setTarget] = useState(() => intent?.item || null);
  const [findResults, setFindResults] = useState(null);   // results of a search on the Find page (null = show the default nearby list)
  const [findQuery, setFindQuery] = useState('');
  const [findPin, setFindPin] = useState(null);           // null = use the account's PIN code
  const [findRadius, setFindRadius] = useState('30');
  const [findBusy, setFindBusy] = useState(false);
  const [findNote, setFindNote] = useState(null);
  useEffect(() => { if (intent) onIntentUsed?.(); }, [intent, onIntentUsed]);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const worker = role === 'worker';

  // Data loading lives in a plain function so effects can call it without setting state synchronously
  const applyData = useCallback((data) => {
    setProfile(data.profile);
    if (data.bookings) setBookings(data.bookings);
    if (data.applications) setApplications(data.applications);
    if (data.openJobs) setOpenJobs(data.openJobs);
    if (data.myJobs) setMyJobs(data.myJobs);
    if (data.workers) setWorkers(data.workers);
  }, []);

  const refresh = useCallback(() => loadDashboardData(worker)
    .then(applyData)
    .catch((error) => announce(error.message))
    .finally(() => setLoading(false)), [worker, applyData, announce]);

  useEffect(() => {
    if (demo) return undefined;
    let cancelled = false;
    loadDashboardData(worker)
      .then((data) => { if (!cancelled) applyData(data); })
      .catch((error) => { if (!cancelled) announce(error.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [demo, worker, applyData, announce]);

  const findList = findResults ?? (worker ? openJobs : workers);
  const runFind = async (event) => {
    event.preventDefault();
    if (demo) { announce('Search needs a real account connected to the backend.'); return; }
    setFindBusy(true);
    try {
      const params = buildSearchParams({ q: findQuery, pin: findPin ?? profile.pinCode ?? '', radius: findRadius, limit: 30 });
      const data = await apiRequest(`${worker ? '/api/jobs' : '/api/workers'}?${params}`);
      setFindResults(worker ? data.jobs || [] : data.workers || []);
      setFindNote(data.geo || null);
    } catch (error) { announce(error.message); }
    finally { setFindBusy(false); }
  };

  const doAction = async (path, options, success) => {
    if (demo) { announce('This action needs a real account connected to the backend.'); return; }
    try { await apiRequest(path, options); announce(success); setModal(''); await refresh(); }
    catch (error) { announce(error.message); }
  };

  const saveProfile = async (next) => {
    if (demo) { setProfile(next); announce('Demo profile updated for this session.'); return; }
    const body = { ...next, age: next.age ? Number(next.age) : undefined, experience: next.experience === '' ? undefined : Number(next.experience), expectedRate: next.expectedRate === '' ? undefined : Number(next.expectedRate) };
    // Workers use the worker endpoint (it also covers the shared account fields); customers use the account endpoint
    if (worker) {
      const { worker: savedWorker } = await apiRequest('/api/workers/me', { method: 'PUT', body });
      setProfile(savedWorker);
    } else {
      const { user: saved } = await apiRequest('/api/user/me', { method: 'PUT', body });
      setProfile(saved);
    }
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

  const loadApplicants = async (job, nextModal = 'applicants') => {
    if (demo) { announce('Applicant details appear after a worker applies to a posted job.'); return; }
    try { const response = await apiRequest(`/api/jobs/${job._id}/applications`); setApplicants((current) => ({ ...current, [job._id]: response.applications || [] })); setTarget(job); setModal(nextModal); }
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
    <SiteHeader mode="dashboard" role={role} lang={lang} setLang={setLang} t={{}} demo={demo} initials={initials} onHome={() => setActiveView('overview')}/>
    <div className="dashboard-shell wrap">
      <aside className="dashboard-sidebar">
        <div className="sidebar-user"><ProfileCompletion profile={{ initials, profilePhoto: profile.profileImage }} completion={completion} onClick={() => setActiveView('profile')}/><button className="sidebar-user-name" onClick={() => setActiveView('profile')}><strong>{displayName}</strong><span>{worker ? profile.profession || 'Worker' : 'Local customer'} · {locationLabel}</span></button></div>
        {worker && <button className={`availability-toggle ${profile.availability ? 'is-available' : ''}`} type="button" onClick={setAvailability} disabled={availabilityBusy || demo}><span/>{profile.availability ? 'Available for work' : 'Not available'}</button>}
        <button className={`sidebar-link ${activeView === 'overview' ? 'active' : ''}`} onClick={() => setActiveView('overview')}><Home size={17}/> Overview</button>
        <button className={`sidebar-link ${activeView === 'profile' ? 'active' : ''}`} onClick={() => setActiveView('profile')}><UserRound size={17}/> My profile</button>
        <button className={`sidebar-link ${activeView === 'discover' ? 'active' : ''}`} onClick={() => setActiveView('discover')}>{worker ? <BriefcaseBusiness size={17}/> : <Search size={17}/>} {worker ? 'Find work' : 'Find workers'}</button>
        <button className={`sidebar-link ${activeView === 'activity' ? 'active' : ''}`} onClick={() => setActiveView('activity')}><CalendarDays size={17}/> {worker ? 'My work' : 'My requests & jobs'}</button>
        <button className="sidebar-link" onClick={onHome}><Globe size={17}/> Home page</button>
        <button className="sidebar-link sidebar-logout" onClick={onSignOut}><LogOut size={17}/> Sign out</button>
      </aside>
      <main className="dashboard-content">
        {loading && <p className="empty-state" role="status">Loading your dashboard…</p>}
        {activeView === 'profile' ? <ProfilePage key={`${profile._id || profile.id || 'me'}-${profile.updatedAt || ''}`} profile={{ ...profile, initials, area: locationLabel }} worker={worker} editable onSave={saveProfile} announce={announce}/> : activeView === 'discover' ? <>
          <div className="dashboard-welcome"><div><div className="eyebrow eyebrow-muted">LOCAL MARKETPLACE <span className="eyebrow-dot"/></div><h1>{worker ? 'Find work nearby' : 'Find local workers'}</h1><p>{worker ? 'Browse open jobs and apply when the work is right for you.' : 'Discover available workers and send a direct request.'}</p></div>{!worker && <button className="button button-dark" onClick={() => setModal('post-job')}><Plus size={16}/> Post a long-term job</button>}</div>
          <form className="find-form" onSubmit={runFind}>
            <label>Search<input value={findQuery} onChange={(event) => setFindQuery(event.target.value)} placeholder={worker ? 'e.g. carpentry, farm work' : 'e.g. carpenter, electrician'} aria-label="Search"/></label>
            <label>PIN code<input value={findPin ?? profile.pinCode ?? ''} onChange={(event) => setFindPin(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" maxLength={6} placeholder="Your PIN code" aria-label="PIN code"/></label>
            <label>Distance<select value={findRadius} onChange={(event) => setFindRadius(event.target.value)} aria-label="Distance">{['10', '20', '30', '50', '100'].map((km) => <option key={km} value={km}>Within {km} km</option>)}<option value="any">Any distance</option></select></label>
            <button className="button button-dark" type="submit" disabled={findBusy}>{findBusy ? 'Searching…' : 'Search'}</button>
          </form>
          <p className="search-hint">{findNote ? `Showing ${worker ? 'jobs' : 'workers'} within ${findNote.radiusKm} km of PIN ${findNote.pinCode}, nearest first.` : (findResults && findRadius === 'any') ? 'Showing results from everywhere.' : profile.pinCode ? `Showing ${worker ? 'jobs' : 'workers'} within 30 km of your PIN code ${profile.pinCode}, nearest first.` : 'Add your PIN code in My profile to see only people and jobs near you.'}</p>
          <div className="dashboard-list">{worker ? findList.map((job) => <article className="dashboard-list-row" key={job._id}><Avatar initials={(job.customer?.name || 'UC').slice(0, 2).toUpperCase()} color="gold"/><div className="dashboard-row-main"><strong>{job.title}</strong><span>{job.profession} · {job.location?.district}, {job.location?.state} · {job.duration || job.jobType}{job.distanceKm !== undefined && <> · <b className="distance-chip">{formatDistance(job.distanceKm)} away</b></>}</span></div><div className="dashboard-row-pay"><strong>{formatMoney(job.payment)}</strong><span>{unitLabel(job.paymentUnit)}</span></div><button onClick={() => { setTarget(job); setModal('apply'); }} aria-label="Apply to job"><ArrowUpRight size={17}/></button></article>) : findList.map((person) => <article className="dashboard-list-row" key={person._id}><Avatar initials={person.name?.slice(0, 2).toUpperCase()} color="sage"/><div className="dashboard-row-main"><strong>{person.name}</strong><span>{person.profession} · {person.location?.district || person.location?.village} · {person.experience || 0} years{person.distanceKm !== undefined && <> · <b className="distance-chip">{formatDistance(person.distanceKm)} away</b></>}</span></div><div className="dashboard-row-pay"><strong>{person.rating || 'New'} ★</strong><span>{person.reviewCount || 0} reviews</span></div><button onClick={() => { setTarget(person); setModal('booking'); }} aria-label="Request worker"><ArrowUpRight size={17}/></button></article>)}{!loading && !findList.length && <p className="empty-state">{findResults ? 'Nothing found. Try a wider distance, a different skill, or “Any distance”.' : worker ? 'No open jobs near you right now. Try a wider distance above.' : 'No workers near you yet. Try a wider distance above.'}</p>}</div>
        </> : activeView === 'activity' ? <>
          <div className="dashboard-welcome"><div><div className="eyebrow eyebrow-muted">YOUR ACTIVITY <span className="eyebrow-dot"/></div><h1>{worker ? 'My work' : 'Requests and jobs'}</h1><p>Review updates, applications and hiring activity.</p></div></div>
          {worker ? <><h2 className="activity-section-title">Quick job requests</h2>{bookings.map((booking) => <article className="dashboard-list-row" key={booking._id}><Avatar initials={(booking.customer?.name || 'C').slice(0, 2).toUpperCase()} color="gold"/><div className="dashboard-row-main"><strong>{booking.profession} · {booking.description}</strong><span>{booking.customer?.name} · {booking.location?.district || booking.location?.village} · {booking.status}</span></div><div className="dashboard-row-pay"><strong>{booking.budget ? formatMoney(booking.budget) : 'Discuss rate'}</strong><span>{booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'Flexible date'}</span></div><div className="row-actions">{booking.status === 'pending' && <><button onClick={() => statusAction(booking, 'accepted', 'booking')}>Accept</button><button onClick={() => statusAction(booking, 'rejected', 'booking')}>Decline</button></>}{booking.status === 'accepted' && <button onClick={() => statusAction(booking, 'completed', 'booking')}>Mark complete</button>}</div></article>)}{!loading && !bookings.length && <p className="empty-state">No quick job requests yet.</p>}<h2 className="activity-section-title">Job applications</h2>{applications.map((app) => <article className="dashboard-list-row" key={app._id}><Avatar initials={(app.job?.title || 'J').slice(0, 2).toUpperCase()} color="sage"/><div className="dashboard-row-main"><strong>{app.job?.title || 'Job application'}</strong><span>{app.job?.location?.district} · {app.status}</span></div><div className="dashboard-row-pay"><strong>{app.expectedRate ? formatMoney(app.expectedRate) : 'Rate discussed'}</strong><span>{app.job?.customer?.name || 'Employer'}{app.status === 'accepted' && app.job?.customer?.phone ? ` · ${app.job.customer.phone}` : ''}</span></div>{app.status === 'pending' && <button onClick={() => doAction(`/api/applications/${app._id}/withdraw`, { method: 'PUT' }, 'Application withdrawn.')}>Withdraw</button>}</article>)}{!loading && !applications.length && <p className="empty-state">You have not applied to any jobs yet. Use “Find work” to start.</p>}</> : <><h2 className="activity-section-title">Quick bookings</h2>{bookings.map((booking) => <article className="dashboard-list-row" key={booking._id}><Avatar initials={(booking.worker?.name || 'W').slice(0, 2).toUpperCase()} color="sage"/><div className="dashboard-row-main"><strong>{booking.profession} · {booking.description}</strong><span>{booking.worker?.name} · {booking.status}</span></div><div className="dashboard-row-pay"><strong>{booking.budget ? formatMoney(booking.budget) : 'Discuss rate'}</strong><span>{booking.location?.district || booking.location?.village}</span></div><div className="row-actions">{['pending', 'accepted'].includes(booking.status) && <button onClick={() => statusAction(booking, 'cancelled', 'booking')}>Cancel</button>}{booking.status === 'completed' && <button onClick={() => { setTarget(booking); setModal('review-booking'); }}>Leave review</button>}</div></article>)}{!loading && !bookings.length && <p className="empty-state">No requests yet. Use “Find workers” to hire someone.</p>}<h2 className="activity-section-title">Your posted jobs</h2>{myJobs.map((job) => <article className="dashboard-list-row" key={job._id}><Avatar initials="JB" color="gold"/><div className="dashboard-row-main"><strong>{job.title}</strong><span>{job.profession} · {job.location?.district} · {job.status} · {job.applicationCount || 0} applicants</span></div><div className="row-actions"><button onClick={() => loadApplicants(job)}>Applicants</button>{job.status === 'hired' && <button onClick={() => statusAction(job, 'completed', 'job')}>Mark complete</button>}{['open', 'hired'].includes(job.status) && <button onClick={() => statusAction(job, 'cancelled', 'job')}>Cancel</button>}{job.status === 'completed' && <button onClick={() => { loadApplicants(job, 'review-job'); }}>Review worker</button>}</div></article>)}{!loading && !myJobs.length && <p className="empty-state">You have not posted any jobs yet.</p>}</>}
        </> : <>
          <div className="dashboard-welcome"><div><div className="eyebrow eyebrow-muted">{new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()} <span className="eyebrow-dot"/></div><h1>{worker ? `Good to see you, ${displayName.split(' ')[0]}!` : `Welcome, ${displayName.split(' ')[0]}!`}</h1><p>{worker ? 'Here’s what’s happening with work in your area today.' : 'Here’s what’s happening in your neighbourhood today.'}</p></div><button className="button button-dark" onClick={() => worker ? setActiveView('profile') : setModal('post-job')}>{worker ? 'Edit my profile' : <><Plus size={16}/> Post a job</>}</button></div>
          <div className="dashboard-metrics">{metrics.map((item) => <article className="metric-card" key={item.label}><div className={`metric-icon ${item.tone}`}>{item.icon}</div><span>{item.label}</span><strong>{item.value}</strong><small>{item.hint}</small></article>)}</div>
          <section className="dashboard-panel"><div className="panel-heading"><div><span className="panel-kicker">{worker ? 'OPEN JOBS' : 'LOCAL TALENT'}</span><h2>{worker ? 'Opportunities for you' : 'Workers you may need'}</h2></div><button className="panel-link-button" onClick={() => setActiveView('discover')}>Explore all <ArrowRight size={14}/></button></div>
            <div className="dashboard-list">{(worker ? openJobs : workers).slice(0, 5).map((item) => <article className="dashboard-list-row" key={item._id}><Avatar initials={worker ? (item.customer?.name || 'UC').slice(0, 2).toUpperCase() : item.name?.slice(0, 2).toUpperCase()} color={worker ? 'gold' : 'sage'}/><div className="dashboard-row-main"><strong>{worker ? item.title : item.name}</strong><span>{worker ? `${item.profession} · ${item.location?.district || item.location?.village}` : `${item.profession} · ${item.location?.district || item.location?.village} · ${item.experience || 0} years`}</span></div><div className="dashboard-row-pay"><strong>{worker ? formatMoney(item.payment) : `${item.rating || 'New'} ★`}</strong><span>{worker ? unitLabel(item.paymentUnit) : `${item.reviewCount || 0} reviews`}</span></div><button onClick={() => worker ? (setTarget(item), setModal('apply')) : (setTarget(item), setModal('booking'))} aria-label={worker ? 'Apply to job' : 'Request worker'}><ArrowUpRight size={17}/></button></article>)}</div>
          </section>
          <div className="dashboard-bottom"><section className="dashboard-panel small-panel"><div className="panel-heading"><div><span className="panel-kicker">YOUR PROFILE</span><h2>{worker ? 'Help people find you' : 'Your location'}</h2></div><button onClick={() => setActiveView('profile')}><ArrowUpRight size={16}/></button></div><p>{worker ? 'A complete profile makes it easier for nearby customers to find your skills.' : 'Your location helps us show available workers and jobs in your area.'}</p><div className="profile-progress"><span><i style={{ width: `${completion}%` }}/></span><strong>{worker ? `Profile ${completion}% complete` : locationLabel}</strong></div></section>
            <section className="dashboard-panel small-panel activity-panel"><div className="panel-heading"><div><span className="panel-kicker">ACCOUNT STATUS</span><h2>{worker ? 'Availability' : 'Your marketplace'}</h2></div><Bell size={16}/></div><div className="activity-item"><span className="activity-dot"/><p>{worker ? (profile.availability ? 'Your profile is visible to nearby customers.' : 'Turn availability on when you are ready for work.') : `${bookings.length} quick job request${bookings.length === 1 ? '' : 's'} so far.`}<small>Updated from your account</small></p></div><div className="activity-item"><span className="activity-dot muted"/><p>{worker ? `${profile.rating || 0} average rating from ${profile.reviewCount || 0} reviews.` : `${myJobs.length} job post${myJobs.length === 1 ? '' : 's'} created.`}<small>Keep your profile current</small></p></div></section>
          </div>
        </>}
      </main>
    </div>
    <Toast message={notice}/>

    {modal === 'booking' && <Modal title={`Request ${target?.profession || 'worker'}`} onClose={() => setModal('')}><form className="action-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); doAction('/api/booking', { method: 'POST', body: { workerId: target._id, description: data.get('description'), location: { village: data.get('village'), district: data.get('district'), state: data.get('state') }, scheduledDate: data.get('date') || undefined, budget: data.get('budget') ? Number(data.get('budget')) : undefined } }, 'Your request was sent.'); }}><label>What work do you need?<textarea required name="description" placeholder="Describe the repair or work"/></label><label>Village / town<input required name="village" defaultValue={profile.location?.village || ''}/></label><div className="form-split"><label>District<input required name="district" defaultValue={profile.location?.district || ''}/></label><label>State<input required name="state" defaultValue={profile.location?.state || ''}/></label></div><label>Preferred date<input name="date" type="date" min={new Date().toISOString().slice(0, 10)}/></label><label>Budget (optional)<input name="budget" type="number" min="0" placeholder="₹"/></label><button className="button button-dark" type="submit">Send request</button></form></Modal>}
    {modal === 'post-job' && <Modal title="Post a longer job" onClose={() => setModal('')}><form className="action-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); doAction('/api/jobs', { method: 'POST', body: { title: data.get('title'), description: data.get('description'), profession: data.get('profession'), location: { village: data.get('village'), district: data.get('district'), state: data.get('state') }, pinCode: data.get('pinCode') || undefined, jobType: data.get('jobType'), duration: data.get('duration'), workingHours: data.get('hours'), startDate: data.get('startDate') || undefined, positions: Number(data.get('positions') || 1), payment: Number(data.get('payment')), paymentUnit: data.get('paymentUnit') } }, 'Your job was posted.'); }}><label>Job title<input name="title" required/></label><label>Description<textarea name="description" required/></label><label>Profession<input name="profession" required placeholder="Carpenter, plumber…"/></label><label>Village / town<input name="village" required defaultValue={profile.location?.village || ''}/></label><div className="form-split"><label>District<input name="district" required defaultValue={profile.location?.district}/></label><label>State<input name="state" required defaultValue={profile.location?.state}/></label></div><label>PIN code for the work location<input name="pinCode" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" defaultValue={profile.pinCode || ''}/></label><label>Job type<select name="jobType"><option value="contract">Fixed contract</option><option value="hourly">Hourly</option><option value="part-time">Part-time</option><option value="full-time">Full-time</option></select></label><div className="form-split"><label>Duration<input name="duration" placeholder="e.g. 1 month"/></label><label>Working hours<input name="hours" placeholder="e.g. 9am–5pm"/></label></div><div className="form-split"><label>Pay amount<input name="payment" type="number" min="0" required/></label><label>Pay unit<select name="paymentUnit"><option value="day">Per day</option><option value="hour">Per hour</option><option value="month">Per month</option><option value="total">Total</option></select></label></div><div className="form-split"><label>Positions<input name="positions" type="number" min="1" defaultValue="1"/></label><label>Start date<input name="startDate" type="date" min={new Date().toISOString().slice(0, 10)}/></label></div><button className="button button-dark" type="submit">Publish job</button></form></Modal>}
    {modal === 'apply' && <Modal title={`Apply: ${target?.title}`} onClose={() => setModal('')}><form className="action-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); doAction(`/api/jobs/${target._id}/apply`, { method: 'POST', body: { message: data.get('message'), expectedRate: data.get('rate') ? Number(data.get('rate')) : undefined } }, 'Your application was sent.'); }}><p>{target?.description}</p><label>Message (optional)<textarea name="message" placeholder="Introduce yourself and your experience"/></label><label>Your expected rate (optional)<input name="rate" type="number" min="0" placeholder="₹"/></label><button className="button button-dark" type="submit">Send application</button></form></Modal>}
    {modal === 'applicants' && <Modal title={`Applicants · ${target?.title}`} onClose={() => setModal('')}><div className="applicant-list">{(applicants[target?._id] || []).length ? applicants[target._id].map((app) => <article key={app._id}><Avatar initials={app.worker?.name?.slice(0, 2).toUpperCase()} color="sage"/><div><strong>{app.worker?.name}</strong><p>{app.worker?.profession} · {app.worker?.experience || 0} years · ★ {app.worker?.rating || 0}</p><small>{app.message || 'No message'} · {app.expectedRate ? `${formatMoney(app.expectedRate)} expected` : 'Rate not specified'}</small></div>{app.status === 'pending' && <div className="row-actions"><button onClick={() => changeApplication(app._id, 'accepted')}>Accept</button><button onClick={() => changeApplication(app._id, 'rejected')}>Decline</button></div>}<span>{app.status}</span></article>) : <p>No applicants yet.</p>}</div></Modal>}
    {(modal === 'review-booking' || modal === 'review-job') && <Modal title="Leave a review" onClose={() => setModal('')}><form className="action-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const body = { rating: Number(data.get('rating')), comment: data.get('comment') }; if (modal === 'review-booking') body.bookingId = target._id; else { body.jobId = target._id; body.workerId = data.get('workerId'); } doAction('/api/reviews', { method: 'POST', body }, 'Thank you. Your review was saved.'); }}><label>Rating<select name="rating"><option value="5">5 stars · Excellent</option><option value="4">4 stars · Good</option><option value="3">3 stars · Okay</option><option value="2">2 stars</option><option value="1">1 star</option></select></label>{modal === 'review-job' && <label>Hired worker<select name="workerId" required defaultValue=""> <option value="" disabled>Select an accepted applicant</option>{(applicants[target?._id] || []).filter((app) => app.status === 'accepted').map((app) => <option value={app.worker?._id} key={app._id}>{app.worker?.name} · {app.worker?.profession}</option>)}</select><button className="text-button" type="button" onClick={() => loadApplicants(target, 'review-job')}>Reload accepted workers</button></label>}<label>Comment<textarea name="comment"/></label><button className="button button-dark" type="submit">Submit review</button></form></Modal>}
  </div>;
}
