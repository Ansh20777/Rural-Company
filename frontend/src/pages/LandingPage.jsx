import { useState } from 'react';
import SiteHeader from '../components/SiteHeader.jsx';
import HeroSection from '../components/HeroSection.jsx';
import { SearchSection, StatsSection, WorkerSection, JobsSection, HowItWorksSection, CommunityCallout } from '../components/MarketplaceSections.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import Toast from '../components/Toast.jsx';

export default function LandingPage({ lang, setLang, t, query, setQuery, location, setLocation, people, jobs, onSignup, onLogin, onContact, onJob, onSearch, notice = '', stats, searching = false, signedIn = false, onDashboard, pin = '', setPin, radius = '30', setRadius, geoNote = null }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const submitSearch = async (event) => { event.preventDefault(); await onSearch?.(); document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' }); };
  return <div className={lang === 'hi' ? 'app hindi' : 'app'}>
    <SiteHeader mode="landing" t={t} lang={lang} setLang={setLang} onLogin={onLogin} signedIn={signedIn} onDashboard={onDashboard} mobileMenu={mobileMenu} setMobileMenu={setMobileMenu}/>
    <main id="top"><HeroSection t={t} onSignup={onSignup}/><SearchSection t={t} query={query} setQuery={setQuery} location={location} setLocation={setLocation} onSearch={submitSearch} busy={searching} pin={pin} setPin={setPin} radius={radius} setRadius={setRadius} geoNote={geoNote}/><StatsSection t={t} stats={stats}/><WorkerSection t={t} people={people} onContact={(person) => onContact?.(person)}/><JobsSection t={t} jobs={jobs} onJob={(job) => onJob?.(job)}/><HowItWorksSection t={t}/><CommunityCallout t={t}/></main>
    <SiteFooter t={t}/><Toast message={notice}/>
  </div>;
}
