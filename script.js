let totalSeconds = 25 * 60;
let timer = null;
let running = false;

const timerEl = document.getElementById("timer");
const statusEl = document.getElementById("status");
const streakEl = document.getElementById("streak");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

// ---------- STREAK LOGIC ----------
function todayDate() {
  return new Date().toISOString().split("T")[0];
}

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
  streakEl.textContent = `🔥 Streak: ${data.streak}`;
}

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
    data.streak = 1;
  }

  data.lastDate = today;
  saveStreak(data);
  updateStreakUI();
}

// ---------- TIMER ----------
function updateTimer() {
  const min = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const sec = String(totalSeconds % 60).padStart(2, "0");
  timerEl.textContent = `${min}:${sec}`;
}

startBtn.onclick = () => {
  if (running) return;
  running = true;
  statusEl.textContent = "Studying... Focus 🔥";

  timer = setInterval(() => {
    if (totalSeconds > 0) {
      totalSeconds--;
      updateTimer();
    } else {
      clearInterval(timer);
      running = false;
      statusEl.textContent = "Session complete ✅";
      completeSession();
    }
  }, 1000);
};

pauseBtn.onclick = () => {
  clearInterval(timer);
  running = false;
  statusEl.textContent = "Paused ⏸️";
};

resetBtn.onclick = () => {
  clearInterval(timer);
  running = false;
  totalSeconds = 25 * 60;
  updateTimer();
  statusEl.textContent = "Not started";
};

// ---------- INIT ----------
updateTimer();
updateStreakUI();
// ===== OFFLINE NOTES (IndexedDB) =====
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
  const text = document.getElementById("noteInput").value;
  const tx = db.transaction("notes", "readwrite");
  const store = tx.objectStore("notes");
  store.put({ id: 1, text });
}

function loadNote() {
  const tx = db.transaction("notes", "readonly");
  const store = tx.objectStore("notes");
  const req = store.get(1);

  req.onsuccess = () => {
    if (req.result) {
      document.getElementById("noteInput").value = req.result.text;
    }
  };
}

document.getElementById("saveNoteBtn").onclick = saveNote;

