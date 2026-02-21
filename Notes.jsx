import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Notes = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({});
  const [currentSubject, setCurrentSubject] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [editIndex, setEditIndex] = useState(null);
  const [readingMode, setReadingMode] = useState(null); // { title, text } or null
  const [db, setDb] = useState(null);

  useEffect(() => {
    const req = indexedDB.open("StudyNotesDB", 1);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      d.createObjectStore("notes", { keyPath: "id" });
    };
    req.onsuccess = e => {
      const d = e.target.result;
      setDb(d);
      const tx = d.transaction("notes", "readonly");
      const store = tx.objectStore("notes");
      const getReq = store.get("subjectNotes");
      getReq.onsuccess = () => {
        const savedText = getReq.result?.text || null;
        const savedData = savedText ? JSON.parse(savedText) : (JSON.parse(localStorage.getItem("subjectNotes")) || {});
        setData(savedData);
        const savedSubject = localStorage.getItem("activeSubject") || "";
        if (savedData[savedSubject]) {
          setCurrentSubject(savedSubject);
        }
      };
      getReq.onerror = () => {
        const savedData = JSON.parse(localStorage.getItem("subjectNotes")) || {};
        setData(savedData);
        const savedSubject = localStorage.getItem("activeSubject") || "";
        if (savedData[savedSubject]) {
          setCurrentSubject(savedSubject);
        }
      };
    };
    req.onerror = () => {
      const savedData = JSON.parse(localStorage.getItem("subjectNotes")) || {};
      setData(savedData);
      const savedSubject = localStorage.getItem("activeSubject") || "";
      if (savedData[savedSubject]) {
        setCurrentSubject(savedSubject);
      }
    };
  }, []);

  const saveData = (newData, newSubject) => {
    localStorage.setItem("subjectNotes", JSON.stringify(newData));
    if (newSubject !== undefined) {
      localStorage.setItem("activeSubject", newSubject);
    }
    setData(newData);
    if (db) {
      try {
        const tx = db.transaction("notes", "readwrite");
        const store = tx.objectStore("notes");
        store.put({ id: "subjectNotes", text: JSON.stringify(newData) });
      } catch {}
    }
  };

  const handleAddSubject = () => {
    const sub = subjectInput.trim();
    if (!sub) return;
    if (!data[sub]) {
      const newData = { ...data, [sub]: [] };
      saveData(newData);
    }
    setSubjectInput('');
  };

  const handleSelectSubject = (sub) => {
    setCurrentSubject(sub);
    localStorage.setItem("activeSubject", sub);
    setEditIndex(null);
    setNoteInput('');
  };

  const handleDeleteSubject = () => {
    if (!window.confirm(`Delete subject "${currentSubject}" and all notes?`)) return;
    const newData = { ...data };
    delete newData[currentSubject];
    saveData(newData, "");
    setCurrentSubject("");
  };

  const handleSaveNote = () => {
    const text = noteInput.trim();
    if (!text) return;
    
    const newData = { ...data };
    const notes = newData[currentSubject] || [];
    const timestamp = new Date().toLocaleString();

    if (editIndex !== null) {
      notes[editIndex] = { text, date: timestamp };
      setEditIndex(null);
    } else {
      notes.push({ text, date: timestamp });
    }
    newData[currentSubject] = notes;
    saveData(newData);
    setNoteInput('');
  };

  const handleEditNote = (index) => {
    const note = data[currentSubject][index];
    setNoteInput(note.text);
    setEditIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteNote = (index) => {
    if (!window.confirm("Delete this note?")) return;
    const newData = { ...data };
    newData[currentSubject].splice(index, 1);
    saveData(newData);
  };

  const handleReadingMode = (note) => {
    setReadingMode({ title: currentSubject, text: note.text });
  };

  return (
    <>
      <h1 style={{ textAlign: 'center', fontSize: '24px', marginBottom: '16px', fontWeight: '700' }}>📚 My Notes</h1>

      <div className="card">
        <input 
          value={subjectInput}
          onChange={(e) => setSubjectInput(e.target.value)}
          placeholder="Add subject (Physics, Maths…)" 
        />
        <button className="add" onClick={handleAddSubject} style={{width:'100%'}}>Add Subject</button>
      </div>

      <div className="card">
        <ul style={{ paddingLeft: '20px' }}>
          {Object.keys(data).map(sub => (
            <li key={sub} onClick={() => handleSelectSubject(sub)} style={{ fontWeight: currentSubject === sub ? 'bold' : 'normal', color: currentSubject === sub ? '#22c55e' : '#e5e7eb' }}>
              {sub} <span style={{color:'#94a3b8', fontSize:'12px'}}>({data[sub].length})</span>
            </li>
          ))}
        </ul>
      </div>

      {currentSubject && (
        <div className="card">
          <h2>{currentSubject}</h2>
          <button className="delete" onClick={handleDeleteSubject} style={{ marginBottom: '16px' }}>Delete Subject</button>

          <textarea 
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Write your notes here…"
          />
          <button className="save" onClick={handleSaveNote} style={{width:'100%'}}>
            {editIndex !== null ? 'Update Note' : 'Save Note'}
          </button>

          <div style={{ marginTop: '20px' }}>
            {(data[currentSubject] || []).map((note, idx) => (
              <div key={idx} className="note-box" style={{ background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(51,65,85,0.4)', borderRadius: '16px', padding: '14px', marginTop: '12px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>{note.date}</div>
                <div style={{ fontSize: '14px', marginBottom: '10px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{note.text}</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="edit" onClick={() => handleEditNote(idx)} style={{marginTop:0}}>Edit</button>
                  <button className="delete" onClick={() => handleDeleteNote(idx)} style={{marginTop:0}}>Delete</button>
                  <button onClick={() => handleReadingMode(note)} style={{marginTop:0, background: '#3b82f6', color: 'white'}}>Read</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="back" onClick={() => navigate(-1)} style={{ width: '100%', marginTop: '16px', padding: '14px', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight:'500' }}>⬅ Back</button>

      {readingMode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.98)', zIndex: 1000, padding: '40px 24px', overflowY: 'auto' }}>
          <button 
            onClick={() => setReadingMode(null)}
            style={{ position: 'fixed', top: '20px', right: '20px', background: 'rgba(51,65,85,0.8)', color: '#e5e7eb', border: 'none', borderRadius: '12px', padding: '12px 20px', cursor: 'pointer' }}
          >
            Close
          </button>
          <div style={{ maxWidth: '800px', margin: '0 auto', color: '#e5e7eb' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>{readingMode.title}</h2>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '18px', lineHeight: '2' }}>{readingMode.text}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default Notes;
