import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Play, Pause, Square, Zap, Timer } from 'lucide-react';

const FocusMode = () => {
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [mode, setMode] = useState('normal');

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const startSession = async () => {
    try {
      const response = await axios.post('/focus-sessions', { mode });
      setSessionId(response.data.id);
      setIsActive(true);
      toast.success('Focus session started!');
    } catch (error) {
      toast.error('Failed to start session');
    }
  };

  const endSession = async (successful = true) => {
    if (!sessionId) return;

    try {
      await axios.patch(`/focus-sessions/${sessionId}/end`, {
        duration_minutes: Math.floor(seconds / 60),
        successful
      });
      toast.success(successful ? `Great focus! ${Math.floor(seconds / 60)} minutes logged` : 'Session ended');
      setIsActive(false);
      setSeconds(0);
      setSessionId(null);
    } catch (error) {
      toast.error('Failed to end session');
    }
  };

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8" data-testid="focus-mode-container">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black uppercase neon-glow mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Focus Mode
          </h1>
          <p className="text-[#94A3B8] text-lg">Eliminate distractions. Enter flow state.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 text-center relative overflow-hidden"
          data-testid="focus-timer-card"
        >
          {isActive && (
            <div className="absolute inset-0 focus-overlay" />
          )}

          <div className="relative z-10">
            {/* Timer Display */}
            <motion.div
              animate={isActive ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-12"
            >
              <div className="text-8xl md:text-9xl font-black neon-glow" style={{ fontFamily: 'JetBrains Mono, monospace' }} data-testid="timer-display">
                {formatTime(seconds)}
              </div>
              <div className="text-sm text-[#94A3B8] mt-4 font-mono uppercase tracking-widest">
                {isActive ? 'In Deep Focus' : 'Ready to Start'}
              </div>
            </motion.div>

            {/* Controls */}
            <div className="flex justify-center gap-4 mb-8">
              {!isActive ? (
                <button
                  onClick={startSession}
                  className="cyber-button text-lg px-12 py-4 flex items-center gap-3"
                  data-testid="start-focus-btn"
                >
                  <Play className="w-6 h-6" />
                  Start Focus
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsActive(false)}
                    className="bg-[#FAFF00]/10 border-2 border-[#FAFF00] text-[#FAFF00] font-bold uppercase tracking-wider px-8 py-3 rounded-md hover:bg-[#FAFF00]/20 transition-all"
                    data-testid="pause-focus-btn"
                  >
                    <Pause className="inline-block mr-2 w-5 h-5" />
                    Pause
                  </button>
                  <button
                    onClick={() => endSession(true)}
                    className="bg-[#39FF14]/10 border-2 border-[#39FF14] text-[#39FF14] font-bold uppercase tracking-wider px-8 py-3 rounded-md hover:bg-[#39FF14]/20 transition-all"
                    data-testid="complete-focus-btn"
                  >
                    <Square className="inline-block mr-2 w-5 h-5" />
                    Complete
                  </button>
                </>
              )}
            </div>

            {/* Mode Selector */}
            {!isActive && (
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                {[
                  { value: 'normal', label: 'Normal', color: '#00F0FF' },
                  { value: 'emergency', label: 'Emergency', color: '#FF0099' },
                  { value: 'boss_challenge', label: 'Boss Mode', color: '#FAFF00' },
                ].map((modeOption) => (
                  <button
                    key={modeOption.value}
                    onClick={() => setMode(modeOption.value)}
                    className={`glass-card p-4 transition-all ${
                      mode === modeOption.value ? 'border-2' : 'border border-white/10'
                    }`}
                    style={{
                      borderColor: mode === modeOption.value ? modeOption.color : undefined
                    }}
                    data-testid={`mode-${modeOption.value}`}
                  >
                    <div className="font-bold uppercase" style={{ fontFamily: 'Orbitron, sans-serif', color: mode === modeOption.value ? modeOption.color : '#94A3B8' }}>
                      {modeOption.label}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 glass-card p-6"
          data-testid="focus-tips"
        >
          <h3 className="text-xl font-bold uppercase mb-4 flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            <Zap className="w-5 h-5 text-[#00F0FF]" />
            Focus Tips
          </h3>
          <ul className="space-y-2 text-[#94A3B8]">
            <li>• Close all unnecessary tabs and apps</li>
            <li>• Put phone on Do Not Disturb</li>
            <li>• Use the Pomodoro technique: 25min focus, 5min break</li>
            <li>• Emergency mode = max intensity, no interruptions</li>
            <li>• Boss mode = for daily boss challenges only</li>
          </ul>
        </motion.div>
      </div>
    </Layout>
  );
};

export default FocusMode;