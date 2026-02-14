import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import {
  LayoutDashboard, Target, Trophy, Swords, MessageSquare,
  Crosshair, TrendingUp, User, LogOut, Sparkles
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const navItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Target className="w-5 h-5" />, label: 'Tasks', path: '/tasks' },
    { icon: <Sparkles className="w-5 h-5" />, label: 'Skill Trees', path: '/skill-trees' },
    { icon: <Trophy className="w-5 h-5" />, label: 'Achievements', path: '/achievements' },
    { icon: <Swords className="w-5 h-5" />, label: 'Boss', path: '/boss-challenge' },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'AI Coach', path: '/ai-coach' },
    { icon: <Sparkles className="w-5 h-5" />, label: 'AI Study', path: '/ai-study' },
    { icon: <Crosshair className="w-5 h-5" />, label: 'Focus', path: '/focus' },
    { icon: <TrendingUp className="w-5 h-5" />, label: 'Analytics', path: '/analytics' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Top Nav */}
      <nav className="border-b border-white/10 bg-[#0A0A0F]/80 backdrop-blur-md sticky top-0 z-50" data-testid="top-nav">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00F0FF] to-[#7000FF] rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-black uppercase neon-glow" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              LEVEL UP
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Level Badge */}
            <div className="glass-card px-4 py-2 flex items-center gap-2" data-testid="level-badge">
              <span className="text-sm font-mono text-[#94A3B8]">LVL</span>
              <span className="text-xl font-black text-[#00F0FF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {user?.level || 1}
              </span>
            </div>

            {/* Profile */}
            <Link to="/profile">
              <div className="glass-card p-2 hover:border-[#00F0FF]/50 transition-colors cursor-pointer" data-testid="profile-link">
                <User className="w-5 h-5" />
              </div>
            </Link>

            {/* Logout */}
            <button
              onClick={logout}
              className="glass-card p-2 hover:border-[#FF0099]/50 transition-colors"
              data-testid="logout-button"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Side Nav (Desktop) */}
      <div className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-white/10 bg-[#0A0A0F]/50 backdrop-blur-md p-4" data-testid="side-nav">
        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 5 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                    isActive
                      ? 'bg-[#00F0FF]/10 border-l-2 border-[#00F0FF] text-[#00F0FF]'
                      : 'hover:bg-white/5 text-[#94A3B8] hover:text-white'
                  }`}
                  data-testid={`nav-item-${item.path.slice(1)}`}
                >
                  {item.icon}
                  <span className="font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:pl-64 min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* Bottom Nav (Mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0F]/95 backdrop-blur-md border-t border-white/10 z-50" data-testid="bottom-nav">
        <div className="flex items-center justify-around p-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="flex-1">
                <div
                  className={`flex flex-col items-center gap-1 py-2 ${
                    isActive ? 'text-[#00F0FF]' : 'text-[#94A3B8]'
                  }`}
                  data-testid={`mobile-nav-${item.path.slice(1)}`}
                >
                  {item.icon}
                  <span className="text-xs font-mono">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Layout;