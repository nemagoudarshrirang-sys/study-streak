import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TodaysPlan = () => {
  const navigate = useNavigate();
  const [subjectName, setSubjectName] = useState('');
  const [minutes, setMinutes] = useState('');
  const [subjects, setSubjects] = useState({});
  const [plan, setPlan] = useState({});
  const [autoPlan, setAutoPlan] = useState(false);
  const [currentSubject, setCurrentSubject] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadData();
    const savedSubject = localStorage.getItem('currentSubject') || '';
    setCurrentSubject(savedSubject);
    setAutoPlan((localStorage.getItem('autoPlan') || 'off') === 'on');
  }, []);

  const loadData = () => {
    setSubjects(JSON.parse(localStorage.getItem('subjects') || '{}'));
    setPlan(JSON.parse(localStorage.getItem('plan') || '{}'));
  };

  const handleAddSubject = () => {
    if (!subjectName.trim() || !minutes) return;
    
    const newPlan = { ...plan };
    newPlan[subjectName] = { target: Number(minutes), done: Number(plan[subjectName]?.done || 0) };
    localStorage.setItem('plan', JSON.stringify(newPlan));
    
    // Also ensure it exists in subjects
    const newSubjects = { ...subjects };
    if (!newSubjects[subjectName]) {
        newSubjects[subjectName] = { minutes: 0, sessions: 0, lastDate: null };
        localStorage.setItem('subjects', JSON.stringify(newSubjects));
    }

    setStatus('Added');
    setTimeout(() => setStatus(''), 1200);
    
    setSubjectName('');
    setMinutes('');
    setCurrentSubject(subjectName);
    localStorage.setItem('currentSubject', subjectName);
    
    loadData();
  };

  const toggleAutoPlan = () => {
    const newState = !autoPlan;
    setAutoPlan(newState);
    localStorage.setItem('autoPlan', newState ? 'on' : 'off');
  };

  const handleSubjectChange = (e) => {
    const val = e.target.value;
    setCurrentSubject(val);
    localStorage.setItem('currentSubject', val);
  };

  const getTotalStats = () => {
    let totalTarget = 0, totalDone = 0;
    Object.values(plan).forEach(p => {
        totalTarget += Number(p.target || 0);
        totalDone += Number(p.done || 0);
    });
    const pct = totalTarget ? Math.round((totalDone / totalTarget) * 100) : 0;
    return totalTarget ? `Today: ${totalDone}/${totalTarget} min (${pct}%)` : '';
  };

  return (
    <div className="card">
      <h2>Today’s Plan</h2>
      <div className="row">
        <input 
            className="input-soft" 
            placeholder="Subject name" 
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
        />
      </div>
      <div className="row">
        <input 
            className="input-soft" 
            type="number" 
            min="5" 
            max="240" 
            placeholder="Target minutes" 
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
        />
        <button className="mini-btn" onClick={handleAddSubject}>Add</button>
        <button className={`mini-btn ${autoPlan ? 'on' : ''}`} onClick={toggleAutoPlan}>Auto</button>
      </div>
      <div className="sub" id="planStatus">{status || getTotalStats()}</div>
      
      <div className="list" style={{marginTop:'10px'}}>
        {Object.entries(subjects).map(([name, info]) => (
             <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{flex:1}}>{name}</span>
                <span>{info.minutes} min</span>
                <span style={{marginLeft:'8px', color:'#94a3b8'}}>Last {info.lastDate || '—'}</span>
             </div>
        ))}
      </div>

      <div className="row">
        <select className="input-soft" value={currentSubject} onChange={handleSubjectChange}>
            <option value="">No subject</option>
            {Object.keys(subjects).map(name => (
                <option key={name} value={name}>{name}</option>
            ))}
        </select>
      </div>
      
      <button className="back" onClick={() => navigate('/')}>← Back</button>
    </div>
  );
};

export default TodaysPlan;
