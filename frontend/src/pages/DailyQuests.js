import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import XPAnimation from '../components/XPAnimation';
import LevelUpAnimation from '../components/LevelUpAnimation';
import { Calendar, CheckCircle, Circle, Flame, AlertTriangle, Zap } from 'lucide-react';

const DailyQuests = () => {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const [extraQuests, setExtraQuests] = useState(0);

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      const response = await axios.get('/quests/daily');
      setQuests(response.data.quests);
      setExtraQuests(response.data.extra_quests || 0);
    } catch (error) {
      toast.error('Failed to load daily quests');
    } finally {
      setLoading(false);
    }
  };

  const completeQuest = async (questId) => {
    try {
      const response = await axios.post(`/quests/${questId}/complete`, null, {
        params: { quest_type: 'daily' }
      });
      
      setXpGained(response.data.xp_gained);
      setShowXPAnimation(true);
      
      if (response.data.level_up) {
        setTimeout(() => {
          setNewLevel(response.data.new_level);
          setShowLevelUp(true);
        }, 2000);
      }
      
      fetchQuests();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to complete quest');
    }
  };

  const completedCount = quests.filter(q => q.completed).length;
  const totalCount = quests.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8" data-testid="daily-quests-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <Calendar className="w-12 h-12 text-[#00F0FF]" />
            <h1 className="text-5xl font-black uppercase neon-glow" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Daily Quests
            </h1>
          </div>
          <p className="text-[#94A3B8] text-lg">
            Complete quests to earn XP • Resets every 24 hours
          </p>
        </motion.div>

        {/* Penalty Warning */}
        {extraQuests > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 border-2 border-[#FF2A6D]"
            data-testid="penalty-warning"
          >
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-[#FF2A6D] flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-[#FF2A6D] mb-2 uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Performance Penalty Active
                </h3>
                <p className="text-[#94A3B8] mb-2">
                  Your recent exam score was below 50%. You have <strong className="text-[#FF2A6D]">{extraQuests} extra quests</strong> today to make up for it.
                </p>
                <p className="text-sm text-[#94A3B8]">
                  Complete all quests to improve your standing and reduce penalties.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Daily Progress
              </h3>
              <p className="text-sm text-[#94A3B8] font-mono">
                {completedCount} / {totalCount} Quests Complete
              </p>
            </div>
            <div className="text-4xl font-black text-[#00F0FF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {Math.round(progressPercentage)}%
            </div>
          </div>
          <div className="xp-bar h-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="xp-bar-fill"
            />
          </div>
        </motion.div>

        {/* Quests List */}
        {loading ? (
          <div className="text-center py-12">Loading quests...</div>
        ) : (
          <div className="space-y-4">
            {quests.map((quest, i) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card p-6 ${quest.completed ? 'opacity-60' : ''}`}
                data-testid={`quest-${i}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {quest.completed ? (
                        <CheckCircle className="w-6 h-6 text-[#39FF14]" />
                      ) : (
                        <Circle className="w-6 h-6 text-[#94A3B8]" />
                      )}
                      <h3 className={`text-xl font-bold ${quest.completed ? 'line-through text-[#94A3B8]' : ''}`}>
                        {quest.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-2 font-mono text-[#00F0FF]">
                        <Zap className="w-4 h-4" />
                        +{quest.xp_reward} XP
                      </span>
                      <span className="font-mono text-[#94A3B8]">
                        Progress: {quest.progress} / {quest.target}
                      </span>
                    </div>
                  </div>

                  {!quest.completed && (
                    <button
                      onClick={() => completeQuest(quest.id)}
                      className="cyber-button px-6 py-2"
                      data-testid={`complete-quest-${i}`}
                    >
                      Complete
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Completion Reward */}
        {completedCount === totalCount && totalCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 text-center border-2 border-[#39FF14]"
          >
            <Flame className="w-16 h-16 text-[#39FF14] mx-auto mb-4 animate-pulse" />
            <h3 className="text-3xl font-black uppercase text-[#39FF14] mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              All Quests Complete!
            </h3>
            <p className="text-[#94A3B8]">
              Excellent work! Come back tomorrow for new challenges.
            </p>
          </motion.div>
        )}
      </div>

      {/* Animations */}
      {showXPAnimation && (
        <XPAnimation
          xpGained={xpGained}
          onComplete={() => setShowXPAnimation(false)}
        />
      )}
      
      {showLevelUp && (
        <LevelUpAnimation
          newLevel={newLevel}
          onClose={() => setShowLevelUp(false)}
        />
      )}
    </Layout>
  );
};

export default DailyQuests;
