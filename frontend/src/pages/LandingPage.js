import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Zap, Target, Brain, TrendingUp, Sparkles, Flame, 
  Swords, Trophy, MessageSquare, BarChart3, Shield 
} from 'lucide-react';
import axios from 'axios';

const LandingPage = () => {
  const [stats, setStats] = React.useState({
    total_users: 0,
    completed_tasks: 0,
    success_rate: 0
  });
  const [showLearnMore, setShowLearnMore] = React.useState(false);

  React.useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/public/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative min-h-screen flex items-center justify-center px-4"
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 bg-[#00F0FF] rounded-full blur-[120px] opacity-20 -top-20 -left-20 animate-pulse" />
          <div className="absolute w-96 h-96 bg-[#FF0099] rounded-full blur-[120px] opacity-20 -bottom-20 -right-20 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <span className="neon-glow">LEVEL</span>
              <br />
              <span className="neon-glow-pink">UP</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-[#94A3B8] mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            The dopamine-optimized productivity system that turns studying into an <span className="text-[#00F0FF] font-bold">addictive RPG</span>. Build discipline, crush procrastination, unlock your potential.
          </motion.p>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex gap-6 justify-center flex-wrap"
          >
            <Link to="/auth" data-testid="get-started-btn">
              <button className="cyber-button">
                <Zap className="inline-block mr-2 w-5 h-5" />
                Start Your Journey
              </button>
            </Link>
            <button 
              data-testid="learn-more-btn"
              onClick={() => setShowLearnMore(true)}
              className="bg-transparent border-2 border-[#00F0FF] text-[#00F0FF] font-bold uppercase tracking-wider px-8 py-3 rounded-md hover:bg-[#00F0FF]/10 transition-all"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              Learn More
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            {[
              { value: `${stats.total_users}+`, label: 'Warriors' },
              { value: `${stats.completed_tasks}+`, label: 'Tasks Completed' },
              { value: `${stats.success_rate}%`, label: 'Success Rate' },
            ].map((stat, i) => (
              <div key={i} className="text-center" data-testid={`stat-${i}`}>
                <div className="text-4xl font-black text-[#00F0FF] mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {stat.value}
                </div>
                <div className="text-sm uppercase tracking-widest text-[#475569]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-32 px-4 relative" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl font-bold uppercase text-center mb-20"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            <span className="text-[#00F0FF]">Core</span> Systems
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Target className="w-8 h-8" />,
                title: 'Dopamine Tasks',
                description: 'Break study into micro-wins (2-10 min). Complete task → instant XP → dopamine hit. Your brain gets addicted to learning.',
                color: '#00F0FF'
              },
              {
                icon: <Brain className="w-8 h-8" />,
                title: 'AI Brain Engine',
                description: 'Adapts to your patterns. Predicts burnout. Optimizes timing.',
                color: '#7000FF'
              },
              {
                icon: <Flame className="w-8 h-8" />,
                title: 'Streak System',
                description: 'Build momentum. 10% XP boost per day. Break the chain = reset.',
                color: '#FF0099'
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: 'Skill Trees',
                description: '4 paths: Mind, Knowledge, Discipline, Fitness. Level them all.',
                color: '#39FF14'
              },
              {
                icon: <Swords className="w-8 h-8" />,
                title: 'Boss Challenges',
                description: 'Daily epic quests. High risk, massive rewards.',
                color: '#FAFF00'
              },
              {
                icon: <MessageSquare className="w-8 h-8" />,
                title: 'AI Coach',
                description: '4 modes: Strict, Strategic, Analytical, Motivational.',
                color: '#00F0FF'
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 group hover:scale-105 transition-transform"
                data-testid={`feature-card-${i}`}
              >
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#00F0FF]/20 to-[#7000FF]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <div style={{ color: feature.color }}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4 uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {feature.title}
                </h3>
                <p className="text-[#94A3B8] leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 relative" data-testid="cta-section">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-6xl md:text-7xl font-black uppercase mb-8" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Ready to <span className="neon-glow">Dominate</span>?
            </h2>
            <p className="text-xl text-[#94A3B8] mb-12">
              Join thousands of high achievers who rewired their brains for success.
            </p>
            <Link to="/auth">
              <button className="cyber-button text-lg px-12 py-4" data-testid="cta-button">
                <Trophy className="inline-block mr-2 w-6 h-6" />
                Begin Now
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10" data-testid="footer">
        <div className="max-w-7xl mx-auto text-center text-[#475569] text-sm">
          <p style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            © 2026 LEVEL UP SYSTEM • BUILD DISCIPLINE • DESTROY PROCRASTINATION
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;