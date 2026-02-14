import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Layout from '../components/Layout';
import { Trophy, Lock } from 'lucide-react';

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await axios.get('/achievements/available');
      setAchievements(response.data.achievements);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" data-testid="achievements-container">
        <div className="text-center">
          <h1 className="text-5xl font-black uppercase neon-glow mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Achievements
          </h1>
          <p className="text-[#94A3B8] text-lg">Unlock your legend</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((ach, i) => (
              <motion.div
                key={ach.achievement_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-card p-6 ${
                  ach.unlocked ? 'border-[#39FF14]/50' : 'opacity-50'
                }`}
                data-testid={`achievement-${i}`}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {ach.unlocked ? ach.icon : <Lock className="w-12 h-12 text-[#475569] mx-auto" />}
                  </div>
                  <h3 className="text-xl font-bold mb-2 uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {ach.title}
                  </h3>
                  <p className="text-sm text-[#94A3B8]">{ach.description}</p>
                  {ach.unlocked && (
                    <div className="mt-4 px-3 py-1 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-full inline-block">
                      <span className="text-[#39FF14] text-xs font-bold uppercase">Unlocked</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Achievements;