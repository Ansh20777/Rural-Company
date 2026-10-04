import { useCallback, useEffect, useMemo, useState } from 'react';
import { copy } from './data/translations.js';
import LandingPage from './pages/LandingPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import { apiRequest, clearToken, getToken, saveToken } from './lib/api.js';

const emptyForm = { name: '', age: '', email: '', phone: '', password: '', profession: '', experience: '', address: '', pinCode: '', profilePhoto: '' };

export default function App() {
  const [lang, setLang] = useState('en');
  const [screen, setScreen] = useState('home');
  const [role, setRole] = useState('worker');
  const [form, setForm] = useState(emptyForm);
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [people, setPeople] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [notice, setNotice] = useState('');
  const t = copy[lang];

  const announce = useCallback((message) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => current === message ? '' : current), 3500);
  }, []);
  const openSignup = (nextRole) => { setRole(nextRole); setScreen('signup'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openLogin = (nextRole = role) => { setRole(nextRole); setScreen('login'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openDashboard = (nextUser, demo = false) => {
    if (demo) { clearToken(); setUser({ ...nextUser, demo: true }); setRole(nextUser.role); }
    else { setUser(nextUser); setRole(nextUser.role); }
    setScreen('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goHome = () => { setScreen('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  useEffect(() => {
    if (!getToken()) return;
    apiRequest('/api/user/me').then(({ user: current }) => {
      setUser(current); setRole(current.role); setScreen('dashboard');
    }).catch(() => { clearToken(); });
  }, []);

  const search = async () => {
    const q = new URLSearchParams();
    if (query.trim()) q.set('q', query.trim());
    if (location.trim()) q.set('district', location.trim());
    try {
      const [workerData, jobData] = await Promise.all([
        apiRequest(`/api/workers?${q.toString()}`), apiRequest(`/api/jobs?${q.toString()}`),
      ]);
      setPeople(workerData.workers || []); setJobs(jobData.jobs || []);
    } catch (error) { announce(error.message); }
  };

  useEffect(() => { search(); }, []); // initial public discovery; submit button refreshes filtered results

  const submitSignup = async (event) => {
    event.preventDefault();
    try {
      await apiRequest('/api/user/register', { method: 'POST', token: null, body: {
        name: form.name, age: Number(form.age), email: form.email, phone: form.phone, password: form.password, role,
        address: form.address, pinCode: form.pinCode, location: { village: form.address, district: form.district, state: form.state },
        ...(role === 'worker' ? { profession: form.profession, experience: Number(form.experience) } : {}),
      } });
      const result = await apiRequest('/api/user/login', { method: 'POST', token: null, body: { email: form.email, password: form.password } });
      saveToken(result.token); openDashboard(result.user); announce('Your account is ready.');
    } catch (error) { announce(error.message); }
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    try {
      const result = await apiRequest('/api/user/login', { method: 'POST', token: null, body: { email: form.email, password: form.password } });
      saveToken(result.token); setForm({ ...emptyForm, ...result.user }); setRole(result.user.role); openDashboard(result.user); announce('Welcome back.');
    } catch (error) { announce(error.message); }
  };

  const preview = (nextRole) => openDashboard({ ...emptyForm, name: nextRole === 'worker' ? 'Ramesh Kumar' : 'Anil Sharma', email: nextRole === 'worker' ? 'ramesh@example.in' : 'anil@example.in', phone: '+91 98765 43210', age: 34, address: 'Rampur, Uttar Pradesh', pinCode: '244901', profession: 'Carpenter', experience: 5, rating: 4.8, role: nextRole }, true);
  const signOut = () => { clearToken(); setUser(null); setForm(emptyForm); goHome(); };

  const normalizedPeople = useMemo(() => people.map((person) => ({
    ...person, id: person._id, initials: person.name?.split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase() || 'UC',
    role: person.profession || 'Local worker', exp: person.experience ? `${person.experience} years experience` : 'Experience not listed',
    work: person.bio || (person.skills || []).join(', ') || 'Local skilled work', tags: person.skills || [], area: person.location?.district || person.location?.village || 'Nearby',
    rate: person.expectedRate ? `₹${person.expectedRate}` : 'Rate negotiable', unit: person.rateUnit === 'hour' ? 'perHour' : 'perDay', color: 'sage', tone: 'sage',
  })), [people]);
  const normalizedJobs = useMemo(() => jobs.map((job) => ({
    ...job, id: job._id, title: job.title, poster: job.customer?.name || 'Local employer', category: job.profession,
    place: job.location?.district || job.location?.village || 'Nearby', duration: job.duration || job.jobType,
    pay: `₹${job.payment}`, kind: job.paymentUnit || job.jobType, initials: (job.customer?.name || 'UC').split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase(), tone: 'gold',
  })), [jobs]);

  if (screen === 'signup') return <SignupPage lang={lang} setLang={setLang} role={role} setRole={setRole} form={form} setForm={setForm} onHome={goHome} onSubmit={submitSignup} onPreview={preview} notice={notice} announce={announce} onLogin={() => openLogin(role)} />;
  if (screen === 'login') return <LoginPage lang={lang} setLang={setLang} role={role} setRole={setRole} form={form} setForm={setForm} onHome={goHome} onSubmit={submitLogin} onSignup={() => openSignup(role)} onPreview={preview} notice={notice} announce={announce} />;
  if (screen === 'dashboard') return <DashboardPage lang={lang} setLang={setLang} role={role} user={user || { ...form, role }} people={normalizedPeople} jobs={normalizedJobs} onHome={goHome} onSwitchRole={() => preview(role === 'worker' ? 'customer' : 'worker')} onSignOut={signOut} demo={Boolean(user?.demo)} announce={announce} notice={notice} />;
  return <LandingPage lang={lang} setLang={setLang} t={t} query={query} setQuery={setQuery} location={location} setLocation={setLocation} people={normalizedPeople} jobs={normalizedJobs} onSearch={search} onSignup={openSignup} onPreview={preview} onLogin={() => openLogin('worker')} onContact={(person) => { if (!getToken()) openLogin('customer'); else announce(`Request work from ${person.name} in your customer dashboard.`); }} onJob={(job) => { if (!getToken()) openLogin('worker'); else announce(`Apply to “${job.title}” from your worker dashboard.`); }} />;
}
