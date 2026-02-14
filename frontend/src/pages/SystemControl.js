import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Shield, Users, Activity, Target, TrendingUp, Trash2,
  UserPlus, LogOut, Eye, Lock, Cpu, Database, Zap
} from 'lucide-react';

const SystemControl = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [dashboardData, setDashboardData] = useState(null);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchDashboard();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/system/access', credentials);
      sessionStorage.setItem('admin_token', response.data.access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      setIsAuthenticated(true);
      toast.success('Access granted');
      fetchDashboard();
    } catch (error) {
      toast.error('Access denied');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await axios.get('/system/status');
      setDashboardData(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      setIsAuthenticated(false);
      sessionStorage.removeItem('admin_token');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setDashboardData(null);
    toast.info('Logged out');
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user permanently?')) return;

    try {
      await axios.delete(`/system/users/${userId}`);
      toast.success('User deleted');
      fetchDashboard();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const createAdmin = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/system/admin/create', newAdmin);
      toast.success('Admin created');
      setShowAddAdmin(false);
      setNewAdmin({ username: '', password: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create admin');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center px-4 relative overflow-hidden" data-testid="admin-login-page">
        {/* Mysterious background */}
        <div className="absolute inset-0">
          <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-[#FF0000] to-transparent top-0 animate-pulse" />
          <div className="absolute w-1 h-full bg-gradient-to-b from-transparent via-[#FF0000] to-transparent left-0 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-[#FF0000] to-transparent bottom-0 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute w-1 h-full bg-gradient-to-b from-transparent via-[#FF0000] to-transparent right-0 animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="bg-[#0A0A0A] border border-[#FF0000]/30 rounded-lg p-8 shadow-[0_0_50px_rgba(255,0,0,0.3)]">
            {/* Warning header */}
            <div className="text-center mb-8">
              <Shield className="w-16 h-16 text-[#FF0000] mx-auto mb-4 animate-pulse" />
              <h1 className="text-3xl font-black uppercase mb-2 text-[#FF0000]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                SYSTEM CONTROL
              </h1>
              <p className="text-[#FF0000]/60 text-sm font-mono">RESTRICTED AREA</p>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#FF0000]/40 font-mono">
                <Lock className="w-3 h-3" />
                <span>ENCRYPTED CONNECTION</span>
              </div>
            </div>

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-6" data-testid="admin-login-form">
              <div>
                <label className="block text-sm font-mono uppercase text-[#FF0000]/80 mb-2">
                  USERNAME
                </label>
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="w-full bg-black border border-[#FF0000]/30 rounded px-4 py-3 text-[#FF0000] placeholder-[#FF0000]/20 focus:border-[#FF0000] focus:outline-none font-mono"
                  placeholder="ENTER USERNAME"
                  required
                  data-testid="admin-username-input"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase text-[#FF0000]/80 mb-2">
                  ACCESS CODE
                </label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="w-full bg-black border border-[#FF0000]/30 rounded px-4 py-3 text-[#FF0000] placeholder-[#FF0000]/20 focus:border-[#FF0000] focus:outline-none font-mono"
                  placeholder="ENTER ACCESS CODE"
                  required
                  data-testid="admin-password-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF0000] text-black font-bold uppercase py-3 rounded hover:bg-[#CC0000] transition-all font-mono tracking-wider disabled:opacity-50"
                data-testid="admin-login-submit"
              >
                {loading ? 'AUTHENTICATING...' : 'ACCESS SYSTEM'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-[#FF0000]/40 hover:text-[#FF0000]/60 text-xs font-mono"
              >
                ← RETURN TO MAIN SYSTEM
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-[#000000] text-white" data-testid="admin-dashboard">
      {/* Top bar */}
      <div className="border-b border-[#FF0000]/30 bg-[#0A0A0A] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#FF0000]" />
            <div>
              <h1 className="text-xl font-black uppercase text-[#FF0000]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                SYSTEM CONTROL
              </h1>
              <p className="text-xs font-mono text-[#FF0000]/60">
                ADMIN: {dashboardData?.admin?.username}
                {dashboardData?.admin?.is_super_admin && ' [SUPER]'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF0000]/10 border border-[#FF0000]/30 rounded hover:bg-[#FF0000]/20 transition-colors"
            data-testid="admin-logout-btn"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-mono text-sm">LOGOUT</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[
            { icon: <Users />, label: 'Total Users', value: dashboardData?.total_users, color: '#FF0000' },
            { icon: <Activity />, label: 'Active (24h)', value: dashboardData?.active_users_24h, color: '#FF6600' },
            { icon: <Target />, label: 'Total Tasks', value: dashboardData?.total_tasks, color: '#FFAA00' },
            { icon: <TrendingUp />, label: 'Completed', value: dashboardData?.completed_tasks, color: '#00FF00' },
            { icon: <Zap />, label: 'Focus (min)', value: dashboardData?.total_focus_minutes, color: '#00FFFF' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#0A0A0A] border border-[#FF0000]/30 rounded-lg p-6"
              data-testid={`admin-stat-${i}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div style={{ color: stat.color }}>
                  {stat.icon}
                </div>
                <span className="text-xs font-mono text-[#FF0000]/60 uppercase">
                  {stat.label}
                </span>
              </div>
              <div className="text-3xl font-black font-mono" style={{ color: stat.color }}>
                {stat.value || 0}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        {dashboardData?.admin?.is_super_admin && (
          <div className="flex gap-4">
            <button
              onClick={() => setShowAddAdmin(!showAddAdmin)}
              className="flex items-center gap-2 px-6 py-3 bg-[#FF0000] text-black font-bold rounded hover:bg-[#CC0000] transition-colors"
              data-testid="add-admin-btn"
            >
              <UserPlus className="w-5 h-5" />
              <span className="font-mono">ADD ADMIN</span>
            </button>
          </div>
        )}

        {/* Add Admin Form */}
        {showAddAdmin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-[#0A0A0A] border border-[#FF0000]/30 rounded-lg p-6"
          >
            <h3 className="text-xl font-bold mb-4 font-mono text-[#FF0000]">CREATE NEW ADMIN</h3>
            <form onSubmit={createAdmin} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={newAdmin.username}
                onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                className="w-full bg-black border border-[#FF0000]/30 rounded px-4 py-2 text-white font-mono"
                required
                data-testid="new-admin-username"
              />
              <input
                type="password"
                placeholder="Password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                className="w-full bg-black border border-[#FF0000]/30 rounded px-4 py-2 text-white font-mono"
                required
                data-testid="new-admin-password"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-[#FF0000] text-black font-bold rounded font-mono"
                data-testid="create-admin-submit"
              >
                CREATE
              </button>
            </form>
          </motion.div>
        )}

        {/* Users Table */}
        <div className="bg-[#0A0A0A] border border-[#FF0000]/30 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-[#FF0000]/30">
            <h2 className="text-2xl font-bold font-mono text-[#FF0000]">USER DATABASE</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="users-table">
              <thead className="bg-black/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-mono uppercase text-[#FF0000]/80">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-mono uppercase text-[#FF0000]/80">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-mono uppercase text-[#FF0000]/80">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-mono uppercase text-[#FF0000]/80">XP</th>
                  <th className="px-6 py-3 text-left text-xs font-mono uppercase text-[#FF0000]/80">Streak</th>
                  <th className="px-6 py-3 text-left text-xs font-mono uppercase text-[#FF0000]/80">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-mono uppercase text-[#FF0000]/80">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData?.users?.map((user, i) => (
                  <tr key={user.id} className="border-t border-[#FF0000]/10 hover:bg-[#FF0000]/5" data-testid={`user-row-${i}`}>
                    <td className="px-6 py-4 font-mono text-sm">{user.username}</td>
                    <td className="px-6 py-4 font-mono text-sm text-[#FF0000]/60">{user.email}</td>
                    <td className="px-6 py-4 font-mono text-sm font-bold text-[#00FF00]">{user.level}</td>
                    <td className="px-6 py-4 font-mono text-sm">{user.total_xp}</td>
                    <td className="px-6 py-4 font-mono text-sm text-[#FFAA00]">{user.current_streak} days</td>
                    <td className="px-6 py-4 font-mono text-sm text-[#FF0000]/40">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="p-2 bg-[#FF0000]/10 border border-[#FF0000]/30 rounded hover:bg-[#FF0000]/20"
                        data-testid={`delete-user-${i}`}
                      >
                        <Trash2 className="w-4 h-4 text-[#FF0000]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemControl;
