import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, firebase } from '../firebase';

const JoinGroup = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);

  const getUserName = () => {
    let n = localStorage.getItem("userName");
    if (!n) {
      n = prompt("Enter your name") || "Anonymous";
      localStorage.setItem("userName", n);
    }
    return n;
  };

  const handleJoin = async () => {
    const groupCode = code.trim().toUpperCase();
    if (!groupCode) return;

    setStatus("Joining...");
    setIsError(false);

    // Animated dots simulation not strictly needed in React state but good for UX
    // Simplifying for React: just show text
    
    try {
      const user = getUserName();
      const ref = db.collection("groups").doc(groupCode);
      const doc = await ref.get();

      if (!doc.exists) {
        setStatus("Invalid group code");
        setIsError(true);
        return;
      }

      const data = doc.data();
      const members = data.members || [];
      
      if (members.some(m => m.name === user)) {
        localStorage.setItem("groupCode", groupCode);
        navigate('/groups');
        return;
      }

      await ref.update({
        members: firebase.firestore.FieldValue.arrayUnion({ name: user, sessions: 0 })
      });

      localStorage.setItem("groupCode", groupCode);
      navigate('/groups');

    } catch (e) {
      console.error(e);
      setStatus("Failed to join");
      setIsError(true);
    }
  };

  return (
    <div style={{
      background: '#020617',
      color: '#e5e7eb',
      fontFamily: 'Segoe UI',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh'
    }}>
      <div className="card" style={{
        width: '320px',
        background: '#0f172a',
        padding: '24px',
        borderRadius: '18px'
      }}>
        <h2>🔑 Join Group</h2>
        <input 
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ABC123"
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '10px',
            borderRadius: '12px',
            border: 'none',
            background: '#020617',
            color: '#fff',
            textAlign: 'center',
            letterSpacing: '3px'
          }}
        />
        <button 
          onClick={handleJoin}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '10px',
            borderRadius: '12px',
            border: 'none',
            background: '#22c55e',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Join
        </button>
        <div className="small" style={{
          fontSize: '13px',
          color: isError ? '#f87171' : '#94a3b8',
          marginTop: '6px'
        }}>
          {status}
        </div>
      </div>
    </div>
  );
};

export default JoinGroup;
