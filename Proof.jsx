import React, { useEffect, useState } from 'react';

const Proof = () => {
  const [userName, setUserName] = useState('');
  const [date, setDate] = useState('');
  const [sessions, setSessions] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [consistency, setConsistency] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let n = localStorage.getItem('userName');
    if (!n) {
      n = 'Anonymous';
      localStorage.setItem('userName', n);
    }
    setUserName(n);
    setDate(new Date().toLocaleDateString());
    setSessions(localStorage.getItem("todaySessions") || 0);

    const hist = JSON.parse(localStorage.getItem('studyHistory')) || {};
    const total = Object.values(hist).reduce((a, b) => a + Number(b || 0), 0);
    setTotalSessions(total);

    const streakData = JSON.parse(localStorage.getItem('studyStreak')) || { streak: 0 };
    const streak = streakData.streak || 0;
    if (streak >= 10) setConsistency('Strong');
    else if (streak >= 4) setConsistency('Stable');
    else setConsistency('Growing');

  }, []);

  const handleShare = async () => {
    setStatus('Generating proof…');
    const card = document.getElementById('proof');
    if (card && window.html2canvas) {
      try {
        const canvas = await window.html2canvas(card);
        const blob = await new Promise(res => canvas.toBlob(res));
        
        if (navigator.share) {
            const file = new File([blob], "study-proof.png", { type: "image/png" });
            try {
                await navigator.share({ title: "My Study Proof", files: [file] });
                setStatus('');
                return;
            } catch (e) {
                console.log("Share failed or cancelled", e);
            }
        }

        const link = document.createElement('a');
        link.download = `study-proof-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        setStatus('Saved!');
        setTimeout(() => setStatus(''), 2000);
      } catch (e) {
        console.error(e);
        setStatus('Failed to generate image');
      }
    } else {
        setStatus('Library loading...');
    }
  };

  return (
    <div style={{
      background: '#020617',
      color: '#e5e7eb',
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh'
    }}>
      <div className="wrapper" style={{ textAlign: 'center' }}>
        <div className="card" id="proof" style={{
          background: '#0f172a',
          padding: '24px',
          borderRadius: '16px',
          width: '280px',
          color: '#e5e7eb',
          textAlign: 'left' 
        }}>
          <h3 style={{ marginBottom: '12px', textAlign: 'center' }}>📚 Study Proof</h3>
          <p style={{ margin: '6px 0' }}>Name: <b>{userName}</b></p>
          <p style={{ margin: '6px 0' }}>Date: <b>{date}</b></p>
          <p style={{ margin: '6px 0' }}>Sessions Today: <b>{sessions}</b></p>
          <div style={{ borderTop: '1px solid #334155', marginTop: '10px', paddingTop: '10px' }}>
            <p style={{ margin: '6px 0' }}>Total Sessions: <b>{totalSessions}</b></p>
            <p style={{ margin: '6px 0' }}>Consistency: <b>{consistency}</b></p>
          </div>
        </div>

        <button 
          onClick={handleShare}
          style={{
            marginTop: '14px',
            width: '100%',
            padding: '12px',
            border: 'none',
            borderRadius: '12px',
            background: '#22c55e',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Save / Share
        </button>
        <div className="status" style={{
          marginTop: '10px',
          fontSize: '13px',
          color: '#94a3b8',
          display: status ? 'block' : 'none'
        }}>
          {status}
        </div>
      </div>
    </div>
  );
};

export default Proof;
