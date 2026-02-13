import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import BottomNav from '../components/BottomNav';

const GroupInbox = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const getUserName = () => {
    let n = localStorage.getItem("userName");
    if (!n) {
      n = prompt("Enter your name") || "Anonymous";
      localStorage.setItem("userName", n);
    }
    return n;
  };

  useEffect(() => {
    const user = getUserName();
    
    const unsubscribe = db.collection("groups").onSnapshot(snap => {
      const items = [];
      snap.forEach(doc => {
        const data = doc.data();
        const members = data.members || [];
        if (members.some(m => m.name === user)) {
          const active = data.activeSessions || {};
          const count = Object.keys(active).length;
          let latest = null;
          try {
            Object.values(active).forEach(info => {
              if (info && info.startedAt) {
                if (!latest) latest = info.startedAt;
                else if (info.startedAt.toMillis && latest.toMillis && info.startedAt.toMillis() > latest.toMillis()) latest = info.startedAt;
              }
            });
          } catch (e) {}
          items.push({ id: doc.id, name: data.name || doc.id, activeCount: count, latest, members: members });
        }
      });

      items.sort((a, b) => {
        if (b.activeCount !== a.activeCount) return b.activeCount - a.activeCount;
        const la = a.latest && a.latest.toMillis ? a.latest.toMillis() : 0;
        const lb = b.latest && b.latest.toMillis ? b.latest.toMillis() : 0;
        return lb - la;
      });

      // Fetch last message previews
      const promises = items.map(it => {
        return db.collection("groups").doc(it.id).collection("chat").orderBy("createdAt", "desc").limit(1).get().then(s => {
          let last = null;
          s.forEach(d => { last = d; });
          if (last) {
            const m = last.data() || {};
            const ts = m.createdAt && m.createdAt.toMillis ? m.createdAt.toMillis() : 0;
            const minutes = ts ? Math.max(0, Math.floor((Date.now() - ts) / 60000)) : 0;
            it.lastTime = minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h`;
            it.lastPreview = m.type === "image" ? "📷 Photo" :
                             m.type === "video" ? "🎬 Video" :
                             m.type === "audio" ? "🎤 Voice message" :
                             (m.text || "").slice(0, 40);
            const rb = Array.isArray(m.readBy) ? m.readBy : [];
            it.unread = !rb.includes(user) && (m.author !== user);
          } else {
            it.lastTime = "";
          }
        }).catch(() => { it.lastTime = ""; });
      });

      Promise.all(promises).then(() => {
        setGroups(items);
        setLoading(false);
      });
    }, err => {
      console.error(err);
      setError("Failed to load groups");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGroupClick = (groupId) => {
    localStorage.setItem("groupCode", groupId);
    navigate('/groups');
  };

  const filteredGroups = groups.filter(g => 
    (g.name || g.id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="inbox" style={{position:'fixed', inset:0, display:'flex', flexDirection:'column', background:'radial-gradient(circle at top, #0f172a, #020617)', color:'#e5e7eb', paddingBottom:'64px'}}>
        <div className="top" style={{height:'60px', display:'flex', alignItems:'center', padding:'0 16px', borderBottom:'1px solid rgba(255,255,255,0.08)', background:'rgba(17,17,17,0.95)', backdropFilter:'blur(12px)'}}>
          <input 
            className="search" 
            placeholder="Search or ask…" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{flex:1, background:'rgba(26,26,26,0.8)', border:'none', borderRadius:'24px', height:'40px', color:'#e5e7eb', padding:'0 16px', fontSize:'14px', backdropFilter:'blur(8px)', transition:'background 0.2s ease'}}
          />
        </div>

        <div className="avatars" style={{display:'flex', gap:'14px', padding:'14px 16px', background:'rgba(11,11,11,0.6)', borderBottom:'1px solid rgba(255,255,255,0.08)', backdropFilter:'blur(8px)', overflowX:'auto'}}>
          {groups.slice(0, 8).map(g => (
            <div key={g.id} className="av" onClick={() => handleGroupClick(g.id)} style={{minWidth:'52px', height:'52px', borderRadius:'50%', background:'rgba(26,26,26,0.8)', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'600', backdropFilter:'blur(8px)', cursor:'pointer'}}>
              {(g.name || g.id)[0]?.toUpperCase() || "?"}
              {g.activeCount > 0 && (
                <div className="dot" style={{position:'absolute', bottom:'2px', right:'2px', width:'12px', height:'12px', borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px rgba(34,197,94,0.4)'}}></div>
              )}
            </div>
          ))}
        </div>

        <div className="list" style={{flex:1, overflowY:'auto', padding:'8px 12px', background:'rgba(11,11,11,0.4)'}}>
          {loading && <div style={{textAlign:'center', padding:'20px', color:'#94a3b8'}}>Loading...</div>}
          {error && <div style={{textAlign:'center', padding:'20px', color:'#ef4444'}}>{error}</div>}
          {!loading && !error && filteredGroups.length === 0 && (
            <div className="empty" style={{fontSize:'13px', color:'#94a3b8', textAlign:'center', marginTop:'16px', lineHeight:'1.5'}}>No groups yet.</div>
          )}

          {filteredGroups.map(g => (
            <div key={g.id} className="row" onClick={() => handleGroupClick(g.id)} style={{display:'flex', alignItems:'center', gap:'12px', padding:'14px', borderRadius:'18px', background:'rgba(18,18,18,0.8)', margin:'8px 0', cursor:'pointer', transition:'all 0.2s ease', backdropFilter:'blur(8px)'}}>
              <div className="avatar" style={{width:'48px', height:'48px', borderRadius:'50%', background:'rgba(26,26,26,0.8)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', backdropFilter:'blur(8px)'}}>
                {(g.name || g.id)[0]?.toUpperCase() || "?"}
              </div>
              <div className="meta" style={{flex:1, display:'flex', flexDirection:'column', gap:'4px'}}>
                <div className="line1" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span className="name" style={{fontWeight:'700', fontSize:'15px'}}>{g.name || g.id}</span>
                  <div style={{display:'flex', alignItems:'center'}}>
                    <span className="time" style={{fontSize:'12px', color:'#94a3b8', marginLeft:'8px'}}>{g.lastTime}</span>
                    {g.unread && <div className="unread" style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', marginLeft:'8px', boxShadow:'0 0 6px rgba(34,197,94,0.4)'}}></div>}
                  </div>
                </div>
                <div className="preview" style={{fontSize:'13px', color:'#cbd5e1', opacity:'0.85', marginTop:'2px', lineHeight:'1.4'}}>
                  {g.lastPreview || (g.activeCount > 0 ? `${g.activeCount} quietly focusing` : `No one studying`)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </>
  );
};

export default GroupInbox;
