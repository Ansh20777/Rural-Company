import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import SiteHeader from '../components/SiteHeader.jsx';
import Toast from '../components/Toast.jsx';

export default function LoginPage({ lang, setLang, form, setForm, onHome, onSubmit, onSignup, notice, busy = false }) {
  const [showPassword, setShowPassword] = useState(false);
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  return <div className={lang === 'hi' ? 'app hindi' : 'app'}>
    <SiteHeader lang={lang} setLang={setLang} t={{}} mode="auth" onHome={onHome}/>
    <main className="auth-layout wrap">
      <section className="auth-story">
        <button className="back-link" onClick={onHome}><ArrowLeft size={16}/> Back to home</button>
        <span className="eyebrow"><span className="eyebrow-dot"/> WELCOME BACK</span>
        <h1>Good work is closer than you think.</h1>
        <p>Sign in to continue finding local work or trusted help in your neighbourhood.</p>
        <div className="auth-story-art"><div className="auth-sun"/><div className="auth-house"><div/><span/><i/></div><div className="auth-person p-one"><b/><i/></div><div className="auth-person p-two"><b/><i/></div><div className="auth-hill"/></div>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-heading"><span className="auth-step">YOUR ACCOUNT</span><h2>Sign in</h2><p>Use the email and password you registered with.</p></div>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>Email address<input required type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" autoComplete="email"/></label>
          <label className="password-field">Password<input required type={showPassword ? 'text' : 'password'} value={form.password} onChange={update('password')} placeholder="Your password" autoComplete="current-password"/><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></label>
          <button className="button button-dark auth-submit" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={16}/></button>
        </form>
        <p className="auth-legal">New to Rural Company? <button className="inline-link" onClick={onSignup}>Create an account</button></p>
      </section>
    </main>
    <Toast message={notice}/>
  </div>;
}
