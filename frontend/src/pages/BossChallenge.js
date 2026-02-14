import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { AuthContext } from '../App';
import Layout from '../components/Layout';
import { Swords, Crown, Zap } from 'lucide-react';

const BossChallenge = () => {
  const { updateUser } = useContext(AuthContext);
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenge();
  }, []);

  const fetchChallenge = async () => {
    try {
      const response = await axios.get('/boss-challenge/today');
      setChallenge(response.data);
    } catch (error) {
      console.error('Failed to fetch challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeChallenge = async () => {
    try {
      const response = await axios.patch(`/boss-challenge/${challenge.id}/complete`);
      if (response.data.level_up) {
        toast.success('LEVEL UP! Boss defeated!', { description: `Epic XP Gained: ${response.data.xp_gained}` });
      } else {
        toast.success(`Boss Defeated! +${response.data.xp_gained} XP`);
      }
      fetchChallenge();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to complete challenge');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8" data-testid="boss-challenge-container">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
          >
            <Swords className="w-24 h-24 text-[#FF0099] mx-auto mb-6" />
          </motion.div>
          <h1 className="text-6xl font-black uppercase neon-glow-pink mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Boss Challenge
          </h1>
          <p className="text-[#94A3B8] text-lg">Daily epic quest for legendary rewards</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 border-2 border-[#FF0099]/50 relative overflow-hidden"
          data-testid="boss-card"
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF0099]/10 to-transparent" />

          <div className="relative z-10">
            {challenge?.completed ? (
              <div className="text-center py-12">
                <Crown className="w-24 h-24 text-[#39FF14] mx-auto mb-6" />
                <h2 className="text-4xl font-black uppercase text-[#39FF14] mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Victory!
                </h2>
                <p className="text-[#94A3B8] text-lg">You've conquered today's boss. Return tomorrow for a new challenge.</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="text-sm uppercase tracking-widest text-[#FF0099] mb-4 font-mono">
                    Today's Challenge
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">{challenge?.challenge_text}</h2>
                  
                  <div className="flex items-center justify-center gap-8 mb-8">
                    <div className="text-center">
                      <div className="text-[#FAFF00] mb-2">{'★'.repeat(challenge?.difficulty || 1)}</div>
                      <div className="text-xs text-[#94A3B8] font-mono uppercase">Difficulty</div>
                    </div>
                    <div className="w-px h-12 bg-white/10" />
                    <div className="text-center">
                      <div className="text-3xl font-black text-[#00F0FF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        {challenge?.xp_reward}
                      </div>
                      <div className="text-xs text-[#94A3B8] font-mono uppercase">XP Reward</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={completeChallenge}
                    className="cyber-button text-lg px-12 py-4 flex items-center gap-3"
                    data-testid="complete-boss-btn"
                  >
                    <Zap className="w-6 h-6" />
                    Complete Challenge
                  </button>
                </div>

                <div className="glass-card p-4 text-center">
                  <p className="text-sm text-[#94A3B8]">
                    <strong className="text-[#FF0099]">Warning:</strong> Boss challenges are high-stakes. Make sure you've actually completed the objectives before claiming.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default BossChallenge;