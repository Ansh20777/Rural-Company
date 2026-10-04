import { ArrowLeft, ArrowRight, Home, ShieldCheck, Wrench } from 'lucide-react';
import SiteHeader from '../components/SiteHeader.jsx';
import PreviewDock from '../components/PreviewDock.jsx';
import Toast from '../components/Toast.jsx';

export default function SignupPage({ lang, setLang, role, setRole, form, setForm, onHome, onSubmit, onPreview, notice, announce }) {
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  return <div className={lang === 'hi' ? 'app hindi' : 'app'}>
    <SiteHeader lang={lang} setLang={setLang} t={{}} mode="auth" onLogin={() => announce('Login will be connected with authentication later.')}/>
    <main className="auth-layout wrap">
      <section className="auth-story">
        <button className="back-link" onClick={onHome}><ArrowLeft size={16}/> Back to home</button>
        <span className="eyebrow"><span className="eyebrow-dot"/> YOUR COMMUNITY, YOUR NEXT STEP</span>
        <h1>{role === 'worker' ? 'Let your skills find their next opportunity.' : 'Find the right help, close to home.'}</h1>
        <p>{role === 'worker' ? 'Create your worker profile and connect with people looking for the work you do.' : 'Tell us where you are and discover skilled people in your neighbourhood.'}</p>
        <div className="auth-highlight"><div className="step-icon"><ShieldCheck size={20}/></div><div><strong>A simple place to begin</strong><span>Your details help us shape a useful local marketplace.</span></div></div>
        <div className="auth-story-art"><div className="auth-sun"/><div className="auth-house"><div/><span/><i/></div><div className="auth-person p-one"><b/><i/></div><div className="auth-person p-two"><b/><i/></div><div className="auth-hill"/></div>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-heading"><span className="auth-step">STEP 01 <span>OF 02</span></span><h2>Create your account</h2><p>Start with your contact details. It only takes a minute.</p></div>
        <div className="role-switch"><button className={role === 'worker' ? 'active' : ''} onClick={() => setRole('worker')}><Wrench size={15}/> I’m a worker</button><button className={role === 'customer' ? 'active' : ''} onClick={() => setRole('customer')}><Home size={15}/> I’m hiring</button></div>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>Full name<input required value={form.name} onChange={update('name')} placeholder="Enter your name"/></label>
          <label>Email address<input required type="email" value={form.email} onChange={update('email')} placeholder="you@example.com"/></label>
          <label>Contact number<input required type="tel" value={form.phone} onChange={update('phone')} placeholder="+91 00000 00000"/></label>
          <label>Password<input required type="password" minLength="6" value={form.password} onChange={update('password')} placeholder="At least 6 characters"/></label>
          {role === 'worker' ? <label>Your profession<select required value={form.profession} onChange={update('profession')}><option value="">Choose your profession</option><option>Carpenter</option><option>Plumber</option><option>Electrician</option><option>Farmer / farm worker</option><option>Driver</option><option>Other skilled work</option></select></label> : <label>Home address / location<input required value={form.address} onChange={update('address')} placeholder="Village, town or area"/></label>}
          <button className="button button-dark auth-submit" type="submit">Continue <ArrowRight size={16}/></button>
        </form>
        <div className="auth-divider"><span/>or continue with<span/></div>
        <div className="social-buttons"><button onClick={() => announce('Google sign-in will be connected later.')}>G&nbsp; Google</button><button onClick={() => announce('Facebook sign-in will be connected later.')}>f&nbsp; Facebook</button></div>
        <p className="auth-legal">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p>
      </section>
    </main>
    <PreviewDock onPreview={onPreview}/><Toast message={notice}/>
  </div>;
}
