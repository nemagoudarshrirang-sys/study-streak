import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { db, firebase } from '../firebase';

const Home = () => {
  const navigate = useNavigate();
  const [timer, setTimer] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('Not started');
  const [streak, setStreak] = useState(0);
  const [todaySessions, setTodaySessions] = useState(0);
  const [showMoodOverlay, setShowMoodOverlay] = useState(false);
  const [mood, setMood] = useState('Neutral');
  const [breakMode, setBreakMode] = useState(false);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [intention, setIntention] = useState(localStorage.getItem('sessionIntention') || '');
  const [simpleMood, setSimpleMood] = useState(localStorage.getItem('simpleMood') || '');
  const [progressText, setProgressText] = useState('');
  const [weeklyHeights, setWeeklyHeights] = useState([]);
  const intervalRef = useRef(null);
  const breakIntervalRef = useRef(null);
  const reminderIntervalRef = useRef(null);

  // Load initial state
  useEffect(() => {
    // Load streak
    const streakData = JSON.parse(localStorage.getItem('studyStreak')) || { streak: 0 };
    setStreak(streakData.streak);

    // Load today sessions
    const savedDate = localStorage.getItem('todayDate');
    const today = new Date().toISOString().split('T')[0];
    if (savedDate !== today) {
      localStorage.setItem('todayDate', today);
      localStorage.setItem('todaySessions', 0);
      setTodaySessions(0);
    } else {
      setTodaySessions(Number(localStorage.getItem('todaySessions')) || 0);
    }

    // Load timer state
    const savedState = JSON.parse(localStorage.getItem('timer_state') || '{}');
    if (savedState && savedState.running) {
      setTimer(Number(savedState.totalSeconds));
      setRunning(true);
      setStatus('Studying...');
    } else if (savedState.totalSeconds) {
       setTimer(Number(savedState.totalSeconds));
    }

    // Reminder interval
    if ((localStorage.getItem("focusReminder") || "off") === "on") {
      reminderIntervalRef.current = setInterval(() => {
        if (running) {
          if ((localStorage.getItem("notifySilence") || "off") === "on") return;
          const currentMood = localStorage.getItem('sessionMood') || 'Neutral';
          let msg = "Gentle reminder: unclench the jaw, breathe, one task.";
          if (currentMood === 'Calm') msg = "Soft reminder: breathe and keep a gentle pace.";
          if (currentMood === 'Deep') msg = "Quiet reminder: protect your focus.";
          if (currentMood === 'Low') msg = "Gentle reminder: small steps are enough today.";
          
          const el = document.getElementById("gentleReminder");
          if (el) {
            el.textContent = msg;
            setTimeout(() => { el.textContent = ""; }, 10000);
          }
        }
      }, 25 * 60 * 1000);
    }

    return () => {
      clearInterval(reminderIntervalRef.current);
      leaveFocusRoom();
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (running) {
      enterFocusRoom();
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 0) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setStatus('Session complete ✅');
            leaveFocusRoom();
            completeSession();
            return durationByIntensity();
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      leaveFocusRoom();
    }

    return () => clearInterval(intervalRef.current);
  }, [running]);

  // Break Timer logic
  useEffect(() => {
    if (breakMode && breakSeconds > 0) {
      breakIntervalRef.current = setInterval(() => {
        setBreakSeconds((prev) => {
          if (prev <= 0) {
            clearInterval(breakIntervalRef.current);
            setBreakMode(false);
            setStatus('Break over. Ready?');
            
            // Auto Plan Logic
            if ((localStorage.getItem('autoPlan') || 'off') === 'on') {
               checkAutoPlanStart();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(breakIntervalRef.current);
    }
    return () => clearInterval(breakIntervalRef.current);
  }, [breakMode, breakSeconds]);

  // Persist timer state
  useEffect(() => {
    localStorage.setItem('timer_state', JSON.stringify({ running, totalSeconds: timer }));
  }, [timer, running]);

  const getUserName = () => {
    let n = localStorage.getItem("userName");
    if (!n) {
      n = "Anonymous";
      localStorage.setItem("userName", n);
    }
    return n;
  };

  const enterFocusRoom = () => {
    const code = localStorage.getItem("groupCode");
    if (!code || (localStorage.getItem("autoFocusRoom") || "on") !== "on") return;
    
    const user = getUserName();
    db.collection("groups").doc(code).update({
      [`activeSessions.${user}`]: { startedAt: firebase.firestore.FieldValue.serverTimestamp() }
    }).catch(e => console.log("Focus room enter error", e));
  };

  const leaveFocusRoom = () => {
    const code = localStorage.getItem("groupCode");
    if (!code) return;
    const user = getUserName();
    db.collection("groups").doc(code).update({
      [`activeSessions.${user}`]: firebase.firestore.FieldValue.delete()
    }).catch(() => {});
  };

  const checkAutoPlanStart = () => {
      const plan = JSON.parse(localStorage.getItem('plan')||'{}');
      const next = Object.entries(plan).find(([n,info])=> Number(info.done||0) < Number(info.target||0));
      if (!next) return;
      const name = next[0];
      localStorage.setItem('currentSubject', name);
      // Slight delay then start
      setTimeout(() => handleStart(), 1000);
  };

  const startBreak = (min) => {
    setBreakSeconds(min * 60);
    setBreakMode(true);
    setStatus(`Break ${min}m`);
  };

  const durationByIntensity = () => {
    const custom = Number(localStorage.getItem("sessionLength")||0);
    if(custom && custom>0) return custom*60;
    const m = localStorage.getItem("focusIntensity") || "Normal";
    if (m === "Light") return 15 * 60;
    if (m === "Deep") return 50 * 60;
    return 25 * 60;
  };

  const completeSession = () => {
    // Streak logic
    const data = JSON.parse(localStorage.getItem("studyStreak")) || { streak: 0, lastDate: null };
    const today = new Date().toISOString().split("T")[0];
    
    if (data.lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yDate = yesterday.toISOString().split("T")[0];

        if (data.lastDate === yDate) {
            data.streak += 1;
        } else {
            data.streak = Math.max(1, data.streak);
        }
        data.lastDate = today;
        localStorage.setItem("studyStreak", JSON.stringify(data));
        setStreak(data.streak);
    }

    // Today sessions
    const count = Number(localStorage.getItem("todaySessions")) || 0;
    localStorage.setItem("todaySessions", count + 1);
    setTodaySessions(count + 1);
    
    // History
    const history = JSON.parse(localStorage.getItem("studyHistory")) || {};
    history[today] = count + 1;
    localStorage.setItem("studyHistory", JSON.stringify(history));

    // Total minutes
    const durMin = Math.floor((durationByIntensity())/60);
    const total = Number(localStorage.getItem("totalMinutes")||0);
    localStorage.setItem("totalMinutes", total + durMin);

    // Subject tracking
    const subj = localStorage.getItem('currentSubject') || '';
    if (subj) {
      const subjects = JSON.parse(localStorage.getItem('subjects') || '{}');
      const s = subjects[subj] || { minutes: 0, sessions: 0, lastDate: null };
      s.minutes += durMin;
      s.sessions += 1;
      s.lastDate = today;
      subjects[subj] = s;
      localStorage.setItem('subjects', JSON.stringify(subjects));
    }

    // Plan progress
    const plan = JSON.parse(localStorage.getItem('plan') || '{}');
    if (subj && plan[subj]) {
      plan[subj].done = Math.min(plan[subj].target, (plan[subj].done || 0) + durMin);
      localStorage.setItem('plan', JSON.stringify(plan));
    }
    renderProgress();
  };

  const handleStart = () => {
    if (running) return;
    setRunning(true);
    setStatus('Studying… ' + (localStorage.getItem('sessionMood') || 'Neutral'));
  };

  const handlePause = () => {
    setRunning(false);
    setStatus('Paused');
  };

  const handleReset = () => {
    if (!window.confirm("Reset timer?")) return;
    setRunning(false);
    setTimer(durationByIntensity());
    setStatus('Not started');
  };

  const formatTime = (seconds) => {
    const min = String(Math.floor(seconds / 60)).padStart(2, "0");
    const sec = String(seconds % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

  const handleMoodSelect = (selectedMood) => {
    setMood(selectedMood);
    localStorage.setItem('sessionMood', selectedMood);
    setShowMoodOverlay(false);
  };

  const setSessionLength = (m) => {
    localStorage.setItem('sessionLength', m);
    if (!running) setTimer(m * 60);
  };

  const applySimpleMood = (m) => {
    setSimpleMood(m);
    localStorage.setItem('simpleMood', m);
    document.body.style.filter = m === 'Tired' ? 'brightness(0.9)' : (m === 'Energetic' ? 'brightness(1.0) saturate(1.05)' : '');
  };

  const renderProgress = () => {
    const total = Number(localStorage.getItem('totalMinutes') || 0);
    const sessionsToday = Number(localStorage.getItem('todaySessions') || 0);
    setProgressText(`Total: ${total} min · Today: ${sessionsToday} session(s)`);
    const hist = JSON.parse(localStorage.getItem('studyHistory') || '{}');
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    const max = Math.max(1, ...days.map(k => Number(hist[k] || 0)));
    const hs = days.map(k => {
      const v = Number(hist[k] || 0);
      return Math.max(3, Math.round((v / max) * 40));
    });
    setWeeklyHeights(hs);
  };

  useEffect(() => {
    renderProgress();
  }, []);

  useEffect(() => {
    const onStorage = () => renderProgress();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => console.log(e));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <>
      <div className="shell">
        <div className="topbar">
          <input id="homeSearch" className="search" placeholder="Search or ask…" />
        </div>
        <div className="avatars" id="homeAvatars"></div>
        
        <div className={`card ${running ? 'active-focus' : ''}`} id="app">
          <h2>Study Streak</h2>
          <div className="subtitle">25 minutes. No excuses.</div>

          <div className="timer" id="timer">
            {breakMode ? formatTime(breakSeconds) : formatTime(timer)}
          </div>

          <div className="buttons">
            {!breakMode && (
              <>
                <button className="start" onClick={handleStart}>Start</button>
                <button className="pause" onClick={handlePause}>Pause</button>
                <button className="reset" onClick={handleReset}>Reset</button>
              </>
            )}
            {breakMode && (
               <button className="reset" onClick={() => setBreakMode(false)}>End Break</button>
            )}
          </div>

          {/* Break Options - Show when not running and not in break mode */}
          {!running && !breakMode && (
            <div className="row" style={{marginTop:'15px', gap:'10px', justifyContent:'center'}}>
               <button className="mini-btn" onClick={() => startBreak(5)}>Break 5m</button>
               <button className="mini-btn" onClick={() => startBreak(10)}>Break 10m</button>
            </div>
          )}

          <div className="row" id="focusTimeRow" style={{marginTop:'10px', gap:'8px', justifyContent:'center'}}>
            {([15,25,50]).map(m => (
              <button
                key={m}
                className={`mini-btn ${Number(localStorage.getItem('sessionLength')||0)===m ? 'on' : ''}`}
                onClick={() => setSessionLength(m)}
                data-min={m}
              >
                {m}m
              </button>
            ))}
          </div>

          <div className="row" id="moodRow" style={{marginTop:'10px', gap:'8px', justifyContent:'center'}}>
            {(['Calm','Neutral','Energetic','Tired']).map(m => (
              <button
                key={m}
                className={`mini-btn ${simpleMood===m ? 'on' : ''}`}
                onClick={() => applySimpleMood(m)}
                data-mood={m}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="row" style={{marginTop:'10px', justifyContent:'center'}}>
            <input
              id="sessionIntentionInput"
              className="input-soft"
              placeholder="Session intention"
              value={intention}
              onChange={(e) => { setIntention(e.target.value); localStorage.setItem('sessionIntention', e.target.value.trim()); }}
              style={{maxWidth:'260px'}}
            />
          </div>

          <div className="status" id="status">{status}</div>
          <div className="streak" id="streak">Streak: {streak}</div>
          <div className="today">📘 Today: <span>{todaySessions}</span></div>
          <div className="reminder" id="gentleReminder"></div>

          <div className="row" style={{marginTop:'10px'}}>
            <button className="mini-btn" id="shieldBtn" onClick={toggleFullScreen}>Focus Shield</button>
          </div>
          <div className="today" id="focusShieldInfo"></div>
          <div className="sub" id="progressStats">{progressText}</div>
          <div className="row" id="weeklyBars" style={{gap:'6px', justifyContent:'center', alignItems:'flex-end', height:'50px', marginTop:'8px'}}>
            {weeklyHeights.map((h, i) => (
              <div key={i} className="bar" style={{width:'10px', height:`${h}px`, background:'rgba(255,255,255,0.2)', borderRadius:'8px'}} />
            ))}
          </div>

          <div className="nav">
            <button onClick={() => navigate('/notes')}>📝 Notes</button>
            <button onClick={() => navigate('/history')}>📊 History</button>
          </div>

          <button className="focus-hub" onClick={() => navigate('/focus')}>
            ⚙️ Focus Hub
          </button>

          <button className="focus-hub" onClick={() => navigate('/todays-plan')}>
            🗓️ Today’s Plan
          </button>
        </div>
        
        <BottomNav />
      </div>

      {showMoodOverlay && (
        <div className="mood-overlay" style={{display: 'flex'}}>
          <div className="mood-card">
            <div className="mood-title">Choose study mood</div>
            <button className="mood-btn" onClick={() => handleMoodSelect('Calm')}>Calm 🌿</button>
            <button className="mood-btn" onClick={() => handleMoodSelect('Neutral')}>Neutral ☁️</button>
            <button className="mood-btn" onClick={() => handleMoodSelect('Deep')}>Deep Focus 🔕</button>
            <button className="mood-btn" onClick={() => handleMoodSelect('Low')}>Low Energy 🌙</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
