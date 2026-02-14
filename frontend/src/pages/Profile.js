import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import Layout from '../components/Layout';
import { User, Mail, Trophy, Flame, Target, Calendar } from 'lucide-react';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8" data-testid="profile-container">
        <div className="text-center">
          <h1 className="text-5xl font-black uppercase neon-glow mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Profile
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8"
        >
          {/* Avatar & Name */}
          <div className="text-center mb-8">
            <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#7000FF] flex items-center justify-center">
              <User className="w-16 h-16 text-black" />
            </div>
            <h2 className="text-3xl font-black uppercase mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {user.username}
            </h2>
            <p className="text-[#94A3B8] flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              {user.email}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[
              { icon: <Trophy />, label: 'Level', value: user.level, color: '#00F0FF' },
              { icon: <Target />, label: 'Total XP', value: user.total_xp, color: '#7000FF' },
              { icon: <Flame />, label: 'Current Streak', value: `${user.current_streak} days`, color: '#FF0099' },
              { icon: <Flame />, label: 'Longest Streak', value: `${user.longest_streak} days`, color: '#FAFF00' },
              { icon: <Target />, label: 'Discipline', value: `${user.discipline_score}/100`, color: '#39FF14' },
              { icon: <Calendar />, label: 'Member Since', value: new Date(user.created_at).toLocaleDateString(), color: '#00F0FF' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 text-center"
                data-testid={`profile-stat-${i}`}
              >
                <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center" style={{ color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="text-2xl font-black mb-1" style={{ fontFamily: 'Orbitron, sans-serif', color: stat.color }}>
                  {stat.value}
                </div>
                <div className="text-xs text-[#94A3B8] uppercase font-mono">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <button
              onClick={logout}
              className="bg-[#FF2A6D]/10 border-2 border-[#FF2A6D] text-[#FF2A6D] font-bold uppercase tracking-wider px-8 py-3 rounded-md hover:bg-[#FF2A6D]/20 transition-all"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
              data-testid="logout-btn"
            >
              Logout
            </button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Profile;