import { useState } from 'react';
import SiteHeader from '../components/SiteHeader.jsx';
import HeroSection from '../components/HeroSection.jsx';
import { SearchSection, StatsSection, WorkerSection, JobsSection, HowItWorksSection, CommunityCallout } from '../components/MarketplaceSections.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import PreviewDock from '../components/PreviewDock.jsx';
import Toast from '../components/Toast.jsx';

export default function LandingPage({ lang, setLang, t, categories, activeFilter, setActiveFilter, query, setQuery, location, setLocation, people, jobs, onSignup, onPreview, onLogin }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState('');
  const announce = (message) => { setNotice(message); window.setTimeout(() => setNotice(''), 2800); };
  const onSearch = (event) => { event.preventDefault(); document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' }); };
  return <div className={lang === 'hi' ? 'app hindi' : 'app'}>
    <SiteHeader mode="landing" t={t} lang={lang} setLang={setLang} onLogin={onLogin} mobileMenu={mobileMenu} setMobileMenu={setMobileMenu}/>
    <main id="top"><HeroSection t={t} onSignup={onSignup}/><SearchSection t={t} categories={categories} activeFilter={activeFilter} setActiveFilter={setActiveFilter} query={query} setQuery={setQuery} location={location} setLocation={setLocation} onSearch={onSearch}/><StatsSection t={t}/><WorkerSection t={t} people={people} onContact={(name) => announce(`Contact ${name} — coming soon.`)}/><JobsSection t={t} jobs={jobs} onJob={() => announce('Job details and applications will be available soon.')}/><HowItWorksSection t={t}/><CommunityCallout t={t}/></main>
    <SiteFooter t={t}/><PreviewDock onPreview={onPreview}/><Toast message={notice}/>
  </div>;
}
