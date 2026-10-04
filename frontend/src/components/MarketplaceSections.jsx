import { ArrowDownRight, ArrowRight, ArrowUpRight, BriefcaseBusiness, Clock3, MapPin, Search, ShieldCheck, UsersRound } from 'lucide-react';
import Avatar from './Avatar.jsx';

export function SearchSection({ t, categories, activeFilter, setActiveFilter, query, setQuery, location, setLocation, onSearch }) {
  return <section className="search-section wrap" aria-label="Search nearby workers and jobs"><form className="search-box" onSubmit={onSearch}>
    <label className="search-field"><Search size={19}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchPlaceholder} aria-label={t.searchPlaceholder}/></label><span className="search-divider"/><label className="location-field"><MapPin size={18}/><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder={t.locationPlaceholder} aria-label={t.locationPlaceholder}/></label><button className="button button-green" type="submit">{t.search}<ArrowRight size={15}/></button>
  </form><div className="popular-row"><span>{t.popular}</span>{categories.map((category) => <button key={category} className={activeFilter === category ? 'filter-chip selected' : 'filter-chip'} onClick={() => {setActiveFilter(category);setQuery(category === 'all' ? '' : t[category]);}}>{t[category]}</button>)}</div></section>;
}

export function StatsSection({ t }) {
  return <section className="stats-strip"><div className="wrap stats-inner"><div className="stats-intro"><span>{t.nearby}</span><h2>{t.trusted}</h2><p>{t.trustedSub}</p></div><div className="stat"><strong>250<span>+</span></strong><small>{t.workers}</small></div><div className="stat"><strong>80<span>+</span></strong><small>{t.jobs}</small></div><div className="stat"><strong>12</strong><small>{t.activeAreas}</small></div></div></section>;
}

export function WorkerSection({ t, people, onContact }) {
  return <section className="section wrap" id="discover"><div className="section-heading"><div><div className="eyebrow eyebrow-muted"><span className="eyebrow-dot"/>{t.nearby}</div><h2>{t.workersTitle}</h2><p>{t.workersSub}</p></div><a className="link-arrow" href="#workers">{t.viewWorkers}<ArrowUpRight size={16}/></a></div>
    <div className="card-grid worker-grid" id="workers">{people.length ? people.map((person) => <article className="worker-card" key={person.name}><div className="worker-card-top"><Avatar initials={person.initials} color={person.color} large/><span className="available-pill"><span/>{t.available}</span></div><div className="worker-name-row"><h3>{person.name}</h3><span className="verified-icon" title={t.verified}><ShieldCheck size={17}/></span></div><div className="worker-role">{t[person.role]} <span>·</span> {t[person.exp]}</div><p className="worker-work">{t[person.work]}</p><div className="tag-row">{person.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="card-footer"><span className="place"><MapPin size={14}/>{person.area}</span><span className="rate"><small>{t.from}</small> {person.rate}<small>{t[person.unit]}</small></span></div><button className="card-action" onClick={() => onContact(person.name)}>{t.contact}<ArrowRight size={15}/></button></article>) : <div className="empty-state">No workers match that search yet. Try a different skill or location.</div>}</div>
  </section>;
}

export function JobsSection({ t, jobs, onJob }) {
  return <section className="jobs-band" id="jobs"><div className="wrap section jobs-section"><div className="section-heading"><div><div className="eyebrow eyebrow-muted"><span className="eyebrow-dot"/>{t.nearby}</div><h2>{t.jobsTitle}</h2><p>{t.jobsSub}</p></div><a className="link-arrow" href="#jobs">{t.viewJobs}<ArrowUpRight size={16}/></a></div><div className="job-list">{jobs.length ? jobs.map((job) => <article className="job-card" key={job.title}><Avatar initials={job.initials} color={job.tone}/><div className="job-main"><h3>{job.title}</h3><div className="job-poster">{job.poster} <span>·</span> {t[job.category]}</div><div className="job-meta"><span><MapPin size={13}/>{job.place}</span><span><Clock3 size={13}/>{t[job.duration]}</span></div></div><div className="job-pay"><strong>{job.pay}</strong><span>{t[job.kind]}</span></div><button className="job-arrow" aria-label={t.apply} onClick={onJob}><ArrowUpRight size={19}/></button></article>) : <div className="empty-state">No jobs match that search yet. Try another skill or location.</div>}</div></div></section>;
}

export function HowItWorksSection({ t }) {
  return <section className="section wrap how-section" id="how"><div className="section-heading centered"><div><div className="eyebrow eyebrow-muted"><span className="eyebrow-dot"/>{t.navHow}</div><h2>{t.howTitle}</h2><p>{t.howSub}</p></div></div><div className="steps-grid"><article className="step-card"><span className="step-number">01</span><div className="step-icon"><UsersRound size={21}/></div><h3>{t.step1}</h3><p>{t.step1Text}</p><ArrowDownRight className="step-arrow" size={18}/></article><article className="step-card"><span className="step-number">02</span><div className="step-icon"><Search size={21}/></div><h3>{t.step2}</h3><p>{t.step2Text}</p><ArrowDownRight className="step-arrow" size={18}/></article><article className="step-card"><span className="step-number">03</span><div className="step-icon"><BriefcaseBusiness size={21}/></div><h3>{t.step3}</h3><p>{t.step3Text}</p><ArrowDownRight className="step-arrow" size={18}/></article></div></section>;
}

export function CommunityCallout({ t }) {
  return <section className="community-cta wrap"><div className="cta-decoration">✳</div><div><span className="cta-kicker">URBAN COMPANY</span><h2>{t.trustTitle}</h2><p>{t.trustText}</p></div><a href="#choose" className="button button-cream">{t.trustCta}<ArrowRight size={16}/></a></section>;
}
