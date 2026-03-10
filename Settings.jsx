import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const Settings = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  
  // Settings State
  const [adaptiveFocus, setAdaptiveFocus] = useState(false);
  const [autoFocus, setAutoFocus] = useState(false);
  const [intention, setIntention] = useState('');
  const [mood, setMood] = useState('Neutral');
  const [sessionLength, setSessionLength] = useState('');
  const [focusReminder, setFocusReminder] = useState(false);
  const [dailyReflection, setDailyReflection] = useState('');
  const [calmMode, setCalmMode] = useState(false);
  const [lowContrast, setLowContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [notifySilence, setNotifySilence] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [lineSpacing, setLineSpacing] = useState('comfortable');
  const [themeVariant, setThemeVariant] = useState('soft-dark');

  // Load settings
  useEffect(() => {
    setAdaptiveFocus((localStorage.getItem('adaptiveFocus') || 'on') === 'on');
    setAutoFocus((localStorage.getItem('autoFocusRoom') || 'on') === 'on');
    setIntention(localStorage.getItem('dailyIntention') || '');
    setMood(localStorage.getItem('focusMood') || 'Neutral');
    setSessionLength(localStorage.getItem('sessionLength') || '');
    setFocusReminder((localStorage.getItem('focusReminder') || 'off') === 'on');
    setDailyReflection(localStorage.getItem('dailyReflection') || '');
    setCalmMode((localStorage.getItem('calmMode') || 'on') === 'on');
    setLowContrast((localStorage.getItem('accContrast') || 'off') === 'on');
    setReducedMotion((localStorage.getItem('accReduceMotion') || 'off') === 'on');
    setNotifySilence((localStorage.getItem('notifySilence') || 'off') === 'on');
    setFontSize(localStorage.getItem('fontSize') || 'medium');
    setLineSpacing(localStorage.getItem('lineSpacing') || 'comfortable');
    setThemeVariant(localStorage.getItem('themeVariant') || 'soft-dark');
  }, []);

  const saveSetting = (key, value) => {
    localStorage.setItem(key, value);
    setStatus('Saved');
    setTimeout(() => setStatus(''), 1200);
  };

  const handleToggle = (key, setter, value) => {
    const newValue = !value;
    setter(newValue);
    saveSetting(key, newValue ? 'on' : 'off');
    
    // Apply visual changes immediately where applicable
    if (key === 'calmMode') {
      if (newValue) document.body.classList.add('calm');
      else document.body.classList.remove('calm');
    }
  };

  const handleThemeChange = (val) => {
    setThemeVariant(val);
    saveSetting('themeVariant', val);
    // Apply theme
    if(val==='blue-dark'){
        document.documentElement.style.setProperty('--bg-gradient-start', '#1e3a5f');
        document.documentElement.style.setProperty('--bg-gradient-end', '#0a1a2e');
      }else if(val==='warm-dark'){
        document.documentElement.style.setProperty('--bg-gradient-start', '#2d1b1b');
        document.documentElement.style.setProperty('--bg-gradient-end', '#1a0f0f');
      } else {
        document.documentElement.style.setProperty('--bg-gradient-start', '#0f172a');
        document.documentElement.style.setProperty('--bg-gradient-end', '#020617');
      }
  }

  const handleClearData = () => {
    if (window.confirm("Clear all local data? This cannot be undone.")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  return (
    <>
      <div className="card">
        <h2>⚙ Focus Settings</h2>
        <div className="sub">Gentle controls for a calm experience</div>

        <div className="section">
          <div className="section-title">Study Settings</div>
          <div className="item">
            <div className="left"><div className="ic">⏱</div><span>Adaptive focus duration</span></div>
            <input type="checkbox" className="toggle" checked={adaptiveFocus} onChange={() => handleToggle('adaptiveFocus', setAdaptiveFocus, adaptiveFocus)} />
          </div>
          <div className="item">
            <div className="left"><div className="ic">🌱</div><span>Auto-start focus room</span></div>
            <input type="checkbox" className="toggle" checked={autoFocus} onChange={() => handleToggle('autoFocusRoom', setAutoFocus, autoFocus)} />
          </div>
          <div className="field">
            <div>Daily intention</div>
            <div className="muted">Shown at top of Focus Hub</div>
            <input value={intention} onChange={(e) => { setIntention(e.target.value); saveSetting('dailyIntention', e.target.value); }} placeholder="What is today’s main intention?" />
          </div>
          <div className="field">
            <div>Mood before study</div>
            <div className="muted">Select current mood</div>
            <div className="choices">
              {['Calm', 'Neutral', 'Stressed'].map(m => (
                <button key={m} className={mood === m ? 'on' : ''} onClick={() => { setMood(m); saveSetting('focusMood', m); }}>
                  {m === 'Calm' ? '😌' : m === 'Neutral' ? '😐' : '😣'} {m}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <div>Focus duration (minutes)</div>
            <div className="muted">Adjust freely</div>
            <input type="number" min="5" max="120" placeholder="e.g., 25" value={sessionLength} onChange={(e) => { setSessionLength(e.target.value); saveSetting('sessionLength', e.target.value); }} />
            <div className="choices" style={{marginTop:'8px'}}>
              {[15, 20, 25, 30, 35, 40].map(min => (
                <button key={min} className="preset" onClick={() => { setSessionLength(min); saveSetting('sessionLength', min); }}>{min}</button>
              ))}
            </div>
          </div>
          <div className="item">
            <span>Focus reminder</span>
            <input type="checkbox" className="toggle" checked={focusReminder} onChange={() => handleToggle('focusReminder', setFocusReminder, focusReminder)} />
          </div>
        </div>

        <div className="section">
          <div className="section-title">Progress & Reflection</div>
          <div className="item" onClick={() => navigate('/proof')}>
             <div className="left"><div className="ic">🧾</div><span>Study proof</span></div>
             <div><button className="btn">Open</button><span className="arrow">›</span></div>
          </div>
          <div className="item" onClick={() => navigate('/history')}>
             <div className="left"><div className="ic">📊</div><span>Today summary</span></div>
             <div><button className="btn">View</button><span className="arrow">›</span></div>
          </div>
          <div className="item">
            <div className="left"><div className="ic">🔥</div><span>Streak progress</span></div>
            <span className="muted">Shown on Home</span>
          </div>
          <div className="item" onClick={() => navigate('/notes')}>
             <div className="left"><div className="ic">📝</div><span>Session notes</span></div>
             <div><button className="btn">Open</button><span className="arrow">›</span></div>
          </div>
          <div className="field">
            <div>End-of-day reflection</div>
            <div className="muted">Optional · No guilt</div>
            <input value={dailyReflection} onChange={(e) => { setDailyReflection(e.target.value); saveSetting('dailyReflection', e.target.value); }} placeholder="One line reflection" />
          </div>
        </div>

        <div className="section">
          <div className="section-title">Visual & Calm</div>
          <div className="item">
            <div className="left"><div className="ic">🌿</div><span>Calm visual mode</span></div>
            <input type="checkbox" className="toggle" checked={calmMode} onChange={() => handleToggle('calmMode', setCalmMode, calmMode)} />
          </div>
          <div className="item">
            <div className="left"><div className="ic">◐</div><span>Low contrast mode</span></div>
            <input type="checkbox" className="toggle" checked={lowContrast} onChange={() => handleToggle('accContrast', setLowContrast, lowContrast)} />
          </div>
          <div className="item">
            <div className="left"><div className="ic">⚡</div><span>Reduced motion</span></div>
            <input type="checkbox" className="toggle" checked={reducedMotion} onChange={() => handleToggle('accReduceMotion', setReducedMotion, reducedMotion)} />
          </div>
          
           <div className="field">
            <div>Font size</div>
            <div className="muted">Adjust text size for comfort</div>
            <div className="choices">
              {['small', 'medium', 'large'].map(s => (
                <button key={s} className={fontSize === s ? 'on' : ''} onClick={() => { setFontSize(s); saveSetting('fontSize', s); }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <div>Line spacing</div>
            <div className="muted">Adjust line height for reading</div>
            <div className="choices">
              {['tight', 'comfortable', 'spacious'].map(s => (
                <button key={s} className={lineSpacing === s ? 'on' : ''} onClick={() => { setLineSpacing(s); saveSetting('lineSpacing', s); }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
              ))}
            </div>
          </div>
           <div className="field">
            <div>Theme variation</div>
            <div className="muted">Choose a calm color theme</div>
            <div className="choices">
              <button className={themeVariant === 'soft-dark' ? 'on' : ''} onClick={() => handleThemeChange('soft-dark')}>Soft Dark</button>
              <button className={themeVariant === 'blue-dark' ? 'on' : ''} onClick={() => handleThemeChange('blue-dark')}>Blue Dark</button>
              <button className={themeVariant === 'warm-dark' ? 'on' : ''} onClick={() => handleThemeChange('warm-dark')}>Warm Dark</button>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-title">Sound & Feedback</div>
          <div className="item">
            <div className="left"><div className="ic">🔕</div><span>Notification silence</span></div>
            <input type="checkbox" className="toggle" checked={notifySilence} onChange={() => handleToggle('notifySilence', setNotifySilence, notifySilence)} />
          </div>
        </div>

        <div className="section">
          <div className="section-title">Data & Safety</div>
          <div className="item"><div className="left"><div className="ic">📦</div><span>Offline data</span></div><span className="muted">Local settings only</span></div>
          <div className="item" onClick={() => navigate('/history')}>
            <div className="left"><div className="ic">🗂</div><span>History controls</span></div>
            <div><button className="btn">Open</button><span className="arrow">›</span></div>
          </div>
          <div className="item">
            <div className="left"><div className="ic">🧹</div><span>Clear data</span></div>
            <button className="btn" onClick={handleClearData}>Clear</button>
          </div>
        </div>

        <button className="back" onClick={() => navigate('/focus')}>← Back</button>
        <div className="muted" style={{marginTop:'6px', textAlign: 'center'}}>{status}</div>
      </div>
      <BottomNav />
    </>
  );
};

export default Settings;
