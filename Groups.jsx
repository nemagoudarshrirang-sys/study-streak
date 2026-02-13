import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, firebase } from '../firebase';

const Groups = () => {
  const navigate = useNavigate();
  const [groupCode, setGroupCode] = useState(localStorage.getItem("groupCode") || "");
  const [groupData, setGroupData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [activeSessions, setActiveSessions] = useState({});
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const getUserName = () => localStorage.getItem("userName") || "Anonymous";

  useEffect(() => {
    if (!groupCode) {
      navigate('/group-inbox');
      return;
    }

    const unsubscribeGroup = db.collection("groups").doc(groupCode).onSnapshot(doc => {
      if (!doc.exists) {
        navigate('/group-inbox'); // Group deleted or invalid
        return;
      }
      const data = doc.data();
      setGroupData(data);
      setActiveSessions(data.activeSessions || {});
    });

    const unsubscribeChat = db.collection("groups").doc(groupCode).collection("chat")
      .orderBy("createdAt", "asc")
      .limit(50)
      .onSnapshot(snap => {
        const msgs = [];
        snap.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
        setMessages(msgs);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      });

    return () => {
      unsubscribeGroup();
      unsubscribeChat();
    };
  }, [groupCode, navigate]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    const text = messageInput.trim();
    setMessageInput("");
    
    const user = getUserName();
    try {
      await db.collection("groups").doc(groupCode).collection("chat").add({
        author: user,
        text: text,
        type: "text",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        replyTo: replyTarget ? { author: replyTarget.author, preview: replyTarget.preview } : null
      });
      setReplyTarget(null);
    } catch (e) {
      console.error("Error sending message", e);
    }
  };

  const handleFileUpload = async (e, type = "file") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const user = getUserName();
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const url = ev.target.result;
        const msgType = type === "camera" ? "image" : (file.type.startsWith("image/") ? "image" : (file.type.startsWith("video/") ? "video" : "file"));
        
        await db.collection("groups").doc(groupCode).collection("chat").add({
          author: user,
          type: msgType,
          content: url,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ""; // Reset input
  };

  const handleMicClick = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const url = ev.target.result;
          const user = getUserName();
          await db.collection("groups").doc(groupCode).collection("chat").add({
            author: user,
            type: "audio",
            content: url,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (e) {
      console.error("Mic error", e);
      alert("Microphone access denied or not available.");
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm("Delete this group for everyone?")) return;
    try {
      await db.collection("groups").doc(groupCode).delete();
      localStorage.removeItem("groupCode");
      navigate('/group-inbox');
    } catch (e) {
      console.error(e);
      alert("Failed to delete group");
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(groupCode).then(() => alert("Code copied!"));
    setShowMenu(false);
  };

  const renderMessage = (msg) => {
    const isMe = msg.author === getUserName();
    const isSystem = !msg.author;
    
    if (isSystem) return <div key={msg.id} style={{textAlign:'center', fontSize:'12px', color:'#94a3b8', margin:'10px 0'}}>{msg.text}</div>;

    return (
      <div key={msg.id} className={`wa-bubble ${isMe ? 'sender' : 'receiver'}`} style={{
        alignSelf: isMe ? 'flex-end' : 'flex-start',
        background: isMe ? 'rgba(30,58,47,0.85)' : 'rgba(31,41,55,0.85)',
        backdropFilter: 'blur(8px)',
        borderRadius: '18px',
        borderBottomRightRadius: isMe ? '4px' : '18px',
        borderBottomLeftRadius: isMe ? '18px' : '4px',
        padding: '12px 14px',
        maxWidth: '72%',
        margin: '2px 0',
        position: 'relative',
        wordWrap: 'break-word',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        color: '#e5e7eb',
        fontSize: '14px',
        lineHeight: '1.6'
      }}>
        {msg.replyTo && (
          <div style={{background:'rgba(0,0,0,0.2)', padding:'4px 8px', borderRadius:'8px', borderLeft:'3px solid #22c55e', marginBottom:'6px', fontSize:'12px'}}>
            <div style={{color:'#22c55e', fontWeight:'600'}}>{msg.replyTo.author}</div>
            <div style={{color:'#cbd5e1', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{msg.replyTo.preview}</div>
          </div>
        )}
        {!isMe && <div style={{fontSize:'10px', color:'rgba(148,163,184,0.6)', marginBottom:'2px', fontWeight:'600'}}>{msg.author}</div>}
        
        {msg.type === "text" && <div>{msg.text}</div>}
        {msg.type === "image" && <img src={msg.content} alt="shared" style={{maxWidth:'100%', borderRadius:'12px', marginTop:'4px'}} />}
        {msg.type === "video" && <video src={msg.content} controls style={{maxWidth:'100%', borderRadius:'12px', marginTop:'4px'}} />}
        {msg.type === "audio" && <audio src={msg.content} controls style={{maxWidth:'100%', marginTop:'4px'}} />}
        
        <div style={{fontSize:'10px', color:'rgba(148,163,184,0.6)', marginTop:'4px', textAlign:'right'}}>
          {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
        </div>
      </div>
    );
  };

  return (
    <div className="wa-app" style={{position:'fixed', inset:0, background:'radial-gradient(circle at top, #0f172a, #020617)', color:'#e5e7eb', display:'flex', flexDirection:'column'}}>
      {/* Top Bar */}
      <div className="wa-top" style={{height:'60px', background:'rgba(17,24,39,0.95)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', boxShadow:'0 1px 0 rgba(255,255,255,0.08)', zIndex:10, backdropFilter:'blur(12px)'}}>
        <div className="wa-left" style={{display:'flex', alignItems:'center', gap:'14px'}}>
          <button onClick={() => navigate('/group-inbox')} style={{background:'transparent', border:'none', color:'#e5e7eb', fontSize:'22px', cursor:'pointer', padding:'4px'}}>←</button>
          <div className="wa-title" style={{display:'flex', flexDirection:'column', gap:'2px'}}>
            <div className="wa-name" style={{fontWeight:'700', fontSize:'16px'}}>{groupData?.name || "Loading..."}</div>
            <div className="wa-sub" style={{fontSize:'12px', color:'#94a3b8'}}>{(groupData?.members || []).length} participants</div>
          </div>
        </div>
        <div className="wa-icons" style={{display:'flex', alignItems:'center', gap:'14px'}}>
          <button style={{background:'transparent', border:'none', color:'#e5e7eb', fontSize:'20px', cursor:'pointer'}}>🎥</button>
          <button style={{background:'transparent', border:'none', color:'#e5e7eb', fontSize:'20px', cursor:'pointer'}}>📞</button>
          <button onClick={() => setShowMenu(!showMenu)} style={{background:'transparent', border:'none', color:'#e5e7eb', fontSize:'20px', cursor:'pointer'}}>⋮</button>
        </div>
      </div>

      {/* Menu Dropdown */}
      {showMenu && (
        <div style={{position:'fixed', top:'60px', right:'12px', background:'rgba(10,15,30,0.95)', border:'1px solid rgba(51,65,85,0.6)', borderRadius:'16px', padding:'8px', zIndex:20, backdropFilter:'blur(16px)', boxShadow:'0 8px 24px rgba(0,0,0,0.4)'}}>
          <button onClick={copyCode} style={{display:'block', width:'180px', background:'rgba(17,24,39,0.8)', color:'#e5e7eb', border:'none', borderRadius:'12px', padding:'10px', margin:'4px 0', fontSize:'13px', fontWeight:'500', cursor:'pointer'}}>Copy Code</button>
          <button onClick={handleDeleteGroup} style={{display:'block', width:'180px', background:'rgba(239,68,68,0.8)', color:'#fff', border:'none', borderRadius:'12px', padding:'10px', margin:'4px 0', fontSize:'13px', fontWeight:'500', cursor:'pointer'}}>Delete Group</button>
        </div>
      )}

      {/* Body */}
      <div className="wa-body" style={{flex:1, overflowY:'auto', background:'rgba(11,19,36,0.4)', padding:'16px 12px', paddingBottom:'80px', display:'flex', flexDirection:'column'}}>
        {/* Focus Room Widget */}
        {Object.keys(activeSessions).length > 0 && (
          <div style={{marginBottom:'20px', padding:'14px', background:'rgba(11,19,36,0.5)', borderRadius:'20px', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.05)'}}>
            <div style={{fontSize:'13px', color:'#94a3b8', marginBottom:'8px'}}>🌿 Shared Focus Space</div>
            <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
              {Object.entries(activeSessions).map(([name, info]) => (
                <div key={name} style={{display:'flex', alignItems:'center', gap:'6px', background:'rgba(15,23,42,0.6)', padding:'6px 10px', borderRadius:'12px'}}>
                  <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#22c55e'}}></div>
                  <span style={{fontSize:'12px'}}>{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="wa-msg-list" style={{display:'flex', flexDirection:'column', gap:'10px'}}>
          {messages.map(renderMessage)}
          <div ref={chatEndRef}></div>
        </div>
      </div>

      {/* Input Area */}
      {replyTarget && (
        <div style={{position:'absolute', bottom:'72px', left:'12px', right:'12px', background:'rgba(18,18,18,0.95)', borderLeft:'3px solid rgba(51,65,85,0.8)', borderRadius:'14px', padding:'10px 12px', color:'#e5e7eb', backdropFilter:'blur(12px)', boxShadow:'0 4px 16px rgba(0,0,0,0.3)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <div style={{fontSize:'11px', color:'#94a3b8', marginBottom:'4px', fontWeight:'500'}}>Reply to {replyTarget.author}</div>
            <div style={{fontSize:'12px', lineHeight:'1.4'}}>{replyTarget.preview}</div>
          </div>
          <button onClick={() => setReplyTarget(null)} style={{background:'transparent', border:'none', color:'#94a3b8', cursor:'pointer'}}>✕</button>
        </div>
      )}

      <div className="wa-input" style={{height:'72px', background:'rgba(17,24,39,0.95)', display:'flex', alignItems:'center', padding:'10px 12px', gap:'10px', boxShadow:'0 -1px 0 rgba(255,255,255,0.08)', backdropFilter:'blur(12px)'}}>
        <input 
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
          placeholder="Message"
          style={{flex:1, height:'44px', border:'none', borderRadius:'24px', background:'rgba(10,15,30,0.8)', color:'#e5e7eb', padding:'0 18px', fontSize:'14px', backdropFilter:'blur(8px)'}}
        />
        <button onClick={() => fileInputRef.current?.click()} style={{background:'rgba(10,15,30,0.8)', border:'none', color:'#22c55e', opacity:0.8, borderRadius:'50%', width:'40px', height:'40px', cursor:'pointer'}}>📎</button>
        <button onClick={() => cameraInputRef.current?.click()} style={{background:'rgba(10,15,30,0.8)', border:'none', color:'#22c55e', opacity:0.8, borderRadius:'50%', width:'40px', height:'40px', cursor:'pointer'}}>📷</button>
        <button onClick={handleMicClick} style={{background: recording ? '#ef4444' : 'rgba(10,15,30,0.8)', border:'none', color: recording ? '#fff' : '#22c55e', opacity:0.8, borderRadius:'50%', width:'40px', height:'40px', cursor:'pointer'}}>🎤</button>
        
        {messageInput.trim() && (
          <button onClick={handleSendMessage} style={{background:'rgba(34,197,94,0.85)', color:'#0b1a12', fontWeight:'600', border:'none', borderRadius:'50%', width:'40px', height:'40px', cursor:'pointer'}}>✈</button>
        )}

        <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'file')} style={{display:'none'}} multiple />
        <input type="file" ref={cameraInputRef} onChange={(e) => handleFileUpload(e, 'camera')} accept="image/*" capture="environment" style={{display:'none'}} />
      </div>
    </div>
  );
};

export default Groups;
