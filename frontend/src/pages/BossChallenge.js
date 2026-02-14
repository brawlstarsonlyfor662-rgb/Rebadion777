import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { AuthContext } from '../App';
import Layout from '../components/Layout';
import XPAnimation from '../components/XPAnimation';
import LevelUpAnimation from '../components/LevelUpAnimation';
import { Swords, Crown, Zap, Brain, AlertTriangle, Trophy } from 'lucide-react';

const BossChallenge = () => {
  const { user } = useContext(AuthContext);
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [examMode, setExamMode] = useState(false);
  const [examId, setExamId] = useState(null);
  const [questions, setQuestions] = useState('');
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);

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

  const startExam = async () => {
    try {
      const response = await axios.get(`/boss-challenge/${challenge.id}/generate-exam`);
      setExamId(response.data.exam_id);
      setQuestions(response.data.questions);
      setExamMode(true);
      toast.success('Exam generated! Good luck, warrior.');
    } catch (error) {
      toast.error('Failed to generate exam');
    }
  };

  const submitExam = async () => {
    if (Object.keys(answers).length < 5) {
      toast.error('Please answer all questions');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`/boss-challenge/submit-exam?exam_id=${examId}`, answers);
      setResult(response.data);
      
      if (response.data.xp_gained > 0) {
        setXpGained(response.data.xp_gained);
        setShowXPAnimation(true);
      }
      
      if (response.data.level_up) {
        setTimeout(() => {
          setNewLevel(response.data.new_level);
          setShowLevelUp(true);
        }, 2000);
      }
      
      setExamMode(false);
      fetchChallenge();
    } catch (error) {
      toast.error('Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A*': '#FAFF00',
      'A': '#39FF14',
      'B': '#00F0FF',
      'C': '#FF9900',
      'D': '#FF6600',
      'F': '#FF2A6D'
    };
    return colors[grade] || '#94A3B8';
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
        {/* Header */}
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
          <p className="text-[#94A3B8] text-lg">AI-Generated Exam • Level {user?.level} Difficulty</p>
        </div>

        {/* Exam Mode */}
        {examMode ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="glass-card p-6 border-2 border-[#FF0099]">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-[#FF0099]" />
                <h3 className="text-xl font-bold uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Boss Exam - Answer All Questions
                </h3>
              </div>
              <div className="whitespace-pre-wrap text-[#E2E8F0] font-mono text-sm leading-relaxed">
                {questions}
              </div>
            </div>

            {/* Answer Input */}
            <div className="glass-card p-6">
              <h4 className="text-lg font-bold mb-4 uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>Your Answers</h4>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div key={num}>
                    <label className="block text-sm font-mono text-[#94A3B8] mb-2">Question {num}</label>
                    <select
                      value={answers[`q${num}`] || ''}
                      onChange={(e) => setAnswers({...answers, [`q${num}`]: e.target.value})}
                      className="w-full bg-[#0A0A0F] border border-white/10 rounded-md px-4 py-2 text-white"
                      data-testid={`answer-${num}`}
                    >
                      <option value="">Select answer...</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                ))}
              </div>

              <button
                onClick={submitExam}
                disabled={submitting || Object.keys(answers).length < 5}
                className="w-full cyber-button mt-6"
                data-testid="submit-exam-btn"
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            </div>
          </motion.div>
        ) : result ? (
          /* Results Display */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="glass-card p-12 text-center border-4" style={{ borderColor: getGradeColor(result.grade) }}>
              <Trophy className="w-20 h-20 mx-auto mb-6" style={{ color: getGradeColor(result.grade) }} />
              
              <h2 className="text-5xl font-black mb-4" style={{ fontFamily: 'Orbitron, sans-serif', color: getGradeColor(result.grade) }}>
                GRADE: {result.grade}
              </h2>
              
              <div className="text-3xl font-bold mb-6" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                Score: {result.score.toFixed(1)}%
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
                <div className="glass-card p-4">
                  <div className="text-2xl font-black text-[#00F0FF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {result.xp_gained >= 0 ? '+' : ''}{result.xp_gained}
                  </div>
                  <div className="text-xs text-[#94A3B8] uppercase">XP Gained</div>
                </div>
                {result.xp_penalty > 0 && (
                  <div className="glass-card p-4">
                    <div className="text-2xl font-black text-[#FF2A6D]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      -{result.xp_penalty}
                    </div>
                    <div className="text-xs text-[#94A3B8] uppercase">XP Penalty</div>
                  </div>
                )}
              </div>

              {result.extra_quests > 0 && (
                <div className="glass-card p-4 border-2 border-[#FF2A6D] mb-6">
                  <AlertTriangle className="w-6 h-6 text-[#FF2A6D] mx-auto mb-2" />
                  <p className="text-[#FF2A6D] font-bold">Performance Below 50%</p>
                  <p className="text-[#94A3B8] text-sm">+{result.extra_quests} extra daily quests assigned</p>
                </div>
              )}

              <button
                onClick={() => setResult(null)}
                className="cyber-button px-8 py-3"
              >
                Close Results
              </button>
            </div>
          </motion.div>
        ) : challenge?.completed ? (
          /* Already Completed */
          <div className="glass-card p-12 text-center">
            <Crown className="w-24 h-24 text-[#39FF14] mx-auto mb-6" />
            <h2 className="text-4xl font-black uppercase text-[#39FF14] mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Victory!
            </h2>
            <p className="text-[#94A3B8] text-lg">You've conquered today's boss. Return tomorrow for a new challenge.</p>
          </div>
        ) : (
          /* Challenge Info */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 border-2 border-[#FF0099]/50 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF0099]/10 to-transparent" />
            <div className="relative z-10 space-y-8">
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
                    <div className="text-xs text-[#94A3B8] font-mono uppercase">Base XP Reward</div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 bg-[#00F0FF]/5">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-[#00F0FF]" />
                  AI Exam System
                </h3>
                <ul className="text-sm text-[#94A3B8] space-y-2">
                  <li>• 5 multiple-choice questions generated by AI</li>
                  <li>• Difficulty scales with your level ({user?.level})</li>
                  <li>• Grading: A* (≥95%), A (≥85%), B (≥70%), C (≥50%), D (≥40%), F (<40%)</li>
                  <li>• Score below 50% = XP penalty + extra daily quests</li>
                  <li>• Higher grades = XP multipliers!</li>
                </ul>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={startExam}
                  className="cyber-button text-lg px-12 py-4 flex items-center gap-3"
                  data-testid="start-exam-btn"
                >
                  <Zap className="w-6 h-6" />
                  Start AI Exam
                </button>
              </div>
            </div>
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

export default BossChallenge;