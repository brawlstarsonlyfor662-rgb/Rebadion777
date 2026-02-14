import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import XPAnimation from '../components/XPAnimation';
import LevelUpAnimation from '../components/LevelUpAnimation';
import { Calendar, CheckCircle, Circle, Award, TrendingUp, Zap } from 'lucide-react';

const WeeklyQuests = () => {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      const response = await axios.get('/quests/weekly');
      setQuests(response.data.quests);
    } catch (error) {
      toast.error('Failed to load weekly quests');
    } finally {
      setLoading(false);
    }
  };

  const completeQuest = async (questId) => {
    try {
      const response = await axios.post(`/quests/${questId}/complete`, null, {
        params: { quest_type: 'weekly' }
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
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8" data-testid="weekly-quests-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <Award className="w-12 h-12 text-[#FF0099]" />
            <h1 className="text-5xl font-black uppercase neon-glow-pink" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Weekly Quests
            </h1>
          </div>
          <p className="text-[#94A3B8] text-lg">
            Epic challenges • Higher rewards • Resets every Monday
          </p>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 border-2 border-[#FF0099]"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold uppercase text-[#FF0099]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Weekly Progress
              </h3>
              <p className="text-sm text-[#94A3B8] font-mono">
                {completedCount} / {totalCount} Epic Quests Complete
              </p>
            </div>
            <div className="text-5xl font-black text-[#FF0099]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {Math.round(progressPercentage)}%
            </div>
          </div>
          <div className="xp-bar h-8 bg-[#FF0099]/20 border-[#FF0099]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #FF0099 0%, #7000FF 100%)',
                boxShadow: '0 0 20px rgba(255, 0, 153, 0.5)'
              }}
            />
          </div>
        </motion.div>

        {/* Quests List */}
        {loading ? (
          <div className="text-center py-12">Loading epic quests...</div>
        ) : (
          <div className="grid gap-6">
            {quests.map((quest, i) => {
              const questProgress = totalCount > 0 ? (quest.progress / quest.target) * 100 : 0;
              
              return (
                <motion.div
                  key={quest.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`glass-card p-8 border-2 ${
                    quest.completed ? 'border-[#39FF14] opacity-80' : 'border-[#FF0099]/30'
                  }`}
                  data-testid={`weekly-quest-${i}`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {quest.completed ? (
                          <CheckCircle className="w-8 h-8 text-[#39FF14]" />
                        ) : (
                          <Circle className="w-8 h-8 text-[#FF0099]" />
                        )}
                        <h3 className={`text-2xl font-bold ${
                          quest.completed ? 'line-through text-[#94A3B8]' : 'text-[#FF0099]'
                        }`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                          {quest.title}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm mb-4">
                        <span className="flex items-center gap-2 font-mono text-[#00F0FF] text-lg">
                          <Zap className="w-5 h-5" />
                          +{quest.xp_reward} XP
                        </span>
                        <span className="flex items-center gap-2 font-mono text-[#94A3B8]">
                          <TrendingUp className="w-4 h-4" />
                          {quest.progress} / {quest.target}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="xp-bar h-4 bg-[#FF0099]/10 border-[#FF0099]/30">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${questProgress}%` }}
                            className="h-full bg-[#FF0099] rounded-full"
                          />
                        </div>
                        <div className="text-xs text-[#94A3B8] mt-1 font-mono">
                          {Math.round(questProgress)}% Complete
                        </div>
                      </div>
                    </div>

                    {!quest.completed && quest.progress >= quest.target && (
                      <button
                        onClick={() => completeQuest(quest.id)}
                        className="cyber-button px-8 py-3 ml-4"
                        data-testid={`complete-weekly-${i}`}
                      >
                        Claim Reward
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* All Complete Banner */}
        {completedCount === totalCount && totalCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 text-center border-4 border-[#FAFF00]"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Award className="w-24 h-24 text-[#FAFF00] mx-auto mb-6" />
            </motion.div>
            <h3 className="text-4xl font-black uppercase text-[#FAFF00] mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Weekly Master!
            </h3>
            <p className="text-xl text-[#94A3B8] mb-2">
              You've completed all weekly quests!
            </p>
            <p className="text-[#94A3B8]">
              New challenges unlock next Monday. Keep up the momentum!
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

export default WeeklyQuests;
