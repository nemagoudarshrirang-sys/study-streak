import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const History = () => {
  const navigate = useNavigate();
  const [historyData, setHistoryData] = useState({});
  const [days, setDays] = useState([]);
  const [maxVal, setMaxVal] = useState(1);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("studyHistory")) || {};
    const today = new Date().toISOString().split("T")[0];
    const todaySessions = Number(localStorage.getItem("todaySessions")) || 0;
    
    if (todaySessions > 0) {
      data[today] = todaySessions;
    }
    setHistoryData(data);

    const daysArr = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      daysArr.push(d.toISOString().split('T')[0]);
    }
    setDays(daysArr);
    
    const max = Math.max(1, ...daysArr.map(d => Number(data[d] || 0)));
    setMaxVal(max);
  }, []);

  const lerp = (a, b, t) => Math.round(a + (b - a) * t);
  const hexToRgb = (h) => {
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    return [r, g, b];
  };
  const rgbToHex = ([r, g, b]) => {
    const s = (x) => x.toString(16).padStart(2, '0');
    return '#' + s(r) + s(g) + s(b);
  };
  
  const colorFor = (t) => {
    const from = hexToRgb('#0b3b2a');
    const to = hexToRgb('#22c55e');
    return rgbToHex([lerp(from[0], to[0], t), lerp(from[1], to[1], t), lerp(from[2], to[2], t)]);
  };

  const renderHeatmap = () => {
    const columns = [];
    let currentColumn = [];
    
    days.forEach((day, index) => {
      const val = Number(historyData[day] || 0);
      const t = Math.max(0, Math.min(1, val / maxVal));
      
      currentColumn.push(
        <div
          key={day}
          title={new Date(day).toLocaleDateString()}
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '3px',
            backgroundColor: colorFor(t),
            boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
            marginBottom: '4px'
          }}
        />
      );

      if ((index + 1) % 7 === 0 || index === days.length - 1) {
        columns.push(
          <div key={`col-${index}`} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {currentColumn}
          </div>
        );
        currentColumn = [];
      }
    });

    return (
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
        {columns}
      </div>
    );
  };

  return (
    <div className="card">
      <h1>📊 Insights</h1>
      <div id="heatmap" style={{ margin: '10px 0' }}>
        {days.length > 0 ? renderHeatmap() : <div className="empty">Gentle note: empty days are okay.</div>}
      </div>
      
      <button className="back" onClick={() => navigate('/proof')}>📚 Study Proof</button>
      <button className="back" onClick={() => navigate('/focus')}>← Back</button>
    </div>
  );
};

export default History;
