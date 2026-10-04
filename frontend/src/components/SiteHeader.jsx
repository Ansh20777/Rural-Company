import { ChevronDown, Menu, X, ArrowUpRight } from 'lucide-react';
import Avatar from './Avatar.jsx';

export default function SiteHeader({ t, lang, setLang, onLogin, mobileMenu, setMobileMenu, mode = 'landing', role }) {
  return <header className="topbar">
    <a className="brand" href="#top" aria-label="Urban Company home"><span className="brand-mark"><span /></span><span>urban<span className="brand-light">company</span></span></a>
    {mode === 'landing' && <nav className={mobileMenu ? 'nav nav-open' : 'nav'} aria-label="Main navigation">
      <a href="#discover" onClick={() => setMobileMenu(false)}>{t.navFind}</a><a href="#jobs" onClick={() => setMobileMenu(false)}>{t.navJobs}</a><a href="#how" onClick={() => setMobileMenu(false)}>{t.navHow}</a>
    </nav>}
    {mode === 'dashboard' && <div className="dashboard-header-label">{role === 'worker' ? 'WORKER SPACE' : 'CUSTOMER SPACE'} <span className="demo-badge">DEMO PREVIEW</span></div>}
    <div className="header-actions">
      <div className="language-select"><span className="language-symbol">अ</span><select aria-label="Choose language" value={lang} onChange={(event) => setLang(event.target.value)}><option value="en">English</option><option value="hi">हिन्दी</option></select><ChevronDown size={13} /></div>
      {mode === 'landing' && <><button className="text-button" onClick={onLogin}>{t.signIn}</button><a className="button button-dark button-small" href="#choose">{t.getStarted}<ArrowUpRight size={15} /></a></>}
      {mode === 'dashboard' && <Avatar initials={role === 'worker' ? 'RK' : 'AS'} color="sage"/>}
    </div>
    {mode === 'landing' && <button className="menu-toggle" aria-label="Toggle menu" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X size={21} /> : <Menu size={21} />}</button>}
  </header>;
}
