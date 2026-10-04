import { useMemo, useState } from 'react';
import { copy } from './data/translations.js';
import { jobs as sampleJobs, people as samplePeople } from './data/marketplace.js';
import LandingPage from './pages/LandingPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

const emptyForm = { name: '', age: '', email: '', phone: '', password: '', profession: '', experience: '', address: '', pinCode: '', profilePhoto: '' };

export default function App() {
  const [lang, setLang] = useState('en');
  const [screen, setScreen] = useState('home');
  const [role, setRole] = useState('worker');
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [notice, setNotice] = useState('');
  const t = copy[lang];

  const filteredPeople = useMemo(() => samplePeople.filter((person) => {
    const searchable = `${person.name} ${t[person.role]} ${t[person.work]} ${person.area} ${person.tags.join(' ')}`.toLowerCase();
    return searchable.includes(query.toLowerCase()) && (!location || person.area.toLowerCase().includes(location.toLowerCase()));
  }), [query, location, t]);

  const filteredJobs = useMemo(() => sampleJobs.filter((job) => {
    const searchable = `${job.title} ${t[job.category]} ${t[job.kind]} ${job.place} ${job.poster}`.toLowerCase();
    return searchable.includes(query.toLowerCase()) && (!location || job.place.toLowerCase().includes(location.toLowerCase()));
  }), [query, location, t]);

  const announce = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2800);
  };
  const openSignup = (nextRole) => { setRole(nextRole); setScreen('signup'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openDashboard = (nextRole) => { setRole(nextRole); setScreen('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goHome = () => { setScreen('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const submitSignup = (event) => { event.preventDefault(); openDashboard(role); };

  if (screen === 'signup') return <SignupPage
    lang={lang} setLang={setLang} role={role} setRole={setRole} form={form} setForm={setForm}
    onHome={goHome} onSubmit={submitSignup} onPreview={openDashboard} notice={notice} announce={announce}
  />;

  if (screen === 'dashboard') return <DashboardPage
    lang={lang} setLang={setLang} role={role} form={form} people={samplePeople} jobs={sampleJobs}
    onHome={goHome} onSwitchRole={() => openDashboard(role === 'worker' ? 'customer' : 'worker')}
    onProfilePhotoChange={(profilePhoto) => setForm({ ...form, profilePhoto })}
    notice={notice} announce={announce}
  />;

  return <LandingPage
    lang={lang} setLang={setLang} t={t} query={query} setQuery={setQuery} location={location} setLocation={setLocation}
    people={filteredPeople} jobs={filteredJobs} onSignup={openSignup} onPreview={openDashboard}
    onLogin={() => openSignup('worker')}
  />;
}
