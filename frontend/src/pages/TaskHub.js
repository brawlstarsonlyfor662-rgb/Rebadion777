import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { Plus, Trash2, CheckCircle, Circle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const TaskHub = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skill_tree: 'Mind',
    difficulty: 1,
    estimated_minutes: 10
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/tasks', formData);
      toast.success('Task created! +XP on completion');
      setShowCreateDialog(false);
      setFormData({ title: '', description: '', skill_tree: 'Mind', difficulty: 1, estimated_minutes: 10 });
      fetchTasks();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const completeTask = async (taskId) => {
    try {
      const response = await axios.patch(`/tasks/${taskId}/complete`);
      if (response.data.level_up) {
        toast.success('LEVEL UP! 🎉', { description: `You reached level ${response.data.new_level}!` });
      } else {
        toast.success(`+${response.data.xp_gained} XP earned!`);
      }
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to complete task');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`/tasks/${taskId}`);
      toast.info('Task deleted');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" data-testid="task-hub-container">
        <div className="flex items-center justify-between">
          <h1 className="text-5xl font-black uppercase neon-glow" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Task Hub
          </h1>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <button className="cyber-button" data-testid="create-task-btn">
                <Plus className="w-5 h-5 mr-2 inline-block" />
                New Task
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#121218] border-white/10 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Create Task
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={createTask} className="space-y-4" data-testid="create-task-form">
                <Input
                  placeholder="Task title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  data-testid="task-title-input"
                  className="bg-[#0A0A0F] border-white/10 text-white"
                />
                <Input
                  placeholder="Description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  data-testid="task-description-input"
                  className="bg-[#0A0A0F] border-white/10 text-white"
                />
                <Select value={formData.skill_tree} onValueChange={(val) => setFormData({ ...formData, skill_tree: val })}>
                  <SelectTrigger className="bg-[#0A0A0F] border-white/10 text-white" data-testid="skill-tree-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121218] border-white/10 text-white">
                    <SelectItem value="Mind">Mind</SelectItem>
                    <SelectItem value="Knowledge">Knowledge</SelectItem>
                    <SelectItem value="Discipline">Discipline</SelectItem>
                    <SelectItem value="Fitness">Fitness</SelectItem>
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[#94A3B8] mb-2 block">Difficulty (1-5)</label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
                      data-testid="difficulty-input"
                      className="bg-[#0A0A0F] border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#94A3B8] mb-2 block">Time (minutes)</label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.estimated_minutes}
                      onChange={(e) => setFormData({ ...formData, estimated_minutes: parseInt(e.target.value) })}
                      data-testid="time-input"
                      className="bg-[#0A0A0F] border-white/10 text-white"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full cyber-button" data-testid="submit-task-btn">
                  Create Task
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Tasks */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>Active Missions</h2>
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : activeTasks.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-[#94A3B8] mb-4">No active tasks. Create one to start earning XP!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {activeTasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="task-card glass-card p-6"
                  data-testid={`active-task-${i}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{task.title}</h3>
                      {task.description && <p className="text-[#94A3B8] mb-4">{task.description}</p>}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="px-3 py-1 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-full font-mono">
                          {task.skill_tree}
                        </span>
                        <span className="font-mono text-[#94A3B8]">{task.estimated_minutes} min</span>
                        <span className="font-mono text-[#00F0FF]">+{task.xp_reward} XP</span>
                        <span>{'⭐'.repeat(task.difficulty)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => completeTask(task.id)}
                        className="p-2 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-md hover:bg-[#39FF14]/20 transition-colors"
                        data-testid={`complete-task-btn-${i}`}
                      >
                        <CheckCircle className="w-5 h-5 text-[#39FF14]" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 bg-[#FF2A6D]/10 border border-[#FF2A6D]/30 rounded-md hover:bg-[#FF2A6D]/20 transition-colors"
                        data-testid={`delete-task-btn-${i}`}
                      >
                        <Trash2 className="w-5 h-5 text-[#FF2A6D]" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold uppercase text-[#39FF14]" style={{ fontFamily: 'Orbitron, sans-serif' }}>Completed</h2>
            <div className="grid gap-3">
              {completedTasks.slice(0, 10).map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-4 opacity-60"
                  data-testid={`completed-task-${i}`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#39FF14]" />
                    <span className="line-through text-[#94A3B8]">{task.title}</span>
                    <span className="ml-auto text-[#39FF14] font-mono text-sm">+{task.xp_reward} XP</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TaskHub;