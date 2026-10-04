import { ArrowRight, Anvil, Hammer, Wrench, Drill, Paintbrush, HardHat, Ruler, Shovel, PlugZap, Cog, Pipette, Construction } from 'lucide-react';

export default function HeroSection({ t, onSignup }) {
  const tools = [Hammer, Wrench, Drill, Paintbrush, HardHat, Ruler, Shovel, PlugZap, Cog, Pipette, Anvil, Construction];
  return <section className="hero hero-centered">
    <div className="hero-tools" aria-hidden="true">{tools.map((Tool, index) => <span className={`hero-tool tool-${index + 1}`} key={index}><Tool/></span>)}</div>
    <div className="hero-copy">
      <div className="eyebrow"><span className="eyebrow-dot" />{t.eyebrow}</div>
      <h1>{t.titleA}<br /><span>{t.titleB}</span></h1>
      <p className="hero-intro">{t.intro}</p>
      <div className="hero-choices" id="choose"><div className="choice-label">{t.lookingFor}</div><div className="choice-buttons"><button onClick={() => onSignup('customer')} className="button button-dark">{t.hire}<ArrowRight size={17} /></button><button onClick={() => onSignup('worker')} className="button button-outline">{t.work}<ArrowRight size={17} /></button></div></div>
    </div>
  </section>;
}
