import React from 'react';
import { useNavigate } from 'react-router-dom';

const Placeholder = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top, #0f172a, #020617)',
      color: '#e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      fontFamily: '"Segoe UI", system-ui, sans-serif'
    }}>
      <div style={{
        width: '320px',
        padding: '40px 28px',
        borderRadius: '20px',
        background: 'rgba(15, 23, 42, 0.9)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          marginBottom: '12px',
          color: '#22c55e',
          fontWeight: '500'
        }}>This space is preparing 🌱</h1>
        <p style={{
          color: '#94a3b8',
          marginBottom: '24px'
        }}>This feature will be available soon.</p>
        <button 
          onClick={() => navigate('/focus')}
          style={{
            background: '#22c55e',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
        >
          Back to Focus Hub
        </button>
      </div>
    </div>
  );
};

export default Placeholder;
