import { useEffect, useState } from 'react';
import SiteHeader from '../components/SiteHeader.jsx';
import HeroSection from '../components/HeroSection.jsx';
import { SearchSection, StatsSection, WorkerSection, JobsSection, HowItWorksSection, CommunityCallout } from '../components/MarketplaceSections.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import Toast from '../components/Toast.jsx';
import Avatar from '../components/Avatar.jsx';
import { apiRequest, formatMoney } from '../lib/api.js';

export default function LandingPage({ lang, setLang, t, query, setQuery, location, setLocation, searchFilters, setSearchFilters, people, jobs, onSignup, onLogin, onContact, onJob, onSearch, notice = '', stats, searching = false, signedIn = false, onDashboard, pin = '', setPin, radius = '30', setRadius, geoNote = null }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  useEffect(() => {
    if (!selectedWorker?._id) return undefined;
    let cancelled = false;
    apiRequest(`/api/reviews/worker/${selectedWorker._id}`, { token: null })
      .then((result) => { if (!cancelled) setReviews(result.reviews || []); })
      .catch(() => { if (!cancelled) setReviews([]); })
      .finally(() => { if (!cancelled) setReviewsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedWorker]);
  const openWorkerProfile = (worker) => {
    setReviews([]);
    setReviewsLoading(true);
    setSelectedWorker(worker);
  };
  const submitSearch = async (event) => { event.preventDefault(); await onSearch?.(); document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' }); };
  return <div className={lang === 'hi' ? 'app hindi' : 'app'}>
    <SiteHeader mode="landing" t={t} lang={lang} setLang={setLang} onLogin={onLogin} signedIn={signedIn} onDashboard={onDashboard} mobileMenu={mobileMenu} setMobileMenu={setMobileMenu}/>
    <main id="top"><HeroSection t={t} onSignup={onSignup}/><SearchSection t={t} query={query} setQuery={setQuery} location={location} setLocation={setLocation} filters={searchFilters} setFilters={setSearchFilters} onSearch={submitSearch} busy={searching} pin={pin} setPin={setPin} radius={radius} setRadius={setRadius} geoNote={geoNote}/><StatsSection t={t} stats={stats}/><WorkerSection t={t} people={people} onContact={(person) => onContact?.(person)} onViewProfile={openWorkerProfile}/><JobsSection t={t} jobs={jobs} onJob={(job) => onJob?.(job)}/><HowItWorksSection t={t}/><CommunityCallout t={t}/></main>
    <SiteFooter t={t}/><Toast message={notice}/>
    {selectedWorker && <div className="dialog-backdrop" role="presentation" onClick={() => setSelectedWorker(null)}><section className="action-dialog worker-detail-dialog" role="dialog" aria-modal="true" aria-label={`${selectedWorker.name} profile`} onClick={(event) => event.stopPropagation()}><div className="dialog-heading"><h2>Worker profile</h2><button type="button" className="dialog-close" onClick={() => setSelectedWorker(null)} aria-label="Close">×</button></div><div className="public-worker-head"><Avatar initials={selectedWorker.initials} color={selectedWorker.color} large/><div><h3>{selectedWorker.name}</h3><p>{selectedWorker.profession} · {selectedWorker.experience || 0} years · {selectedWorker.location?.village}, {selectedWorker.location?.district}, {selectedWorker.location?.state}</p><strong>★ {selectedWorker.rating || 0} · {selectedWorker.reviewCount || 0} reviews</strong></div></div><p>{selectedWorker.bio || 'This worker has not added a bio yet.'}</p><p><strong>Skills:</strong> {(selectedWorker.skills || []).join(', ') || 'Not listed'}</p><p><strong>Work types:</strong> {(selectedWorker.workTypes || []).join(', ') || 'Flexible'}</p><p><strong>Expected rate:</strong> {selectedWorker.expectedRate ? `${formatMoney(selectedWorker.expectedRate)} per ${selectedWorker.rateUnit}` : 'Discuss with worker'}</p><div className="public-reviews"><h3>Reviews</h3>{reviewsLoading ? <p>Loading reviews…</p> : reviews.length ? reviews.map((review) => <article key={review._id}><strong>{review.reviewer?.name || 'Customer'} · {'★'.repeat(review.rating)}</strong><p>{review.comment || 'No comment'}</p><small>{new Date(review.createdAt).toLocaleDateString()}</small></article>) : <p>No reviews yet.</p>}</div><button className="button button-dark" onClick={() => { const person = selectedWorker; setSelectedWorker(null); onContact?.(person); }}>Contact worker</button></section></div>}
  </div>;
}
