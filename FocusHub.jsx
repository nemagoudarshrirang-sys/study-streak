import React from 'react';
import { useNavigate } from 'react-router-dom';

const FocusHub = () => {
  const navigate = useNavigate();

  return (
    <div className="card">
      <h1>⚙️ Focus Hub</h1>
      <div className="section">
        <div className="item" onClick={() => navigate('/settings')}>
          <span>🌿 Calm Mode</span>
          <small>Open</small>
        </div>
        <div className="item" style={{opacity: 0.7}}>
          <span>🎯 Deep Focus</span>
          <small>Open</small>
          <div className="coming-soon">Soon</div>
        </div>
        <div className="item" onClick={() => navigate('/focus-rules')}>
          <span>🎯 Deep Focus Rules</span>
          <small>Open</small>
        </div>
        <div className="item" style={{opacity: 0.7}}>
          <span>🌿 Break & Recovery</span>
          <small>Open</small>
          <div className="coming-soon">Soon</div>
        </div>
        <div className="item" style={{opacity: 0.7}}>
          <span>🧭 Progress & Reflection</span>
          <small>Open</small>
          <div className="coming-soon">Soon</div>
        </div>
        <div className="item" style={{opacity: 0.7}}>
          <span>🛡️ Safety & Wellbeing</span>
          <small>Open</small>
          <div className="coming-soon">Soon</div>
        </div>
        <div className="item" style={{opacity: 0.7}}>
          <span>⚙️ Advanced (Future)</span>
          <small>Open</small>
          <div className="coming-soon">Soon</div>
        </div>
        <div className="item" onClick={() => navigate('/mind-reset')}>
          <span>🧘 Mind Reset</span>
          <small>Open</small>
        </div>
        <div className="item" onClick={() => navigate('/history')}>
          <span>📊 Insights</span>
          <small>Open</small>
        </div>
        <div className="item" onClick={() => navigate('/settings')}>
          <span>⚙️ Settings</span>
          <small>Open</small>
        </div>
        <div className="item" onClick={() => navigate('/group-inbox')}>
          <span>👥 Study Groups</span>
          <small>Open</small>
        </div>
      </div>
      <button className="back" onClick={() => navigate('/')}>← Back</button>
    </div>
  );
};

export default FocusHub;
