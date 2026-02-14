import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Layout from '../components/Layout';
import { Brain, BookOpen, Shield, Dumbbell } from 'lucide-react';

const SkillTrees = () => {
  const [skillTrees, setSkillTrees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSkillTrees();
  }, []);

  const fetchSkillTrees = async () => {
    try {
      const response = await axios.get('/skill-trees');
      setSkillTrees(response.data);
    } catch (error) {
      console.error('Failed to fetch skill trees:', error);
    } finally {
      setLoading(false);
    }
  };

  const treeConfig = {
    Mind: { icon: <Brain className="w-12 h-12" />, color: '#00F0FF', description: 'Mental agility and problem-solving' },
    Knowledge: { icon: <BookOpen className="w-12 h-12" />, color: '#7000FF', description: 'Learning and academic excellence' },
    Discipline: { icon: <Shield className="w-12 h-12" />, color: '#FF0099', description: 'Willpower and consistency' },
    Fitness: { icon: <Dumbbell className="w-12 h-12" />, color: '#39FF14', description: 'Physical health and energy' }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" data-testid="skill-trees-container">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black uppercase neon-glow mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Skill Trees
          </h1>
          <p className="text-[#94A3B8] text-lg">Level up all paths to become unstoppable</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading skill trees...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {skillTrees.map((tree, i) => {
              const config = treeConfig[tree.skill_tree];
              const nextLevelXP = (tree.level ** 2) * 100;
              const xpPercentage = (tree.xp / nextLevelXP) * 100;

              return (
                <motion.div
                  key={tree.skill_tree}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-8 hover:scale-[1.02] transition-transform"
                  data-testid={`skill-tree-${tree.skill_tree.toLowerCase()}`}
                >
                  <div className="text-center mb-6">
                    <div
                      className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center"
                      style={{
                        background: `radial-gradient(circle, ${config.color}20 0%, transparent 70%)`,
                        border: `2px solid ${config.color}50`
                      }}
                    >
                      <div style={{ color: config.color }}>
                        {config.icon}
                      </div>
                    </div>
                    <h2 className="text-3xl font-black uppercase mb-2" style={{ fontFamily: 'Orbitron, sans-serif', color: config.color }}>
                      {tree.skill_tree}
                    </h2>
                    <p className="text-sm text-[#94A3B8]">{config.description}</p>
                  </div>

                  {/* Level Display */}
                  <div className="text-center mb-6">
                    <div className="text-6xl font-black mb-2" style={{ fontFamily: 'Orbitron, sans-serif', color: config.color }}>
                      {tree.level}
                    </div>
                    <div className="text-sm text-[#94A3B8] font-mono">LEVEL</div>
                  </div>

                  {/* XP Progress */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-mono text-[#94A3B8]">XP Progress</span>
                      <span className="font-mono" style={{ color: config.color }}>
                        {tree.xp} / {nextLevelXP}
                      </span>
                    </div>
                    <div className="xp-bar h-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${xpPercentage}%` }}
                        className="h-full rounded-full"
                        style={{ background: config.color, boxShadow: `0 0 10px ${config.color}80` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="glass-card p-3">
                      <div className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: config.color }}>
                        {tree.total_xp}
                      </div>
                      <div className="text-xs text-[#94A3B8] font-mono uppercase">Total XP</div>
                    </div>
                    <div className="glass-card p-3">
                      <div className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: config.color }}>
                        {Math.round(xpPercentage)}%
                      </div>
                      <div className="text-xs text-[#94A3B8] font-mono uppercase">Complete</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SkillTrees;