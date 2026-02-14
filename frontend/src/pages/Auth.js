import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { AuthContext } from '../App';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const response = await axios.post(endpoint, formData);
      
      login(response.data.access_token, response.data.user);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute w-96 h-96 bg-[#00F0FF] rounded-full blur-[150px] opacity-20 top-0 left-0" />
        <div className="absolute w-96 h-96 bg-[#FF0099] rounded-full blur-[150px] opacity-20 bottom-0 right-0" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black uppercase mb-2 neon-glow" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {isLogin ? 'Welcome Back' : 'Join the Elite'}
            </h1>
            <p className="text-[#94A3B8]">
              {isLogin ? 'Continue your journey' : 'Start your transformation'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" data-testid="auth-form">
            {!isLogin && (
              <div>
                <label className="block text-sm font-mono uppercase tracking-wider text-[#94A3B8] mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00F0FF]" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-[#0A0A0F] border border-white/10 rounded-md pl-12 pr-4 py-3 text-white placeholder-white/20 focus:border-[#00F0FF] focus:outline-none focus:ring-1 focus:ring-[#00F0FF] transition-colors"
                    placeholder="Enter username"
                    required
                    data-testid="username-input"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-mono uppercase tracking-wider text-[#94A3B8] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00F0FF]" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#0A0A0F] border border-white/10 rounded-md pl-12 pr-4 py-3 text-white placeholder-white/20 focus:border-[#00F0FF] focus:outline-none focus:ring-1 focus:ring-[#00F0FF] transition-colors"
                  placeholder="Enter email"
                  required
                  data-testid="email-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-mono uppercase tracking-wider text-[#94A3B8] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00F0FF]" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[#0A0A0F] border border-white/10 rounded-md pl-12 pr-4 py-3 text-white placeholder-white/20 focus:border-[#00F0FF] focus:outline-none focus:ring-1 focus:ring-[#00F0FF] transition-colors"
                  placeholder="Enter password"
                  required
                  data-testid="password-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full cyber-button flex items-center justify-center gap-2"
              data-testid="submit-button"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Login' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#00F0FF] hover:text-[#7000FF] transition-colors"
              data-testid="toggle-auth-mode"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;