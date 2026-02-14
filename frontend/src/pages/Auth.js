import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { AuthContext } from '../App';
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
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
    setError('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const response = await axios.post(endpoint, formData);
      
      login(response.data.access_token, response.data.user);
      navigate('/dashboard');
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Authentication failed';
      
      // Detailed error handling
      if (errorMsg.includes('Invalid credentials')) {
        setError('❌ Invalid email or password. Please check and try again.');
      } else if (errorMsg.includes('already registered')) {
        setError('⚠️ This email is already registered. Try logging in instead.');
      } else if (errorMsg.includes('not found')) {
        setError('❌ Account not found. Please sign up first.');
      } else {
        setError(`❌ ${errorMsg}`);
      }
      
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background with anime aesthetics */}
      <div className="absolute inset-0">
        {/* Animated particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#00F0FF] rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              opacity: 0 
            }}
            animate={{ 
              y: [null, Math.random() * window.innerHeight],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
        
        <motion.div 
          className="absolute w-96 h-96 bg-[#00F0FF] rounded-full blur-[150px] opacity-20 top-0 left-0"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute w-96 h-96 bg-[#FF0099] rounded-full blur-[150px] opacity-20 bottom-0 right-0"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        />
        
        {/* Anime-style character silhouette */}
        <motion.div
          className="absolute right-10 top-1/2 -translate-y-1/2 w-64 h-96 opacity-10"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 0.1 }}
          transition={{ duration: 1 }}
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1551402991-6e4b5fc0b01c?w=400')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'grayscale(100%) contrast(150%)'
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? 'login' : 'signup'}
            initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-8"
          >
            {/* Header with animation */}
            <motion.div 
              className="text-center mb-8"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.h1 
                className="text-4xl font-black uppercase mb-2 neon-glow" 
                style={{ fontFamily: 'Orbitron, sans-serif' }}
                animate={{ 
                  textShadow: [
                    '0 0 10px rgba(0, 240, 255, 0.8)',
                    '0 0 20px rgba(0, 240, 255, 0.8)',
                    '0 0 10px rgba(0, 240, 255, 0.8)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isLogin ? 'Welcome Back' : 'Join the Elite'}
              </motion.h1>
              <p className="text-[#94A3B8]">
                {isLogin ? 'Continue your journey to greatness' : 'Begin your transformation'}
              </p>
            </motion.div>

            {/* Error message with animation */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-[#FF2A6D]/10 border border-[#FF2A6D]/30 rounded-md flex items-start gap-3"
                  data-testid="error-message"
                >
                  <AlertCircle className="w-5 h-5 text-[#FF2A6D] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#FF2A6D]">{error}</div>
                </motion.div>
              )}
            </AnimatePresence>

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
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Auth;