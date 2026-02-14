import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Zap } from 'lucide-react';

const LevelUpAnimation = ({ newLevel, onClose }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Radial glow */}
          <div className="absolute inset-0 bg-gradient-radial from-[#FAFF00] to-transparent blur-3xl opacity-50" />
          
          {/* Main card */}
          <div className="relative glass-card p-12 text-center border-4 border-[#FAFF00] shadow-2xl max-w-md">
            {/* Trophy icon */}
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, 10, -10, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-6"
            >
              <Trophy className="w-24 h-24 text-[#FAFF00] mx-auto" />
            </motion.div>

            {/* LEVEL UP text */}
            <motion.h1
              className="text-6xl font-black uppercase mb-4 neon-glow"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
              animate={{
                scale: [1, 1.1, 1],
                textShadow: [
                  '0 0 20px rgba(250, 255, 0, 0.8)',
                  '0 0 40px rgba(250, 255, 0, 1)',
                  '0 0 20px rgba(250, 255, 0, 0.8)',
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              LEVEL UP!
            </motion.h1>

            {/* New level */}
            <div className="mb-6">
              <div className="text-8xl font-black text-[#FAFF00]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {newLevel}
              </div>
              <div className="text-[#94A3B8] uppercase tracking-widest font-mono">New Level Achieved</div>
            </div>

            {/* Message */}
            <p className="text-lg text-[#94A3B8] mb-8">
              You're getting stronger! Keep pushing forward, warrior.
            </p>

            {/* Close button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="cyber-button px-8 py-3"
            >
              <Sparkles className="inline-block w-5 h-5 mr-2" />
              Continue
            </motion.button>
          </div>

          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400,
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.1,
              }}
              className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#FAFF00] rounded-full"
            />
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LevelUpAnimation;
