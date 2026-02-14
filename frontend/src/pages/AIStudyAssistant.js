import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { AuthContext } from '../App';
import Layout from '../components/Layout';
import { 
  BookOpen, Calculator, Atom, Globe, Palette, Code,
  Sparkles, Send, Lightbulb, CheckSquare, FileText
} from 'lucide-react';

const AIStudyAssistant = () => {
  const { user } = useContext(AuthContext);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [assistType, setAssistType] = useState('explain'); // explain, quiz, plan, summary
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');

  const subjects = [
    { id: 'math', name: 'Mathematics', icon: <Calculator />, color: '#00F0FF', description: 'Algebra, Calculus, Geometry' },
    { id: 'physics', name: 'Physics', icon: <Atom />, color: '#7000FF', description: 'Mechanics, Thermodynamics, Quantum' },
    { id: 'chemistry', name: 'Chemistry', icon: <Atom />, color: '#FF0099', description: 'Organic, Inorganic, Physical' },
    { id: 'biology', name: 'Biology', icon: <Sparkles />, color: '#39FF14', description: 'Cell Biology, Genetics, Ecology' },
    { id: 'history', name: 'History', icon: <Globe />, color: '#FAFF00', description: 'World History, Events, Timelines' },
    { id: 'literature', name: 'Literature', icon: <BookOpen />, color: '#FF6600', description: 'Analysis, Themes, Writing' },
    { id: 'programming', name: 'Programming', icon: <Code />, color: '#00FFFF', description: 'Python, JavaScript, Algorithms' },
    { id: 'art', name: 'Art & Design', icon: <Palette />, color: '#FF99CC', description: 'Theory, Techniques, History' },
  ];

  const assistTypes = [
    { id: 'explain', name: 'Explain Concept', icon: <Lightbulb />, prompt: 'Explain this concept in simple terms:' },
    { id: 'quiz', name: 'Generate Quiz', icon: <CheckSquare />, prompt: 'Generate 5 quiz questions about:' },
    { id: 'plan', name: 'Study Plan', icon: <FileText />, prompt: 'Create a study plan for:' },
    { id: 'summary', name: 'Summarize', icon: <BookOpen />, prompt: 'Summarize this topic:' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedSubject) return;

    setLoading(true);
    setResponse('');

    try {
      const assistTypeObj = assistTypes.find(t => t.id === assistType);
      const subject = subjects.find(s => s.id === selectedSubject);
      
      const fullPrompt = `You are a ${subject.name} tutor for students. ${assistTypeObj.prompt} ${input}. 
      Keep it concise, engaging, and student-friendly. Use examples and analogies.`;

      const res = await axios.post('/ai-coach/chat', {
        message: fullPrompt,
        mode: 'strategic'
      });

      setResponse(res.data.response);
      toast.success('AI response generated!');
    } catch (error) {
      toast.error('Failed to generate response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" data-testid="ai-study-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-5xl font-black uppercase neon-glow mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            AI Study Assistant
          </h1>
          <p className="text-[#94A3B8] text-lg">Powered by AI • Master any subject</p>
        </motion.div>

        {/* Subject Selection */}
        {!selectedSubject ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {subjects.map((subject, i) => (
              <motion.button
                key={subject.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedSubject(subject.id)}
                className="glass-card p-6 text-center hover:border-[#00F0FF]/50 transition-all group"
                data-testid={`subject-${subject.id}`}
              >
                <motion.div
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{
                    background: `radial-gradient(circle, ${subject.color}20 0%, transparent 70%)`,
                    border: `2px solid ${subject.color}50`
                  }}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <div style={{ color: subject.color }}>{subject.icon}</div>
                </motion.div>
                <h3 className="text-xl font-bold mb-2 uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {subject.name}
                </h3>
                <p className="text-sm text-[#94A3B8]">{subject.description}</p>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Back button */}
            <button
              onClick={() => {
                setSelectedSubject(null);
                setResponse('');
                setInput('');
              }}
              className="text-[#00F0FF] hover:text-[#7000FF] transition-colors"
            >
              ← Back to subjects
            </button>

            {/* Selected Subject Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6 flex items-center gap-4"
            >
              <div style={{ color: subjects.find(s => s.id === selectedSubject)?.color }}>
                {subjects.find(s => s.id === selectedSubject)?.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {subjects.find(s => s.id === selectedSubject)?.name}
                </h2>
                <p className="text-[#94A3B8]">AI-Powered Learning</p>
              </div>
            </motion.div>

            {/* Assist Type Selector */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {assistTypes.map((type) => (
                <motion.button
                  key={type.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAssistType(type.id)}
                  className={`glass-card p-4 text-center transition-all ${
                    assistType === type.id ? 'border-[#00F0FF] bg-[#00F0FF]/10' : ''
                  }`}
                  data-testid={`assist-type-${type.id}`}
                >
                  <div className={`w-10 h-10 mx-auto mb-2 flex items-center justify-center ${
                    assistType === type.id ? 'text-[#00F0FF]' : 'text-[#94A3B8]'
                  }`}>
                    {type.icon}
                  </div>
                  <div className="text-sm font-bold">{type.name}</div>
                </motion.button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
              <div>
                <label className="block text-sm font-mono uppercase tracking-wider text-[#94A3B8] mb-2">
                  {assistTypes.find(t => t.id === assistType)?.name}
                </label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter your question or topic..."
                  rows={4}
                  className="w-full bg-[#0A0A0F] border border-white/10 rounded-md px-4 py-3 text-white placeholder-white/20 focus:border-[#00F0FF] focus:outline-none focus:ring-1 focus:ring-[#00F0FF]"
                  required
                  data-testid="ai-study-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-full cyber-button flex items-center justify-center gap-2"
                data-testid="generate-btn"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate AI Response
                  </>
                )}
              </button>
            </form>

            {/* AI Response */}
            <AnimatePresence>
              {response && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass-card p-6"
                  data-testid="ai-response"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-6 h-6 text-[#00F0FF]" />
                    <h3 className="text-xl font-bold uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      AI Response
                    </h3>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <div className="text-[#E2E8F0] leading-relaxed whitespace-pre-wrap">
                      {response}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AIStudyAssistant;
