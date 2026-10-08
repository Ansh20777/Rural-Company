import { Menu, X, ArrowUpRight } from 'lucide-react';
import Avatar from './Avatar.jsx';

export default function SiteHeader({ t, lang, setLang, onLogin, mobileMenu, setMobileMenu, mode = 'landing', role, onHome, demo = false, initials = '', signedIn = false, onDashboard }) {
  return <header className="topbar">
    <a className="brand" href="/" aria-label="Rural Company home" onClick={(event) => { if (onHome) { event.preventDefault(); onHome(); } }}><span className="brand-mark"><span /></span><span>rural<span className="brand-light">company</span></span></a>
    {mode === 'landing' && <nav className={mobileMenu ? 'nav nav-open' : 'nav'} aria-label="Main navigation">
      <a href="#discover" onClick={() => setMobileMenu(false)}>{t.navFind}</a><a href="#jobs" onClick={() => setMobileMenu(false)}>{t.navJobs}</a><a href="#how" onClick={() => setMobileMenu(false)}>{t.navHow}</a>
    </nav>}
    {mode === 'dashboard' && <div className="dashboard-header-label">{role === 'worker' ? 'WORKER SPACE' : 'CUSTOMER SPACE'} {demo && <span className="demo-badge">DEMO PREVIEW</span>}</div>}
    <div className="header-actions">
      <button className="language-toggle" type="button" aria-label={`Switch language to ${lang === 'en' ? 'Hindi' : 'English'}`} onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}><span>{lang === 'en' ? 'EN' : 'हिं'}</span><span className="toggle-track"><i/></span><span>{lang === 'en' ? 'हिंदी' : 'EN'}</span></button>
      {mode === 'landing' && (signedIn
        ? <button className="button button-dark button-small" onClick={onDashboard}>My dashboard<ArrowUpRight size={15} /></button>
        : <><button className="text-button" onClick={onLogin}>{t.signIn}</button><a className="button button-dark button-small" href="#choose">{t.getStarted}<ArrowUpRight size={15} /></a></>)}
      {mode === 'dashboard' && <Avatar initials={initials || (role === 'worker' ? 'W' : 'C')} color="sage"/>}
    </div>
    {mode === 'landing' && <button className="menu-toggle" aria-label="Toggle menu" aria-expanded={mobileMenu} onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X size={21} /> : <Menu size={21} />}</button>}
  </header>;
}
