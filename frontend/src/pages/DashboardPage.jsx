import { ArrowRight, ArrowUpRight, Bell, BriefcaseBusiness, CalendarDays, Home, IndianRupee, LogOut, Plus, Search, Settings, UsersRound } from 'lucide-react';
import Avatar from '../components/Avatar.jsx';
import SiteHeader from '../components/SiteHeader.jsx';
import PreviewDock from '../components/PreviewDock.jsx';
import Toast from '../components/Toast.jsx';

export default function DashboardPage({ lang, setLang, role, form, people, jobs, onHome, onSwitchRole, notice, announce }) {
  const worker = role === 'worker';
  const metrics = worker
    ? [{ icon: <BriefcaseBusiness size={18}/>, label: 'New opportunities', value: '6', hint: '+2 this week', tone: 'sage' }, { icon: <CalendarDays size={18}/>, label: 'Upcoming work', value: '3 days', hint: 'Next job · Oct 7', tone: 'gold' }, { icon: <IndianRupee size={18}/>, label: 'Expected rate', value: '₹500', hint: 'Per day · editable', tone: 'rose' }]
    : [{ icon: <UsersRound size={18}/>, label: 'Workers nearby', value: '24', hint: 'Across 6 skills', tone: 'sage' }, { icon: <BriefcaseBusiness size={18}/>, label: 'Your open jobs', value: '2', hint: '1 new applicant', tone: 'gold' }, { icon: <IndianRupee size={18}/>, label: 'Typical day rate', value: '₹650', hint: 'Around your area', tone: 'rose' }];
  const displayName = worker ? (form.name || 'Ramesh Kumar') : (form.name || 'Anil Sharma');
  const displayedItems = worker ? jobs : people;
  return <div className={`${lang === 'hi' ? 'app hindi' : 'app'} dashboard-app`}>
    <SiteHeader mode="dashboard" role={role} lang={lang} setLang={setLang} t={{}}/>
    <div className="dashboard-shell wrap">
      <aside className="dashboard-sidebar">
        <div className="sidebar-user"><Avatar initials={worker ? 'RK' : 'AS'} color="sage" large/><strong>{displayName}</strong><span>{worker ? (form.profession || 'Carpenter') : 'Local customer'} · Rampur</span></div>
        <button className="sidebar-link active"><Home size={17}/> Overview</button>
        <button className="sidebar-link" onClick={() => announce('This demo section is ready for backend integration.')}>{worker ? <BriefcaseBusiness size={17}/> : <Search size={17}/>} {worker ? 'My opportunities' : 'Find workers'}</button>
        <button className="sidebar-link" onClick={() => announce('This demo section is ready for backend integration.')}><CalendarDays size={17}/> {worker ? 'My work' : 'My requests'}</button>
        <button className="sidebar-link" onClick={() => announce('Settings will be available soon.')}><Settings size={17}/> Settings</button>
        <button className="sidebar-link sidebar-logout" onClick={onHome}><LogOut size={17}/> Back to homepage</button>
      </aside>
      <main className="dashboard-content">
        <div className="dashboard-welcome"><div><div className="eyebrow eyebrow-muted">SUNDAY, OCTOBER 4, 2026 <span className="eyebrow-dot"/></div><h1>{worker ? `Good morning, ${form.name || 'Ramesh'}!` : `Welcome, ${form.name || 'Anil'}!`}</h1><p>{worker ? 'Here’s what’s happening with work in your area today.' : 'Here’s what’s happening in your neighbourhood today.'}</p></div><button className="button button-dark" onClick={() => announce(worker ? 'Profile editing will be available soon.' : 'Job posting will be available soon.')}>{worker ? 'Edit my profile' : <><Plus size={16}/> Post a job</>}</button></div>
        <div className="dashboard-metrics">{metrics.map((item) => <article className="metric-card" key={item.label}><div className={`metric-icon ${item.tone}`}>{item.icon}</div><span>{item.label}</span><strong>{item.value}</strong><small>{item.hint}</small></article>)}</div>
        <section className="dashboard-panel"><div className="panel-heading"><div><span className="panel-kicker">{worker ? 'GOOD MATCHES' : 'LOCAL TALENT'}</span><h2>{worker ? 'Opportunities for you' : 'Workers you may need'}</h2></div><a href="#discover" onClick={(event) => { event.preventDefault(); onHome(); setTimeout(() => document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' }), 50); }}>Explore all <ArrowRight size={14}/></a></div>
          <div className="dashboard-list">{displayedItems.map((item) => <article className="dashboard-list-row" key={worker ? item.title : item.name}><Avatar initials={worker ? item.initials : item.initials} color={worker ? item.tone : item.color}/><div className="dashboard-row-main"><strong>{worker ? item.title : item.name}</strong><span>{worker ? `${item.poster} · ${item.place}` : `${item.role} · ${item.area} · ${item.exp}`}</span></div><div className="dashboard-row-pay"><strong>{worker ? item.pay : item.rate}</strong><span>{worker ? (item.kind === 'jobDaily' ? 'for 3 days' : item.kind === 'jobHourly' ? 'for a few hours' : 'fixed contract') : `starting ${item.unit === 'perDay' ? 'per day' : 'per hour'}`}</span></div><button aria-label={worker ? 'View opportunity' : 'View worker'} onClick={() => announce(worker ? 'Opportunity details will be available soon.' : 'Worker profile will be available soon.')}><ArrowUpRight size={17}/></button></article>)}</div>
        </section>
        <div className="dashboard-bottom"><section className="dashboard-panel small-panel"><div className="panel-heading"><div><span className="panel-kicker">YOUR PROFILE</span><h2>{worker ? 'Help people find you' : 'Your location'}</h2></div><ArrowUpRight size={16}/></div><p>{worker ? 'A complete profile makes it easier for nearby customers to find the right skills.' : 'Your location helps us show you available workers and jobs in your area.'}</p><div className="profile-progress"><span><i/></span><strong>{worker ? 'Profile 65% complete' : 'Rampur, Uttar Pradesh'}</strong></div></section>
          <section className="dashboard-panel small-panel activity-panel"><div className="panel-heading"><div><span className="panel-kicker">RECENT ACTIVITY</span><h2>Looking good</h2></div><Bell size={16}/></div><div className="activity-item"><span className="activity-dot"/><p>{worker ? 'A new table-making job was posted nearby.' : 'A skilled carpenter is available in Rampur.'}<small>Today · 10:24 AM</small></p></div><div className="activity-item"><span className="activity-dot muted"/><p>{worker ? 'Your profile is visible to local customers.' : '3 new worker profiles match your area.'}<small>Yesterday</small></p></div></section>
        </div>
      </main>
    </div>
    <PreviewDock mode="dashboard" role={role} onSwitch={onSwitchRole} onHome={onHome}/><Toast message={notice}/>
  </div>;
}
