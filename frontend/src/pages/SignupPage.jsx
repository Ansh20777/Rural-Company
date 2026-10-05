import { useState } from 'react';
import { ArrowLeft, ArrowRight, Home, Wrench } from 'lucide-react';
import SiteHeader from '../components/SiteHeader.jsx';
import Toast from '../components/Toast.jsx';

export default function SignupPage({ lang, setLang, role, setRole, form, setForm, onHome, onSubmit, notice, onLogin, busy = false }) {
  const [showPassword, setShowPassword] = useState(false);
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  return <div className={lang === 'hi' ? 'app hindi' : 'app'}>
    <SiteHeader lang={lang} setLang={setLang} t={{}} mode="auth" onLogin={onLogin} onHome={onHome}/>
    <main className="auth-layout wrap">
      <section className="auth-story">
        <button className="back-link" onClick={onHome}><ArrowLeft size={16}/> Back to home</button>
        <span className="eyebrow"><span className="eyebrow-dot"/> YOUR COMMUNITY, YOUR NEXT STEP</span>
        <h1>{role === 'worker' ? 'Let your skills find their next opportunity.' : 'Find the right help, close to home.'}</h1>
        <p>{role === 'worker' ? 'Create your worker profile and connect with people looking for the work you do.' : 'Tell us where you are and discover skilled people in your neighbourhood.'}</p>
        <div className="auth-story-art"><div className="auth-sun"/><div className="auth-house"><div/><span/><i/></div><div className="auth-person p-one"><b/><i/></div><div className="auth-person p-two"><b/><i/></div><div className="auth-hill"/></div>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-heading"><span className="auth-step">NEW ACCOUNT</span><h2>Create your account</h2><p>It only takes a minute. We use your location to match you with local work.</p></div>
        <div className="role-switch"><button type="button" className={role === 'worker' ? 'active' : ''} onClick={() => setRole('worker')}><Wrench size={15}/> I’m a worker</button><button type="button" className={role === 'customer' ? 'active' : ''} onClick={() => setRole('customer')}><Home size={15}/> I’m hiring</button></div>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>Full name<input required value={form.name} onChange={update('name')} placeholder="Enter your name"/></label>
          <label>Age<input required type="number" min="18" max="100" inputMode="numeric" value={form.age} onChange={update('age')} placeholder="Your age"/></label>
          <label>Email address<input required type="email" autoComplete="email" value={form.email} onChange={update('email')} placeholder="you@example.com"/></label>
          <label>Contact number<input required type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={update('phone')} placeholder="+91 00000 00000"/></label>
          <label className="password-field">Password<input required type={showPassword ? 'text' : 'password'} minLength="6" maxLength="72" value={form.password} onChange={update('password')} placeholder="At least 6 characters" autoComplete="new-password"/><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></label>
          {role === 'worker' ? <>
            <label>Your profession<select required value={form.profession} onChange={update('profession')}><option value="">Choose your profession</option><option>Carpenter</option><option>Plumber</option><option>Electrician</option><option>Farmer / farm worker</option><option>Driver</option><option>Other skilled work</option></select></label>
            <label>Work experience (years)<input required type="number" min="0" max="60" value={form.experience} onChange={update('experience')} placeholder="e.g. 5"/></label>
          </> : null}
          <label>Home address<input required value={form.address} onChange={update('address')} placeholder="House, street and village"/></label>
          <label>District<input required value={form.district || ''} onChange={update('district')} placeholder="Your district"/></label>
          <label>State<input required value={form.state || ''} onChange={update('state')} placeholder="Your state"/></label>
          <label>PIN code<input required type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={form.pinCode} onChange={update('pinCode')} placeholder="6-digit PIN code"/></label>
          <button className="button button-dark auth-submit" type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'} <ArrowRight size={16}/></button>
        </form>
        <p className="auth-legal">Already have an account? <button className="inline-link" onClick={onLogin}>Sign in</button></p>
      </section>
    </main>
    <Toast message={notice}/>
  </div>;
}
