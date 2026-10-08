import { useCallback, useEffect, useMemo, useState } from 'react';
import { copy } from './data/translations.js';
import LandingPage from './pages/LandingPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import { AUTH_EXPIRED_EVENT, apiRequest, buildSearchParams, clearToken, formatDistance, formatMoney, hasSession, saveToken, unitLabel } from './lib/api.js';

const emptyForm = { name: '', age: '', email: '', phone: '', password: '', profession: '', experience: '', address: '', village: '', district: '', state: '', pinCode: '', profilePhoto: '' };
const TONES = ['sage', 'rose', 'gold'];
const LANG_KEY = 'rural-company-lang';
const SCREEN_PATHS = { home: '/', login: '/login', signup: '/signup', dashboard: '/dashboard' };
const screenFromPath = (pathname) => {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return Object.keys(SCREEN_PATHS).find((key) => SCREEN_PATHS[key] === clean) || 'home';
};
const makeInitials = (name, fallback = 'RC') => name?.split(/\s+/).filter(Boolean).map((x) => x[0]).join('').slice(0, 2).toUpperCase() || fallback;

const readLang = () => { try { return window.localStorage.getItem(LANG_KEY) === 'hi' ? 'hi' : 'en'; } catch { return 'en'; } };

export default function App() {
  const [lang, setLang] = useState(readLang);
  const [screen, setScreen] = useState(() => screenFromPath(window.location.pathname));
  const [role, setRole] = useState('worker');
  const [form, setForm] = useState(emptyForm);
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(() => hasSession());   // true while a saved session is being restored
  const [busy, setBusy] = useState(false);                              // login / signup in flight
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [searchFilters, setSearchFilters] = useState({ profession: '', minRate: '', maxRate: '', minExperience: '', maxExperience: '', available: '', workType: '', jobType: '', minPay: '', maxPay: '' });
  const [pinInput, setPin] = useState(null);       // null = untouched, so the signed-in user's own PIN code is used
  const [radius, setRadius] = useState('30');       // km, or 'any'
  const [geoNote, setGeoNote] = useState(null);     // what the last distance search actually covered
  const [intent, setIntent] = useState(null);       // 'Contact'/'Apply' clicked on the home page -> opens the form in the dashboard
  const [people, setPeople] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [totals, setTotals] = useState(null);
  const [notice, setNotice] = useState('');
  const t = copy[lang];

  const announce = useCallback((message) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? '' : current)), 4000);
  }, []);

  // ---- language: remembered between visits and declared on <html> for screen readers / fonts ----
  useEffect(() => {
    document.documentElement.lang = lang;
    try { window.localStorage.setItem(LANG_KEY, lang); } catch { /* storage unavailable */ }
  }, [lang]);

  // ---- tiny history-based router: real URLs, working Back button ----
  const navigate = useCallback((next, { replace = false } = {}) => {
    const path = SCREEN_PATHS[next] || '/';
    if (window.location.pathname !== path) window.history[replace ? 'replaceState' : 'pushState']({}, '', path);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openSignup = (nextRole) => { if (user) { navigate('dashboard'); return; } if (nextRole) setRole(nextRole); navigate('signup'); };
  const openLogin = (nextRole) => { if (user) { navigate('dashboard'); return; } if (nextRole) setRole(nextRole); navigate('login'); };
  const goHome = () => navigate('home');
  const openDashboard = (nextUser) => {
    setUser(nextUser);
    setRole(nextUser.role);
    navigate('dashboard');
  };

  useEffect(() => {
    const onPop = () => setScreen(screenFromPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // ---- restore a saved session on page load ----
  useEffect(() => {
    if (!hasSession()) return;
    apiRequest('/api/user/me', { notifyExpired: false })
      .then(({ user: current }) => { setUser(current); setRole(current.role); if (window.location.pathname === '/login' || window.location.pathname === '/signup') navigate('dashboard', { replace: true }); })
      .catch(() => { clearToken(); })
      .finally(() => setBooting(false));
  }, [navigate]);

  // ---- a logged-in request was rejected (token expired / invalid) ----
  useEffect(() => {
    const onExpired = () => {
      setUser(null); setForm(emptyForm);
      navigate('login', { replace: true });
      announce('Your session has expired. Please sign in again.');
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [navigate, announce]);

  // ---- never show the dashboard without a user (unless it is a developer preview) ----
  const dashboardBlocked = screen === 'dashboard' && !user && !booting;
  useEffect(() => {
    if (dashboardBlocked && window.location.pathname !== SCREEN_PATHS.login) window.history.replaceState({}, '', SCREEN_PATHS.login);
  }, [dashboardBlocked]);
  // Signed-in users never see login/signup: they stay in their dashboard until they sign out
  const alreadySignedIn = Boolean(user) && (screen === 'login' || screen === 'signup');
  useEffect(() => {
    if (alreadySignedIn) window.history.replaceState({}, '', SCREEN_PATHS.dashboard);
  }, [alreadySignedIn]);
  const activeScreen = dashboardBlocked ? 'login' : alreadySignedIn ? 'dashboard' : screen;

  // ---- public discovery ----
  const fetchListings = useCallback(async (q, place, pin = '', km = '30', filters = {}) => {
    const params = buildSearchParams({ q, place, pin, radius: km, filters });
    const [workerData, jobData] = await Promise.all([
      apiRequest(`/api/workers?${params.toString()}`, { token: null }),
      apiRequest(`/api/jobs?${params.toString()}`, { token: null }),
    ]);
    return { workers: workerData.workers || [], jobs: jobData.jobs || [], workerTotal: workerData.total, jobTotal: jobData.total, geo: workerData.geo || jobData.geo || null };
  }, []);

  const applyListings = useCallback(({ workers, jobs: jobList, workerTotal, jobTotal, geo }, filtered) => {
    setPeople(workers); setJobs(jobList); setGeoNote(geo);
    // Totals describe the whole marketplace, so only update them for an unfiltered load
    if (!filtered) {
      const areas = new Set([...workers.map((w) => w.location?.district), ...jobList.map((j) => j.location?.district)].filter(Boolean).map((d) => d.toLowerCase()));
      setTotals({ workers: workerTotal ?? workers.length, jobs: jobTotal ?? jobList.length, areas: areas.size });
    }
  }, []);

  // Load on start, and again whenever the signed-in user changes: people who are logged in see what is within 30 km of their own PIN code
  const ownPin = user?.pinCode || '';
  useEffect(() => {
    let cancelled = false;
    fetchListings('', '', ownPin, '30')
      .then((data) => { if (!cancelled) applyListings(data, Boolean(ownPin)); })
      .catch(() => fetchListings('', ''))   // e.g. a PIN we cannot locate: fall back to everything
      .then((data) => { if (!cancelled && data) applyListings(data, Boolean(ownPin)); })
      .catch((error) => { if (!cancelled) announce(error.message); });
    return () => { cancelled = true; };
  }, [fetchListings, applyListings, announce, ownPin]);

  const search = async () => {
    setSearching(true);
    // Typing a place is an explicit area search; don't silently intersect it with the
    // signed-in user's default PIN radius. A PIN typed into the PIN field still applies.
    const pin = pinInput ?? (location.trim() ? '' : ownPin);
    const activeFilters = Object.fromEntries(Object.entries(searchFilters).filter(([, value]) => value !== ''));
    try { applyListings(await fetchListings(query, location, pin, radius, activeFilters), Boolean(query.trim() || location.trim() || (pin && radius !== 'any') || Object.keys(activeFilters).length)); }
    catch (error) { announce(error.message); }
    finally { setSearching(false); }
  };

  // ---- auth ----
  const submitSignup = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const registered = await apiRequest('/api/user/register', { method: 'POST', token: null, body: {
        name: form.name.trim(), age: Number(form.age), email: form.email.trim(), phone: form.phone.trim(), password: form.password, role,
        address: form.address.trim(), pinCode: form.pinCode.trim(), location: { village: form.village.trim(), district: form.district.trim(), state: form.state.trim() },
        ...(role === 'worker' ? { profession: form.profession, experience: Number(form.experience) } : {}),
      } });
      const result = await apiRequest('/api/user/login', { method: 'POST', token: null, body: { email: form.email.trim(), password: form.password } });
      saveToken(result.token); setForm(emptyForm); openDashboard(result.user); announce(registered.warning ? `Your account is ready. ${registered.warning}` : 'Your account is ready.');
    } catch (error) { announce(error.message); }
    finally { setBusy(false); }
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const result = await apiRequest('/api/user/login', { method: 'POST', token: null, body: { email: form.email.trim(), password: form.password } });
      saveToken(result.token); setForm(emptyForm); openDashboard(result.user); announce('Welcome back.');
    } catch (error) { announce(error.message); }
    finally { setBusy(false); }
  };

  const signOut = () => { apiRequest('/api/user/logout', { method: 'POST', notifyExpired: false }).catch(() => {}); clearToken(); setUser(null); setForm(emptyForm); goHome(); };

  // ---- display models for the landing page ----
  const normalizedPeople = useMemo(() => people.map((person, index) => ({
    ...person, id: person._id, initials: makeInitials(person.name, 'RC'),
    role: person.profession || 'Local worker', exp: person.experience ? `${person.experience} year${person.experience === 1 ? '' : 's'} experience` : 'Experience not listed',
    work: person.bio || (person.skills || []).join(', ') || 'Local skilled work', tags: person.skills || [], area: person.location?.district || person.location?.village || 'Nearby',
    distance: formatDistance(person.distanceKm),
    rate: person.expectedRate ? formatMoney(person.expectedRate) : 'Rate negotiable',
    unit: person.expectedRate ? t[person.rateUnit === 'hour' ? 'perHour' : person.rateUnit === 'month' ? 'perMonth' : 'perDay'] : '',
    color: TONES[index % TONES.length], tone: TONES[index % TONES.length],
  })), [people, t]);
  const normalizedJobs = useMemo(() => jobs.map((job, index) => ({
    ...job, id: job._id, title: job.title, poster: job.customer?.name || 'Local employer', category: job.profession,
    place: job.location?.district || job.location?.village || 'Nearby', duration: job.duration || job.jobType,
    distance: formatDistance(job.distanceKm),
    pay: formatMoney(job.payment), kind: unitLabel(job.paymentUnit), initials: makeInitials(job.customer?.name, 'RC'), tone: TONES[(index + 2) % TONES.length],
  })), [jobs]);

  if (booting) return <div className="loading-screen" role="status"><span><i aria-hidden="true" />Loading…</span></div>;

  if (activeScreen === 'signup') return <SignupPage lang={lang} setLang={setLang} role={role} setRole={setRole} form={form} setForm={setForm} onHome={goHome} onSubmit={submitSignup} notice={notice} onLogin={() => openLogin(role)} busy={busy} />;
  if (activeScreen === 'login') return <LoginPage lang={lang} setLang={setLang} form={form} setForm={setForm} onHome={goHome} onSubmit={submitLogin} onSignup={() => openSignup(role)} notice={notice} busy={busy} />;
  if (activeScreen === 'dashboard' && user) return <DashboardPage key={user._id || user.id} lang={lang} setLang={setLang} role={role} user={user} onHome={goHome} intent={intent} onIntentUsed={() => setIntent(null)} onSignOut={signOut} announce={announce} notice={notice} />;
  return <LandingPage lang={lang} setLang={setLang} t={t} query={query} setQuery={setQuery} location={location} setLocation={setLocation} searchFilters={searchFilters} setSearchFilters={setSearchFilters} people={normalizedPeople} jobs={normalizedJobs} stats={totals} searching={searching} pin={pinInput ?? ownPin} setPin={setPin} radius={radius} setRadius={setRadius} geoNote={geoNote} signedIn={Boolean(user)} onDashboard={() => navigate('dashboard')} notice={notice} onSearch={search} onSignup={openSignup} onLogin={() => openLogin('worker')} onContact={(person) => {
    if (!user) { announce('Please sign in as a customer to contact workers.'); openLogin('customer'); return; }
    if (user.role !== 'customer') { announce('You are signed in as a worker. Only customer accounts can hire workers.'); return; }
    setIntent({ type: 'booking', item: person }); navigate('dashboard');
  }} onJob={(job) => {
    if (!user) { announce('Please sign in as a worker to apply for jobs.'); openLogin('worker'); return; }
    if (user.role !== 'worker') { announce('You are signed in as a customer. Only worker accounts can apply for jobs.'); return; }
    setIntent({ type: 'apply', item: job }); navigate('dashboard');
  }} />;
}
