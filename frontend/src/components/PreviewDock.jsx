import { Eye } from 'lucide-react';

export default function PreviewDock({ mode = 'home', onPreview, onSwitch, onHome, role }) {
  return <div className="preview-dock">
    <Eye size={15}/>
    <span>{mode === 'dashboard' ? 'Temporary preview' : 'Building and testing?'}</span>
    {mode === 'dashboard' ? <>
      <button onClick={onSwitch}>Switch to {role === 'worker' ? 'customer' : 'worker'} view</button>
      <button onClick={onHome}>Back to homepage</button>
    </> : <>
      <button onClick={() => onPreview('worker')}>Preview worker page</button>
      <button onClick={() => onPreview('customer')}>Preview customer page</button>
    </>}
  </div>;
}
