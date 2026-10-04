import { ArrowRight, ArrowUpRight, Check, MapPin, Wrench } from 'lucide-react';
import Avatar from './Avatar.jsx';

export default function HeroSection({ t, onSignup }) {
  return <section className="hero wrap">
    <div className="hero-copy">
      <div className="eyebrow"><span className="eyebrow-dot" />{t.eyebrow}</div>
      <h1>{t.titleA}<br /><span>{t.titleB}</span></h1>
      <p className="hero-intro">{t.intro}</p>
      <div className="hero-choices" id="choose"><div className="choice-label">{t.lookingFor}</div><div className="choice-buttons"><button onClick={() => onSignup('customer')} className="button button-dark">{t.hire}<ArrowRight size={16} /></button><button onClick={() => onSignup('worker')} className="button button-outline">{t.work}<ArrowRight size={16} /></button></div></div>
      <div className="community-note"><div className="mini-avatars"><Avatar initials="RK" color="sage" /><Avatar initials="SB" color="rose" /><Avatar initials="ML" color="gold" /></div><span><strong>People you can find.</strong> Work you can count on.</span></div>
    </div>
    <div className="hero-art" aria-label="Illustration of local workers and their community"><div className="art-top-note"><span className="art-note-icon"><MapPin size={15} /></span><span><strong>Good people,</strong><br />right around you</span></div><div className="sun-disc"/><div className="art-scene"><div className="scene-hill hill-back"/><div className="scene-hill hill-front"/><div className="house house-one"><div className="roof"/><div className="house-body"><span className="window"/><span className="door"/></div></div><div className="house house-two"><div className="roof"/><div className="house-body"><span className="window"/><span className="window second"/></div></div><div className="tree tree-one"><i/><b/></div><div className="tree tree-two"><i/><b/></div><div className="worker-figure figure-one"><div className="head"/><div className="body"><span className="arm arm-left"/><span className="arm arm-right"/></div><div className="legs"/></div><div className="worker-figure figure-two"><div className="head"/><div className="body"><span className="arm arm-left"/><span className="arm arm-right"/></div><div className="legs"/></div><div className="toolbox"><Wrench size={18}/></div><span className="sparkle spark-one">✳</span><span className="sparkle spark-two">✳</span></div><div className="art-bottom-note"><span className="check-circle"><Check size={13}/></span><span>Skills found. Work connected.</span><ArrowUpRight size={15}/></div><span className="art-scribble">nearby feels right</span></div>
  </section>;
}
