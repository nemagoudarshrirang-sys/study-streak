import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import FocusHub from './pages/FocusHub';
import Settings from './pages/Settings';
import History from './pages/History';
import Groups from './pages/Groups';
import GroupInbox from './pages/GroupInbox';
import Notes from './pages/Notes';
import TodaysPlan from './pages/TodaysPlan';
import MindReset from './pages/MindReset';
import FocusRules from './pages/FocusRules';
import Profile from './pages/Profile';
import JoinGroup from './pages/JoinGroup';
import Proof from './pages/Proof';
import Placeholder from './pages/Placeholder';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/focus" element={<FocusHub />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/history" element={<History />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/group-inbox" element={<GroupInbox />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/todays-plan" element={<TodaysPlan />} />
        <Route path="/mind-reset" element={<MindReset />} />
        <Route path="/focus-rules" element={<FocusRules />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/join-group" element={<JoinGroup />} />
        <Route path="/proof" element={<Proof />} />
        <Route path="/placeholder" element={<Placeholder />} />
      </Routes>
    </Router>
  );
}

export default App;
