import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, Award } from 'lucide-react';

const XPAnimation = ({ xpGained, onComplete }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0, opacity: 0, y: -50 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 360],
          }}
          transition={{ duration: 1, repeat: 1 }}
          className="relative"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-[#00F0FF] blur-3xl opacity-50 rounded-full" />
          
          {/* XP Display */}
          <div className="relative bg-gradient-to-br from-[#00F0FF] to-[#7000FF] p-8 rounded-2xl border-4 border-[#00F0FF] shadow-2xl">
            <div className="flex items-center gap-4">
              <Zap className="w-12 h-12 text-black animate-pulse" />
              <div>
                <div className="text-5xl font-black text-black" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  +{xpGained} XP
                </div>
                <div className="text-sm text-black/70 font-bold uppercase">Experience Gained!</div>
              </div>
            </div>
          </div>

          {/* Particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{
                x: Math.cos((i / 12) * Math.PI * 2) * 100,
                y: Math.sin((i / 12) * Math.PI * 2) * 100,
                opacity: 0,
              }}
              transition={{ duration: 1, delay: i * 0.05 }}
              className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#00F0FF] rounded-full"
            />
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default XPAnimation;
