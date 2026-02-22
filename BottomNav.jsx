import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="bottom-nav">
      <button className={`bn-btn ${isActive('/')}`} onClick={() => navigate('/')}>🏠</button>
      <button className={`bn-btn ${isActive('/group-inbox')}`} onClick={() => navigate('/group-inbox')}>💬</button>
      <button className={`bn-btn ${isActive('/profile')}`} onClick={() => navigate('/profile')}>🙂</button>
      <button className={`bn-btn ${isActive('/settings')}`} onClick={() => navigate('/settings')}>⚙️</button>
    </div>
  );
};

export default BottomNav;
