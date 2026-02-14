import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import '@/App.css';

import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import TaskHub from './pages/TaskHub';
import SkillTrees from './pages/SkillTrees';
import Achievements from './pages/Achievements';
import BossChallenge from './pages/BossChallenge';
import AICoach from './pages/AICoach';
import FocusMode from './pages/FocusMode';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import SystemControl from './pages/SystemControl';
import AIStudyAssistant from './pages/AIStudyAssistant';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configure axios defaults
axios.defaults.baseURL = API;

export const AuthContext = React.createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    toast.success('Welcome back, warrior!', {
      description: `Level ${userData.level} • ${userData.current_streak} day streak`,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.info('Logged out. Come back stronger!');
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-[#00F0FF] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      <div className="App">
        <div className="noise-overlay" />
        <BrowserRouter>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
              <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
              <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
              <Route path="/tasks" element={user ? <TaskHub /> : <Navigate to="/" />} />
              <Route path="/skill-trees" element={user ? <SkillTrees /> : <Navigate to="/" />} />
              <Route path="/achievements" element={user ? <Achievements /> : <Navigate to="/" />} />
              <Route path="/boss-challenge" element={user ? <BossChallenge /> : <Navigate to="/" />} />
              <Route path="/ai-coach" element={user ? <AICoach /> : <Navigate to="/" />} />
              <Route path="/focus" element={user ? <FocusMode /> : <Navigate to="/" />} />
              <Route path="/analytics" element={user ? <Analytics /> : <Navigate to="/" />} />
              <Route path="/profile" element={user ? <Profile /> : <Navigate to="/" />} />
              {/* Hidden admin route */}
              <Route path="/system-control" element={<SystemControl />} />
            </Routes>
          </AnimatePresence>
        </BrowserRouter>
        <Toaster 
          theme="dark" 
          position="top-right"
          toastOptions={{
            style: {
              background: '#121218',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              color: '#FFFFFF',
              fontFamily: 'Inter, sans-serif',
            },
          }}
        />
      </div>
    </AuthContext.Provider>
  );
}

export default App;