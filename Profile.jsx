import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const Profile = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [sessions, setSessions] = useState(0);
  const [streak, setStreak] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let name = localStorage.getItem("userName");
    if (!name) {
      name = "Anonymous";
      localStorage.setItem("userName", name);
    }
    setUsername(name);
    setBio(localStorage.getItem("userBio") || "");
    
    // Parse streak object or number
    let streakVal = 0;
    try {
        const streakData = JSON.parse(localStorage.getItem("studyStreak"));
        streakVal = streakData?.streak || 0;
    } catch(e) {
        streakVal = Number(localStorage.getItem("studyStreak") || 0);
    }
    setStreak(streakVal);

    setMinutes(Number(localStorage.getItem("totalMinutes") || 0));
    setSessions(Number(localStorage.getItem("todaySessions") || 0));
  }, []);

  const handleSave = () => {
    if (!username.trim()) return;
    localStorage.setItem("userName", username);
    localStorage.setItem("userBio", bio);
    setStatus('Saved');
    setTimeout(() => setStatus(''), 1200);
  };

  return (
    <>
      <div className="top" style={{height:'60px', display:'flex', alignItems:'center', gap:'12px', borderBottom:'1px solid rgba(255,255,255,0.08)', background:'rgba(17,17,17,0.95)', padding:'0 16px', backdropFilter:'blur(12px)'}}>
        <button className="back" style={{background:'transparent', border:'none', color:'#e5e7eb', fontSize:'22px', cursor:'pointer'}} onClick={() => navigate('/groups')}>←</button>
        <div style={{fontWeight:'700'}}>Profile</div>
      </div>

      <div className="page" style={{maxWidth:'520px', margin:'0 auto', padding:'20px 16px', paddingBottom: '80px'}}>
        <div className="card">
          <div className="avatar" style={{width:'104px', height:'104px', borderRadius:'50%', background:'rgba(18,18,18,0.8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'36px', fontWeight:'800', margin:'0 auto 16px', position:'relative', backdropFilter:'blur(8px)', boxShadow:'0 4px 16px rgba(0,0,0,0.3)'}}>
            {(username[0] || "?").toUpperCase()}
          </div>
          <div className="username" style={{fontWeight:'700', fontSize:'20px', textAlign:'center', marginBottom:'8px'}}>{username}</div>
          
          <div className="stats" style={{display:'flex', gap:'16px', margin:'16px 0', justifyContent:'center'}}>
            <div className="item" style={{background:'rgba(18,18,18,0.8)', borderRadius:'16px', padding:'14px 16px', textAlign:'center', minWidth:'80px'}}>
                <div style={{fontWeight:'700'}}>{sessions}</div>
                <div style={{fontSize:'12px', color:'#94a3b8'}}>Sessions</div>
            </div>
            <div className="item" style={{background:'rgba(18,18,18,0.8)', borderRadius:'16px', padding:'14px 16px', textAlign:'center', minWidth:'80px'}}>
                <div style={{fontWeight:'700'}}>{streak}</div>
                <div style={{fontSize:'12px', color:'#94a3b8'}}>Streak</div>
            </div>
            <div className="item" style={{background:'rgba(18,18,18,0.8)', borderRadius:'16px', padding:'14px 16px', textAlign:'center', minWidth:'80px'}}>
                <div style={{fontWeight:'700'}}>{minutes}</div>
                <div style={{fontSize:'12px', color:'#94a3b8'}}>Minutes</div>
            </div>
          </div>

          <div className="bio" style={{fontSize:'14px', color:'#cbd5e1', marginTop:'8px', whiteSpace:'pre-wrap', lineHeight:'1.6', textAlign:'center'}}>
            {bio || "No bio yet."}
          </div>

          <div className="btns" style={{display:'flex', gap:'10px', marginTop:'16px'}}>
            <button className="btn edit" style={{background:'#22c55e', color:'#022c22', fontWeight:'700', flex:1}} onClick={() => document.getElementById('nameInput')?.focus()}>Edit profile</button>
            <button className="btn" style={{background:'rgba(51,65,85,0.8)', color:'#e5e7eb', flex:1}} onClick={() => navigate('/settings')}>Settings</button>
          </div>
        </div>

        <div className="card">
          <div style={{fontWeight:'700', marginBottom:'6px'}}>Edit</div>
          <div className="field" style={{background:'rgba(18,18,18,0.8)', borderRadius:'16px', padding:'14px', marginTop:'12px'}}>
            <div className="muted" style={{fontSize:'12px', color:'#94a3b8', marginBottom:'8px'}}>Username</div>
            <input 
                id="nameInput"
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                style={{width:'100%', background:'rgba(15,15,15,0.8)', border:'none', borderRadius:'14px', color:'#e5e7eb', padding:'12px 14px', fontSize:'14px'}}
                placeholder="Enter a name"
            />
          </div>
          <div className="field" style={{background:'rgba(18,18,18,0.8)', borderRadius:'16px', padding:'14px', marginTop:'12px'}}>
            <div className="muted" style={{fontSize:'12px', color:'#94a3b8', marginBottom:'8px'}}>Bio</div>
            <textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                rows="3" 
                style={{width:'100%', background:'rgba(15,15,15,0.8)', border:'none', borderRadius:'14px', color:'#e5e7eb', padding:'12px 14px', fontSize:'14px'}}
                placeholder="Write something calm"
            />
          </div>
          <button className="btn edit" style={{background:'#22c55e', color:'#022c22', fontWeight:'700', marginTop:'12px', width:'100%'}} onClick={handleSave}>Save</button>
          <div className="muted" style={{textAlign:'center', marginTop:'8px'}}>{status}</div>
        </div>
      </div>
      <BottomNav />
    </>
  );
};

export default Profile;
