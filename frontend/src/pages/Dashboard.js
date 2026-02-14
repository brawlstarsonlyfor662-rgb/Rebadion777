import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import Layout from '../components/Layout';
import {
  Zap, Target, Brain, Trophy, Flame, Swords,
  TrendingUp, CheckCircle
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [bossChallenge, setBossChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tasksRes, statsRes, bossRes] = await Promise.all([
        axios.get('/tasks?completed=false'),
        axios.get('/analytics/dashboard'),
        axios.get('/boss-challenge/today')
      ]);

      setTasks(tasksRes.data.slice(0, 5));
      setStats(statsRes.data);
      setBossChallenge(bossRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-[#00F0FF] border-t-transparent rounded-full"
          />
        </div>
      </Layout>
    );
  }

  const nextLevelXP = stats?.next_level_xp || 100;
  const currentXP = stats?.current_xp || 0;
  const xpPercentage = (currentXP / nextLevelXP) * 100;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" data-testid="dashboard-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-5xl md:text-6xl font-black uppercase mb-2 neon-glow" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Command Center
          </h1>
          <p className="text-[#94A3B8] text-lg">Welcome back, <span className="text-[#00F0FF]">{user?.username}</span></p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Trophy className="w-6 h-6" />,
              label: 'Level',
              value: user?.level || 1,
              color: '#00F0FF',
              testId: 'level-stat'
            },
            {
              icon: <Flame className="w-6 h-6" />,
              label: 'Streak',
              value: `${user?.current_streak || 0} days`,
              color: '#FF0099',
              testId: 'streak-stat'
            },
            {
              icon: <Target className="w-6 h-6" />,
              label: 'Discipline',
              value: `${user?.discipline_score || 50}/100`,
              color: '#39FF14',
              testId: 'discipline-stat'
            },
            {
              icon: <CheckCircle className="w-6 h-6" />,
              label: 'Tasks Done',
              value: stats?.total_tasks || 0,
              color: '#FAFF00',
              testId: 'tasks-stat'
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6"
              data-testid={stat.testId}
            >
              <div className="flex items-center justify-between mb-4">
                <div style={{ color: stat.color }}>
                  {stat.icon}
                </div>
                <span className="text-xs uppercase tracking-widest text-[#475569]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {stat.label}
                </span>
              </div>
              <div className="text-3xl font-black" style={{ fontFamily: 'Orbitron, sans-serif', color: stat.color }}>
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* XP Progress */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6"
          data-testid="xp-progress-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Experience Points
              </h3>
              <p className="text-sm text-[#94A3B8] font-mono">
                {currentXP} / {nextLevelXP} XP
              </p>
            </div>
            <Zap className="w-8 h-8 text-[#00F0FF]" />
          </div>
          <div className="xp-bar h-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="xp-bar-fill"
            />
          </div>
          <p className="text-xs text-right mt-2 text-[#94A3B8] font-mono">
            {Math.round(100 - xpPercentage)}% to next level
          </p>
        </motion.div>

        {/* Boss Challenge */}
        {bossChallenge && !bossChallenge.completed && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 border-2 border-[#FF0099]/50"
            data-testid="boss-challenge-card"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Swords className="w-6 h-6 text-[#FF0099]" />
                  <h3 className="text-2xl font-bold uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Daily Boss Challenge
                  </h3>
                </div>
                <p className="text-lg mb-4">{bossChallenge.challenge_text}</p>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[#94A3B8] font-mono">
                    Difficulty: {'★'.repeat(bossChallenge.difficulty)}
                  </span>
                  <span className="text-sm text-[#00F0FF] font-mono">
                    Reward: {bossChallenge.xp_reward} XP
                  </span>
                </div>
              </div>
              <Link to="/boss-challenge">
                <button className="cyber-button" data-testid="view-boss-challenge-btn">
                  Accept
                </button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Active Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
          data-testid="active-tasks-card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Active Tasks
            </h3>
            <Link to="/tasks" className="text-[#00F0FF] hover:text-[#7000FF] transition-colors" data-testid="view-all-tasks-link">
              View All →
            </Link>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-[#475569] mx-auto mb-4" />
              <p className="text-[#94A3B8] mb-4">No active tasks. Create your first mission!</p>
              <Link to="/tasks">
                <button className="cyber-button" data-testid="create-first-task-btn">
                  Create Task
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="task-card glass-card p-4 flex items-center justify-between"
                  data-testid={`task-item-${i}`}
                >
                  <div className="flex-1">
                    <h4 className="font-bold mb-1">{task.title}</h4>
                    <div className="flex items-center gap-3 text-sm text-[#94A3B8]">
                      <span className="font-mono">{task.skill_tree}</span>
                      <span className="font-mono">{task.estimated_minutes} min</span>
                      <span className="text-[#00F0FF] font-mono">+{task.xp_reward} XP</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {'⭐'.repeat(task.difficulty)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Brain />, label: 'AI Coach', link: '/ai-coach', color: '#7000FF', testId: 'ai-coach-quick-link' },
            { icon: <Target />, label: 'Focus Mode', link: '/focus', color: '#00F0FF', testId: 'focus-mode-quick-link' },
            { icon: <TrendingUp />, label: 'Analytics', link: '/analytics', color: '#39FF14', testId: 'analytics-quick-link' },
            { icon: <Trophy />, label: 'Achievements', link: '/achievements', color: '#FAFF00', testId: 'achievements-quick-link' },
          ].map((action, i) => (
            <Link key={i} to={action.link} data-testid={action.testId}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="glass-card p-6 text-center cursor-pointer hover:border-[#00F0FF]/50 transition-all"
              >
                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center" style={{ color: action.color }}>
                  {action.icon}
                </div>
                <div className="text-sm font-bold uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {action.label}
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
