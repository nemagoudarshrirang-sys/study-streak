import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FocusRules = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if ((localStorage.getItem('calmMode') || 'on') === 'on') {
      document.body.classList.add('calm');
    } else {
      document.body.classList.remove('calm');
    }
  }, []);

  return (
    <div className="card">
      <h2>🧠 Deep Focus Rules</h2>
      <div className="sub">Quiet clarity. Gentle guidance.</div>
      <div className="rule" style={{background:'#111827', padding:'12px', borderRadius:'14px', marginBottom:'10px'}}>Silence helps the mind settle.</div>
      <div className="rule" style={{background:'#111827', padding:'12px', borderRadius:'14px', marginBottom:'10px'}}>Put the phone face-down and away.</div>
      <div className="rule" style={{background:'#111827', padding:'12px', borderRadius:'14px', marginBottom:'10px'}}>One task only. No switching.</div>
      <div className="rule" style={{background:'#111827', padding:'12px', borderRadius:'14px', marginBottom:'10px'}}>Keep posture soft. Breathe gently.</div>
      <div className="rule" style={{background:'#111827', padding:'12px', borderRadius:'14px', marginBottom:'10px'}}>Accept thoughts; return to the task.</div>
      <div className="rule" style={{background:'#111827', padding:'12px', borderRadius:'14px', marginBottom:'10px'}}>Small steps count. Start small, continue.</div>
      <button className="back" onClick={() => navigate('/focus')}>← Back</button>
    </div>
  );
};

export default FocusRules;
