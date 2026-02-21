import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MindReset = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Ready');
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if ((localStorage.getItem('calmMode') || 'on') === 'on') {
      document.body.classList.add('calm');
    } else {
      document.body.classList.remove('calm');
    }
  }, []);

  const runStep = (label) => {
    return new Promise((resolve) => {
      setStatus(label);
      let n = 4;
      setCount(n);
      const t = setInterval(() => {
        n--;
        setCount(n);
        if (n <= 0) {
          clearInterval(t);
          resolve();
        }
      }, 1000);
    });
  };

  const handleStart = async () => {
    if (running) return;
    setRunning(true);
    for (let i = 0; i < 5; i++) {
      await runStep('Inhale');
      await runStep('Hold');
      await runStep('Exhale');
    }
    setStatus('Complete');
    setCount(0);
    setRunning(false);
  };

  return (
    <div className="card">
      <h2>🌬 Mind Reset</h2>
      <div className="sub">Gentle 4–4–4 breathing guide</div>
      <div className="status">{status}</div>
      <div className="count">{count}</div>
      <div className="gentle" style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>Breathe in… Hold… Breathe out…</div>
      <button style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '14px', background: '#22c55e', color: '#0b1a12', fontWeight: '600', cursor: 'pointer', marginTop: '10px' }} onClick={handleStart} disabled={running}>
        {running ? 'Breathing...' : 'Start Reset'}
      </button>
      <button className="back" onClick={() => navigate('/focus')}>I feel calmer now</button>
      <button className="back" onClick={() => navigate('/focus')}>← Back</button>
    </div>
  );
};

export default MindReset;
