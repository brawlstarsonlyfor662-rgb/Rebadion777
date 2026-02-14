import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Layout from '../components/Layout';
import { TrendingUp, Flame, Target, Brain, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/analytics/dashboard');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">Loading analytics...</div>
      </Layout>
    );
  }

  const burnoutColor = {
    low: '#39FF14',
    medium: '#FAFF00',
    high: '#FF2A6D'
  }[analytics?.burnout_risk?.risk_level || 'low'];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" data-testid="analytics-container">
        <div className="text-center">
          <h1 className="text-5xl font-black uppercase neon-glow mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Analytics
          </h1>
          <p className="text-[#94A3B8] text-lg">Data-driven insights into your performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: <Target />, label: 'Total Tasks', value: analytics?.total_tasks, color: '#00F0FF' },
            { icon: <Brain />, label: 'Focus Time', value: `${analytics?.total_focus_time || 0}m`, color: '#7000FF' },
            { icon: <Flame />, label: 'Streak', value: `${analytics?.current_streak || 0} days`, color: '#FF0099' },
            { icon: <TrendingUp />, label: 'Discipline', value: `${analytics?.discipline_score || 0}/100`, color: '#39FF14' },
          ].map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6"
              data-testid={`metric-${i}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div style={{ color: metric.color }}>
                  {metric.icon}
                </div>
                <span className="text-xs uppercase tracking-widest text-[#475569] font-mono">
                  {metric.label}
                </span>
              </div>
              <div className="text-3xl font-black" style={{ fontFamily: 'Orbitron, sans-serif', color: metric.color }}>
                {metric.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Weekly Performance Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6"
          data-testid="weekly-chart"
        >
          <h2 className="text-2xl font-bold uppercase mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Weekly Performance
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.weekly_data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="#94A3B8" style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }} />
              <YAxis stroke="#94A3B8" style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }} />
              <Tooltip
                contentStyle={{
                  background: '#121218',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '8px',
                  color: '#FFFFFF'
                }}
              />
              <Line type="monotone" dataKey="tasks" stroke="#00F0FF" strokeWidth={3} dot={{ fill: '#00F0FF', r: 5 }} />
              <Line type="monotone" dataKey="focus_minutes" stroke="#FF0099" strokeWidth={3} dot={{ fill: '#FF0099', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Insights */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Burnout Risk */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6"
            data-testid="burnout-card"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle style={{ color: burnoutColor }} className="w-6 h-6" />
              <h3 className="text-xl font-bold uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Burnout Risk
              </h3>
            </div>
            <div className="mb-4">
              <div className="text-3xl font-black mb-2" style={{ fontFamily: 'Orbitron, sans-serif', color: burnoutColor }}>
                {analytics?.burnout_risk?.risk_level?.toUpperCase()}
              </div>
            </div>
            <p className="text-[#94A3B8]">{analytics?.burnout_risk?.message}</p>
          </motion.div>

          {/* Optimal Time */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6"
            data-testid="optimal-time-card"
          >
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-[#7000FF]" />
              <h3 className="text-xl font-bold uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                AI Insight
              </h3>
            </div>
            <p className="text-[#94A3B8] leading-relaxed">{analytics?.optimal_time}</p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;