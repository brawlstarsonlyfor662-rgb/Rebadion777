import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { AuthContext } from '../App';
import Layout from '../components/Layout';
import { MessageSquare, Send, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const AICoach = () => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('motivational');

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/ai-coach/chat', {
        message: input,
        mode: mode
      });

      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error('Coach unavailable. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const modeConfig = {
    strict: { color: '#FF2A6D', label: 'Strict', desc: 'Military discipline' },
    strategic: { color: '#00F0FF', label: 'Strategic', desc: 'Calm planner' },
    analytical: { color: '#7000FF', label: 'Analytical', desc: 'Data-driven' },
    motivational: { color: '#39FF14', label: 'Motivational', desc: 'Energetic support' }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8 h-[calc(100vh-8rem)]" data-testid="ai-coach-container">
        <div className="flex flex-col h-full glass-card">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <h1 className="text-4xl font-black uppercase neon-glow mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              AI Coach
            </h1>
            
            {/* Mode Selector */}
            <Tabs value={mode} onValueChange={setMode} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-[#0A0A0F] border border-white/10">
                {Object.entries(modeConfig).map(([key, config]) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="data-[state=active]:bg-[#121218] data-[state=active]:text-white"
                    data-testid={`mode-${key}`}
                  >
                    <div className="text-center">
                      <div className="font-bold" style={{ color: mode === key ? config.color : undefined }}>
                        {config.label}
                      </div>
                      <div className="text-xs text-[#94A3B8]">{config.desc}</div>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="messages-container">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 text-[#00F0FF] mx-auto mb-4 opacity-50" />
                <p className="text-[#94A3B8]">Ask your AI coach anything. Get personalized guidance.</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${i}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-[#00F0FF]/10 border border-[#00F0FF]/30'
                        : 'bg-[#121218] border border-white/10'
                    }`}
                  >
                    <p className="text-sm mb-1 text-[#94A3B8] font-mono uppercase">
                      {msg.role === 'user' ? user?.username : `Coach (${mode})`}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#121218] border border-white/10 p-4 rounded-lg">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-[#00F0FF] rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-[#00F0FF] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-[#00F0FF] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-6 border-t border-white/10" data-testid="chat-input-form">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your coach anything..."
                className="flex-1 bg-[#0A0A0F] border border-white/10 rounded-md px-4 py-3 text-white placeholder-white/20 focus:border-[#00F0FF] focus:outline-none focus:ring-1 focus:ring-[#00F0FF]"
                disabled={loading}
                data-testid="chat-input"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="cyber-button px-6"
                data-testid="send-message-btn"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AICoach;