export default function SiteFooter({ t }) {
  return <footer className="footer"><div className="wrap footer-main"><a className="brand footer-brand" href="#top"><span className="brand-mark"><span /></span><span>rural<span className="brand-light">company</span></span></a><span>{t.footerLine}</span><div className="footer-links"><a href="#discover">{t.navFind}</a><a href="#jobs">{t.navJobs}</a><a href="#how">{t.navHow}</a></div></div><div className="wrap footer-bottom"><span>© 2026 Rural Company</span><span>{t.made} <span className="heart">♥</span></span></div></footer>;
}
