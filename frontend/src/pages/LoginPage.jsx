import { ArrowLeft, ArrowRight, Home, Wrench } from 'lucide-react';
import SiteHeader from '../components/SiteHeader.jsx';
import PreviewDock from '../components/PreviewDock.jsx';
import Toast from '../components/Toast.jsx';

export default function LoginPage({ lang, setLang, role, setRole, form, setForm, onHome, onSubmit, onSignup, onPreview, notice }) {
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  return <div className={lang === 'hi' ? 'app hindi' : 'app'}>
    <SiteHeader lang={lang} setLang={setLang} t={{}} mode="auth"/>
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
        <div className="role-switch"><button className={role === 'worker' ? 'active' : ''} onClick={() => setRole('worker')}><Wrench size={15}/> I’m a worker</button><button className={role === 'customer' ? 'active' : ''} onClick={() => setRole('customer')}><Home size={15}/> I’m hiring</button></div>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>Email address<input required type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" autoComplete="email"/></label>
          <label>Password<input required type="password" value={form.password} onChange={update('password')} placeholder="Your password" autoComplete="current-password"/></label>
          <button className="button button-dark auth-submit" type="submit">Sign in <ArrowRight size={16}/></button>
        </form>
        <p className="auth-legal">New to Urban Company? <button className="inline-link" onClick={onSignup}>Create an account</button></p>
      </section>
    </main>
    <PreviewDock onPreview={onPreview}/><Toast message={notice}/>
  </div>;
}
