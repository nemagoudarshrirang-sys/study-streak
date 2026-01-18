/* ================= TIMER STATE ================= */
let totalSeconds = 25 * 60;
let timer = null;
let running = false;
let inFocusRoom = false;
let breakRunning = false;
let breakSeconds = 0;
let wasPaused = false;

/* ================= ELEMENTS (SAFE) ================= */
const timerEl = document.getElementById("timer");
const statusEl = document.getElementById("status");
const streakEl = document.getElementById("streak");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const addFiveBtn = document.getElementById("addFiveBtn");
const focusTimeRow = document.getElementById("focusTimeRow");
const moodRow = document.getElementById("moodRow");
const intentionInput = document.getElementById("sessionIntentionInput");
const breakBox = document.getElementById("breakBox");
const breakStatus = document.getElementById("breakStatus");
const breakShortBtn = document.getElementById("breakShortBtn");
const breakLongBtn = document.getElementById("breakLongBtn");
const breakLongerBtn = document.getElementById("breakLongerBtn");
const shieldBtn = document.getElementById("shieldBtn");
const progressStats = document.getElementById("progressStats");
const weeklyBars = document.getElementById("weeklyBars");
const subjectSelect = document.getElementById("subjectSelect");
const subjectsList = document.getElementById("subjectsList");
const addSubjectBtn = document.getElementById("addSubjectBtn");
const newSubjectName = document.getElementById("newSubjectName");
const newSubjectMinutes = document.getElementById("newSubjectMinutes");
const planStatus = document.getElementById("planStatus");
const autoPlanToggle = document.getElementById("autoPlanToggle");

/* ================= DATE HELPERS ================= */
function todayDate() {
  return new Date().toISOString().split("T")[0];
}

/* ================= STREAK LOGIC ================= */
function getStreakData() {
  return JSON.parse(localStorage.getItem("studyStreak")) || {
    streak: 0,
    lastDate: null
  };
}

function saveStreak(data) {
  localStorage.setItem("studyStreak", JSON.stringify(data));
}

function updateStreakUI() {
  const data = getStreakData();
  if (streakEl) {
    streakEl.textContent = `Streak: ${data.streak}`;
  }
}

// reserved for future adaptive duration logic (moved to core modules)

function completeSession() {
  const data = getStreakData();
  const today = todayDate();

  if (data.lastDate === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yDate = yesterday.toISOString().split("T")[0];

  if (data.lastDate === yDate) {
    data.streak += 1;
  } else {
    // compassionate streak: paused, never broken
    data.streak = Math.max(1, data.streak);
  }

  data.lastDate = today;
  saveStreak(data);
  updateStreakUI();
  const durMin = Math.floor((durationByIntensity())/60);
  const total = Number(localStorage.getItem("totalMinutes")||0);
  localStorage.setItem("totalMinutes", total + durMin);
  const sessionsToday = Number(localStorage.getItem('todaySessions'))||0;
  if (breakBox) {
    breakBox.style.display = "block";
    if (breakStatus) breakStatus.textContent = "Breathe. Water. Stretch.";
  }
  // Subject tracking
  let subj = '';
  if (subjectSelect && subjectSelect.value) subj = subjectSelect.value; else subj = localStorage.getItem('currentSubject')||'';
  if (subj){
    const subjects = JSON.parse(localStorage.getItem('subjects')||'{}');
    const s = subjects[subj]||{ minutes:0, sessions:0, lastDate:null };
    s.minutes += durMin;
    s.sessions += 1;
    s.lastDate = todayDate();
    subjects[subj] = s;
    localStorage.setItem('subjects', JSON.stringify(subjects));
    renderSubjects();
  }
  // Plan progress
  const plan = JSON.parse(localStorage.getItem('plan')||'{}');
  if (subj && plan[subj]){
    plan[subj].done = Math.min(plan[subj].target, (plan[subj].done||0) + durMin);
    localStorage.setItem('plan', JSON.stringify(plan));
    renderPlan();
    if (isAutoPlanOn()) scheduleNextSessionIfPlanRemaining();
  }
}

/* ================= TODAY SESSIONS + HISTORY ================= */
function getTodaySessions() {
  const today = todayDate();
  const savedDate = localStorage.getItem("todayDate");
  let count = Number(localStorage.getItem("todaySessions")) || 0;

  if (savedDate !== today) {
    count = 0;
    localStorage.setItem("todayDate", today);
    localStorage.setItem("todaySessions", 0);
  }

  return count;
}

function incrementTodaySessions() {
  const today = todayDate();
  let count = getTodaySessions();
  count++;

  localStorage.setItem("todayDate", today);
  localStorage.setItem("todaySessions", count);

  const history =
    JSON.parse(localStorage.getItem("studyHistory")) || {};

  history[today] = count;
  localStorage.setItem("studyHistory", JSON.stringify(history));
}

/* ================= TIMER ================= */
function updateTimer() {
  const min = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const sec = String(totalSeconds % 60).padStart(2, "0");
  if (timerEl) timerEl.textContent = `${min}:${sec}`;
  if (running) {
    const card = document.getElementById("app");
    if (card) card.classList.add("active-focus");
  } else {
    const card = document.getElementById("app");
    if (card) card.classList.remove("active-focus");
  }
  localStorage.setItem("timer_state", JSON.stringify({ running, totalSeconds }));
}

if (startBtn) {
  startBtn.onclick = () => {
    if (running) return;
    running = true;
    const intent = (document.getElementById("sessionIntentionInput")||{}).value||"";
    if (statusEl) statusEl.textContent = intent? `Studying… ${intent}` : "Studying… Calm focus";
    if (!wasPaused) {
      totalSeconds = durationByIntensity();
    }
    wasPaused = false;
    updateTimer();

    enterFocusRoom();

    timer = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds--;
        updateTimer();
      } else {
        clearInterval(timer);
        running = false;
        if (statusEl) { statusEl.textContent = "Session complete ✅"; statusEl.style.opacity = 1; setTimeout(()=>{ statusEl.style.transition='opacity 1.2s'; statusEl.style.opacity = 0; setTimeout(()=>{ statusEl.style.transition=''; statusEl.style.opacity = 1; },1400); }, 800); }

        leaveFocusRoom();

        completeSession();          // streak
        incrementTodaySessions();   // today + history
        
        // Gentle session summary (visual only, no pressure)
        const summaryEl = document.getElementById("sessionSummary");
        const summaryTextEl = document.getElementById("sessionSummaryText");
        const summaryCloseEl = document.getElementById("sessionSummaryClose");
        if(summaryEl && summaryTextEl){
          const durMin = Math.floor(durationByIntensity()/60);
          summaryTextEl.textContent = `You focused for ${durMin} minutes. Good work.`;
          summaryEl.style.display = "flex";
          if(summaryCloseEl){
            summaryCloseEl.onclick = ()=>{
              summaryEl.style.display = "none";
            };
          }
        }

        totalSeconds = 25 * 60;
        totalSeconds = durationByIntensity();
        updateTimer();
      }
    }, 1000);
  };
}

if (pauseBtn) {
  pauseBtn.onclick = () => {
    clearInterval(timer);
    running = false;
    if (statusEl) statusEl.textContent = "Paused";
    leaveFocusRoom();
    if (addFiveBtn) addFiveBtn.style.display = "inline-block";
    wasPaused = true;
  };
}

if (resetBtn) {
  resetBtn.onclick = () => {
    if (!confirm("Reset timer?")) return;
    clearInterval(timer);
    running = false;
    totalSeconds = 25 * 60;
    totalSeconds = durationByIntensity();
    updateTimer();
    if (statusEl) statusEl.textContent = "Not started";
    leaveFocusRoom();
    if (addFiveBtn) addFiveBtn.style.display = "none";
    wasPaused = false;
  };
}

if (addFiveBtn) {
  addFiveBtn.onclick = () => {
    if (!running) {
      totalSeconds += 5 * 60;
      updateTimer();
    }
  };
}

/* ================= INIT ================= */
updateTimer();
updateStreakUI();
function getIntensity() {
  return localStorage.getItem("focusIntensity") || "Normal";
}
function durationByIntensity() {
  const custom = Number(localStorage.getItem("sessionLength")||0);
  if(custom && custom>0) return custom*60;
  const m = getIntensity();
  if (m === "Light") return 15 * 60;
  if (m === "Deep") return 50 * 60;
  return 25 * 60;
}
totalSeconds = durationByIntensity();

const reminderEl = document.getElementById("gentleReminder");
if (reminderEl && (localStorage.getItem("focusReminder") || "off") === "on") {
  setInterval(() => {
    if (running) {
      if((localStorage.getItem("notifySilence")||"off")==="on") return;
      const mood = localStorage.getItem('sessionMood')||'Neutral';
      let msg = "Gentle reminder: unclench the jaw, breathe, one task.";
      if(mood==='Calm') msg = "Soft reminder: breathe and keep a gentle pace.";
      if(mood==='Deep') msg = "Quiet reminder: protect your focus.";
      if(mood==='Low') msg = "Gentle reminder: small steps are enough today.";
      reminderEl.textContent = msg;
      setTimeout(() => { reminderEl.textContent = ""; }, 10000);
    }
  }, 25 * 60 * 1000);
}

function getUserName() {
  let n = localStorage.getItem("userName");
  if (!n) {
    n = prompt("Enter your name") || "Anonymous";
    localStorage.setItem("userName", n);
  }
  return n;
}

function enterFocusRoom() {
  try {
    const code = localStorage.getItem("groupCode");
    if (!window.fdb || !code) {
      if (statusEl) statusEl.textContent = code ? "Focus Room offline" : "No group joined";
      return;
    }
    if ((localStorage.getItem("autoFocusRoom") || "on") !== "on") return;
    const user = getUserName();
    const ref = window.fdb.collection("groups").doc(code);
    ref.update({
      ["activeSessions." + user]: { startedAt: firebase.firestore.FieldValue.serverTimestamp() }
    }).then(() => {
      inFocusRoom = true;
      if (statusEl) statusEl.textContent = "Studying";
    }).catch(() => {
      if (statusEl) statusEl.textContent = "Failed to enter focus room";
    });
  } catch (e) {
    if (statusEl) statusEl.textContent = "Failed to enter focus room";
  }
}

function leaveFocusRoom() {
  if (!inFocusRoom) return;
  try {
    const code = localStorage.getItem("groupCode");
    if (!window.fdb || !code) return;
    const user = localStorage.getItem("userName") || "Anonymous";
    const ref = window.fdb.collection("groups").doc(code);
    ref.update({
      ["activeSessions." + user]: firebase.firestore.FieldValue.delete()
    }).then(() => {
      inFocusRoom = false;
    }).catch(() => {
      // keep UI calm; no further action
    });
  } catch (e) {}
}

window.addEventListener("beforeunload", () => {
  leaveFocusRoom();
});

if (focusTimeRow) {
  focusTimeRow.querySelectorAll(".mini-btn").forEach(btn=>{
    btn.onclick = ()=>{
      const m = Number(btn.getAttribute("data-min"));
      localStorage.setItem("sessionLength", m);
      if (!running) { totalSeconds = m*60; updateTimer(); }
      focusTimeRow.querySelectorAll('.mini-btn').forEach(b=>b.classList.remove('on'));
      btn.classList.add('on');
    };
  });
  const last = Number(localStorage.getItem("sessionLength")||0);
  if (last) {
    const el = Array.from(focusTimeRow.querySelectorAll('.mini-btn')).find(b=>Number(b.getAttribute('data-min'))===last);
    if (el) el.classList.add('on');
  }
}

if (moodRow) {
  moodRow.querySelectorAll('.mini-btn').forEach(btn=>{
    btn.onclick = ()=>{
      const m = btn.getAttribute('data-mood');
      localStorage.setItem('simpleMood', m);
      document.body.style.filter = m==='Tired'? 'brightness(0.9)' : (m==='Energetic'? 'brightness(1.0) saturate(1.05)' : '');
      moodRow.querySelectorAll('.mini-btn').forEach(b=>b.classList.remove('on'));
      btn.classList.add('on');
    };
  });
  const saved = localStorage.getItem('simpleMood')||'';
  const el = Array.from(moodRow.querySelectorAll('.mini-btn')).find(b=>b.getAttribute('data-mood')===saved);
  if (el) el.classList.add('on');
}

if (intentionInput) {
  intentionInput.value = localStorage.getItem('sessionIntention')||'';
  intentionInput.onchange = ()=>{ localStorage.setItem('sessionIntention', intentionInput.value.trim()); };
}

function startBreak(min){
  breakSeconds = min*60;
  breakRunning = true;
  if (breakStatus) breakStatus.textContent = `Break ${min}m`;
  const t = setInterval(()=>{
    if (breakSeconds>0){
      breakSeconds--;
      if (breakStatus) {
        const mm = String(Math.floor(breakSeconds/60)).padStart(2,'0');
        const ss = String(breakSeconds%60).padStart(2,'0');
        breakStatus.textContent = `Break ${mm}:${ss}`;
      }
    } else {
      clearInterval(t);
      breakRunning = false;
      if (breakStatus) breakStatus.textContent = "Breathe. Water. Stretch.";
    }
  },1000);
}

if (breakShortBtn) breakShortBtn.onclick = ()=> startBreak(5);
if (breakLongBtn) breakLongBtn.onclick = ()=> startBreak(10);
if (breakLongerBtn) breakLongerBtn.onclick = ()=> startBreak(15);

function renderProgress(){
  const total = Number(localStorage.getItem('totalMinutes')||0);
  const today = todayDate();
  const hist = JSON.parse(localStorage.getItem('studyHistory'))||{};
  const sessionsToday = Number(localStorage.getItem('todaySessions'))||0;
  if (progressStats) progressStats.textContent = `Total: ${total} min · Today: ${sessionsToday} session(s)`;
  const tsEl = document.getElementById('todaySessions');
  if (tsEl) tsEl.textContent = String(sessionsToday);
  const shieldInfo = document.getElementById('focusShieldInfo');
  if (shieldInfo) shieldInfo.textContent = `Today: ${total} min · ${sessionsToday} session(s)`;
  if (weeklyBars){
    weeklyBars.innerHTML='';
    const days = [];
    for(let i=6;i>=0;i--){ const d = new Date(); d.setDate(d.getDate()-i); days.push(d.toISOString().split('T')[0]); }
    const max = Math.max(1, ...days.map(k=>Number(hist[k]||0)));
    days.forEach(k=>{
      const v = Number(hist[k]||0);
      const h = Math.max(3, Math.round((v/max)*40));
      const div = document.createElement('div');
      div.className='bar';
      div.style.height = h+'px';
      weeklyBars.appendChild(div);
    });
  }
}

// Optional local-first Firestore sync via anon device id
try{
  if (window.fdb){
    let anonId = localStorage.getItem('anonId');
    if(!anonId){ anonId = Math.random().toString(36).slice(2,10); localStorage.setItem('anonId', anonId); }
    function sync(key){
      const data = localStorage.getItem(key);
      window.fdb.collection('open-mode').doc(anonId).set({ [key]: data }, { merge:true }).catch(()=>{});
    }
    ['studyHistory','studyStreak','subjects','plan','totalMinutes'].forEach(k=>{
      sync(k);
      window.addEventListener('storage', (e)=>{ if(e.key===k) sync(k); });
    });
  }
}catch(e){}
renderProgress();
window.addEventListener('storage', renderProgress);

if (shieldBtn) {
  shieldBtn.onclick = ()=>{
    const el = document.documentElement;
    if (!document.fullscreenElement) { el.requestFullscreen?.(); } else { document.exitFullscreen?.(); }
  };
}

const savedState = JSON.parse(localStorage.getItem('timer_state')||'{}');
if (savedState && savedState.running){
  totalSeconds = Number(savedState.totalSeconds||totalSeconds);
  updateTimer();
  if (startBtn) startBtn.onclick();
}

/* ================= OFFLINE NOTES (UNCHANGED) ================= */
let db;

const request = indexedDB.open("StudyNotesDB", 1);

request.onupgradeneeded = (e) => {
  db = e.target.result;
  db.createObjectStore("notes", { keyPath: "id" });
};

request.onsuccess = (e) => {
  db = e.target.result;
  loadNote();
};

function saveNote() {
  const input = document.getElementById("noteInput");
  if (!input || !db) return;

  const text = input.value;
  const tx = db.transaction("notes", "readwrite");
  const store = tx.objectStore("notes");
  store.put({ id: 1, text });
}

function loadNote() {
  const input = document.getElementById("noteInput");
  if (!input || !db) return;

  const tx = db.transaction("notes", "readonly");
  const store = tx.objectStore("notes");
  const req = store.get(1);

  req.onsuccess = () => {
    if (req.result) {
      input.value = req.result.text;
    }
  };
}

const saveBtn = document.getElementById("saveNoteBtn");
if (saveBtn) saveBtn.onclick = saveNote;
function renderSubjects(){
  if (!subjectsList || !subjectSelect) return;
  const subjects = JSON.parse(localStorage.getItem('subjects')||'{}');
  subjectsList.innerHTML = '';
  subjectSelect.innerHTML = '<option value="">No subject</option>';
  const entries = Object.entries(subjects);
  let weakest = null;
  entries.forEach(([name, info])=>{
    const row = document.createElement('div');
    row.className = 'row';
    const last = info.lastDate || '—';
    row.innerHTML = `<span style="flex:1">${name}</span><span>${info.minutes} min</span><span style="margin-left:8px;color:#94a3b8">Last ${last}</span>`;
    subjectsList.appendChild(row);
    const opt = document.createElement('option');
    opt.value = name; opt.textContent = name;
    subjectSelect.appendChild(opt);
    if (!weakest || info.minutes < weakest.minutes) weakest = { name, minutes: info.minutes };
  });
  const savedSubject = localStorage.getItem('currentSubject')||'';
  if (savedSubject) subjectSelect.value = savedSubject;
  subjectSelect.onchange = ()=>{ localStorage.setItem('currentSubject', subjectSelect.value||''); };
  if (planStatus){
    if (weakest) planStatus.textContent = `Gentle hint: spend time on “${weakest.name}”.`;
    else planStatus.textContent = '';
  }
}

function renderPlan(){
  if (!subjectsList || !planStatus) return;
  const plan = JSON.parse(localStorage.getItem('plan')||'{}');
  const names = Object.keys(plan);
  let totalTarget=0, totalDone=0;
  names.forEach(n=>{ totalTarget += Number(plan[n].target||0); totalDone += Number(plan[n].done||0); });
  const pct = totalTarget? Math.round((totalDone/totalTarget)*100):0;
  planStatus.textContent = totalTarget? `Today: ${totalDone}/${totalTarget} min (${pct}%)` : '';
}

function isAutoPlanOn(){
  return (localStorage.getItem('autoPlan')||'off')==='on';
}

function scheduleNextSessionIfPlanRemaining(){
  const plan = JSON.parse(localStorage.getItem('plan')||'{}');
  const next = Object.entries(plan).find(([n,info])=> Number(info.done||0) < Number(info.target||0));
  if (!next) return;
  const name = next[0];
  if (subjectSelect){ subjectSelect.value = name; }
  startBreak(5);
  const wait = setInterval(()=>{
    if (!breakRunning){ clearInterval(wait); if (startBtn) startBtn.onclick(); }
  },500);
}

if (addSubjectBtn){
  addSubjectBtn.onclick = ()=>{
    const name = (newSubjectName&&newSubjectName.value.trim())||'';
    const mins = Number((newSubjectMinutes&&newSubjectMinutes.value)||0);
    if(!name || !mins) return;
    const plan = JSON.parse(localStorage.getItem('plan')||'{}');
    plan[name] = { target: mins, done: Number(plan[name]?.done||0) };
    localStorage.setItem('plan', JSON.stringify(plan));
    renderPlan(); renderSubjects();
    if (subjectSelect) subjectSelect.value = name;
    localStorage.setItem('currentSubject', name);
    if (planStatus) { planStatus.textContent = 'Added'; setTimeout(()=>{ planStatus.textContent=''; },1200); }
  };
}

if (autoPlanToggle){
  const on = isAutoPlanOn();
  if (on) autoPlanToggle.classList.add('on');
  autoPlanToggle.onclick = ()=>{
    const cur = isAutoPlanOn();
    localStorage.setItem('autoPlan', cur?'off':'on');
    autoPlanToggle.classList.toggle('on');
  };
}

renderSubjects();
renderPlan();
