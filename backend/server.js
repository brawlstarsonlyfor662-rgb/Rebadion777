import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({ logger: true });

// MongoDB connection
const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;
let db;

// Connect to MongoDB
const connectDB = async () => {
  const client = new MongoClient(mongoUrl);
  await client.connect();
  db = client.db(dbName);
  console.log('Connected to MongoDB');
};

// Register plugins
await fastify.register(cors, {
  origin: process.env.CORS_ORIGINS === '*' ? true : process.env.CORS_ORIGINS?.split(','),
  credentials: true
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET
});

// Auth decorator
fastify.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ detail: 'Invalid authentication credentials' });
  }
});

// Helper functions
const hashPassword = async (password) => bcrypt.hash(password, 10);
const verifyPassword = async (password, hash) => bcrypt.compare(password, hash);

// Gamification helpers
const calculateXpReward = (difficulty, estimatedMinutes, streakMultiplier = 1.0) => {
  const baseXp = difficulty * 20;
  const timeBonus = estimatedMinutes * 2;
  return Math.floor((baseXp + timeBonus) * streakMultiplier);
};

const calculateLevelFromXp = (totalXp) => {
  const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;
  return Math.max(1, Math.min(1000, level));
};

const xpForNextLevel = (currentLevel) => {
  if (currentLevel >= 1000) return 0;
  return currentLevel * currentLevel * 100;
};

const calculateStreak = (lastActive, currentStreak) => {
  const now = new Date();
  const diff = (now - new Date(lastActive)) / 1000;
  
  if (diff < 86400) return [currentStreak, 1.0];
  if (diff < 172800) {
    const newStreak = currentStreak + 1;
    const multiplier = Math.min(1.0 + newStreak * 0.1, 3.0);
    return [newStreak, multiplier];
  }
  return [0, 1.0];
};

const calculateGrade = (scorePercentage) => {
  const score = Math.round(scorePercentage * 10) / 10;
  let grade, xpMultiplier;
  
  if (score >= 95.0) { grade = 'A*'; xpMultiplier = 2.0; }
  else if (score >= 85.0) { grade = 'A'; xpMultiplier = 1.5; }
  else if (score >= 70.0) { grade = 'B'; xpMultiplier = 1.2; }
  else if (score >= 50.0) { grade = 'C'; xpMultiplier = 1.0; }
  else if (score >= 40.0) { grade = 'D'; xpMultiplier = 0.5; }
  else { grade = 'F'; xpMultiplier = 0.0; }
  
  let xpPenalty = 0, extraQuests = 0;
  if (score < 50.0) {
    xpPenalty = Math.floor((50.0 - score) * 10);
    extraQuests = Math.max(1, Math.floor((50.0 - score) / 10));
  }
  
  return { grade, score, xpMultiplier, xpPenalty, extraDailyQuests: extraQuests };
};

const ACHIEVEMENTS = {
  first_task: { title: 'First Steps', description: 'Complete your first task', icon: '🎯', check: (s) => s.tasksCompleted >= 1 },
  speed_demon: { title: 'Speed Demon', description: 'Complete 5 tasks in one day', icon: '⚡', check: (s) => s.tasksToday >= 5 },
  week_warrior: { title: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', check: (s) => s.currentStreak >= 7 },
  level_10: { title: 'Rising Star', description: 'Reach level 10', icon: '⭐', check: (s) => s.level >= 10 },
  focus_master: { title: 'Focus Master', description: 'Complete 100 focus sessions', icon: '🧠', check: (s) => s.totalFocusSessions >= 100 },
  discipline_god: { title: 'Discipline God', description: 'Reach 90+ discipline score', icon: '👑', check: (s) => s.disciplineScore >= 90 }
};

const checkAchievements = (userStats) => {
  return Object.entries(ACHIEVEMENTS)
    .filter(([, ach]) => ach.check(userStats))
    .map(([id]) => id);
};

const generateBossChallenge = (userLevel) => {
  const challenges = [
    'Complete 5 high-difficulty tasks',
    'Study for 2 hours without breaks',
    'Complete all tasks in your weakest skill tree',
    'Achieve a perfect focus session (no distractions)',
    'Complete tasks worth 500+ XP today'
  ];
  const difficulty = Math.min(5, Math.max(1, Math.floor(userLevel / 5) + 1));
  const xpReward = difficulty * 100 + userLevel * 10;
  return {
    challengeText: challenges[Math.floor(Math.random() * challenges.length)],
    difficulty,
    xpReward
  };
};

// AI Coach helper
const COACH_MODES = {
  strict: "You are a strict military-style discipline coach. Be tough, direct, and push the user to their limits.",
  strategic: "You are a calm, strategic planner and productivity expert. Analyze the situation logically.",
  analytical: "You are a data-driven performance analyst. Use stats and patterns to provide insights.",
  motivational: "You are an energetic, supportive motivational coach. Inspire and energize the user."
};

const getAIResponse = async (message, mode, userContext = {}) => {
  try {
    const { LlmChat, UserMessage } = await import('emergentintegrations/llm/chat');
    
    let systemMessage = COACH_MODES[mode] || COACH_MODES.motivational;
    if (userContext.level) {
      systemMessage += `\n\nUser Context: Level ${userContext.level}, Streak: ${userContext.streak || 0} days, Discipline: ${userContext.disciplineScore || 50}/100`;
    }
    
    const chat = new LlmChat({
      apiKey: process.env.EMERGENT_LLM_KEY,
      sessionId: `coach_${mode}`,
      systemMessage
    }).withModel('openai', 'gpt-5.2');
    
    const response = await chat.sendMessage(new UserMessage({ text: message }));
    return response;
  } catch (error) {
    return `Coach response: ${message}. Keep pushing forward!`;
  }
};

const detectBurnoutRisk = (focusSessions, tasks) => {
  if (focusSessions.length < 7) return { riskLevel: 'low', message: 'Not enough data yet' };
  
  const recent = focusSessions.slice(-7);
  const avgDuration = recent.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 7;
  const successRate = recent.filter(s => s.successful).length / 7;
  
  if (avgDuration > 360) return { riskLevel: 'high', message: 'Warning: Overworking detected. Take breaks.' };
  if (successRate < 0.5) return { riskLevel: 'medium', message: 'Focus success rate dropping. Try shorter sessions.' };
  return { riskLevel: 'low', message: "You're doing great!" };
};

const suggestOptimalTime = (focusSessions) => {
  if (focusSessions.length < 10) return 'Try studying in the morning for better focus.';
  
  const hourPerformance = {};
  focusSessions.forEach(s => {
    if (s.startTime && s.successful) {
      const hour = new Date(s.startTime).getHours();
      hourPerformance[hour] = (hourPerformance[hour] || 0) + 1;
    }
  });
  
  if (Object.keys(hourPerformance).length === 0) return 'Complete more sessions for recommendations.';
  
  const bestHour = Object.entries(hourPerformance).sort((a, b) => b[1] - a[1])[0][0];
  if (bestHour < 12) return `Your peak performance is at ${bestHour}:00. Morning power!`;
  if (bestHour < 17) return `You focus best at ${bestHour}:00. Afternoon warrior!`;
  return `You're most productive at ${bestHour}:00. Night owl mode!`;
};

// Helper to get current user
const getCurrentUser = async (request) => {
  const userId = request.user.userId;
  const user = await db.collection('users').findOne({ id: userId }, { projection: { _id: 0 } });
  if (!user) throw { statusCode: 401, message: 'User not found' };
  // Normalize field names (support both camelCase and snake_case from old Python data)
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    level: user.level,
    xp: user.xp,
    totalXp: user.totalXp ?? user.total_xp ?? 0,
    currentStreak: user.currentStreak ?? user.current_streak ?? 0,
    longestStreak: user.longestStreak ?? user.longest_streak ?? 0,
    disciplineScore: user.disciplineScore ?? user.discipline_score ?? 50,
    createdAt: user.createdAt ?? user.created_at,
    lastActive: user.lastActive ?? user.last_active
  };
};

// Helper to get current admin
const getCurrentAdmin = async (request) => {
  const adminId = request.user.adminId;
  const admin = await db.collection('admins').findOne({ id: adminId }, { projection: { _id: 0 } });
  if (!admin) throw { statusCode: 401, message: 'Admin not found' };
  // Normalize field names
  return {
    ...admin,
    isSuperAdmin: admin.isSuperAdmin ?? admin.is_super_admin ?? false,
    hashedPassword: admin.hashedPassword || admin.hashed_password
  };
};

// ==================== ROUTES ====================

// Public Stats
fastify.get('/api/public/stats', async () => {
  const totalUsers = await db.collection('users').countDocuments({});
  const totalTasks = await db.collection('tasks').countDocuments({ completed: true });
  const allTasks = await db.collection('tasks').countDocuments({});
  const successRate = allTasks > 0 ? Math.round((totalTasks / allTasks) * 100) : 95;
  return { total_users: totalUsers, completed_tasks: totalTasks, success_rate: successRate };
});

// Auth Routes
fastify.post('/api/auth/signup', async (request, reply) => {
  const { email, username, password } = request.body;
  
  const existing = await db.collection('users').findOne({ email });
  if (existing) return reply.status(400).send({ detail: 'Email already registered' });
  
  const user = {
    id: uuidv4(),
    email,
    username,
    hashedPassword: await hashPassword(password),
    level: 1,
    xp: 0,
    totalXp: 0,
    currentStreak: 0,
    longestStreak: 0,
    disciplineScore: 50,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString()
  };
  
  await db.collection('users').insertOne(user);
  
  // Initialize skill trees
  for (const skill of ['Mind', 'Knowledge', 'Discipline', 'Fitness']) {
    await db.collection('skill_trees').insertOne({
      id: uuidv4(),
      userId: user.id,
      skillTree: skill,
      level: 1,
      xp: 0,
      totalXp: 0
    });
  }
  
  const token = fastify.jwt.sign({ userId: user.id });
  const { hashedPassword, ...userResponse } = user;
  return { access_token: token, token_type: 'bearer', user: userResponse };
});

fastify.post('/api/auth/login', async (request, reply) => {
  const { email, password } = request.body;
  
  const user = await db.collection('users').findOne({ email });
  if (!user) return reply.status(401).send({ detail: 'Invalid credentials' });
  
  const valid = await verifyPassword(password, user.hashedPassword);
  if (!valid) return reply.status(401).send({ detail: 'Invalid credentials' });
  
  const token = fastify.jwt.sign({ userId: user.id });
  const { hashedPassword, _id, ...userResponse } = user;
  return { access_token: token, token_type: 'bearer', user: userResponse };
});

fastify.get('/api/auth/me', { preHandler: [fastify.authenticate] }, async (request) => {
  return getCurrentUser(request);
});

// Task Routes
fastify.post('/api/tasks', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const { title, description, skill_tree, difficulty, estimated_minutes } = request.body;
  
  const xpReward = calculateXpReward(difficulty, estimated_minutes, 1.0 + user.currentStreak * 0.1);
  
  const task = {
    id: uuidv4(),
    userId: user.id,
    title,
    description: description || '',
    skillTree: skill_tree,
    difficulty,
    estimatedMinutes: estimated_minutes,
    xpReward,
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  await db.collection('tasks').insertOne(task);
  const { _id, ...taskResponse } = task;
  return { ...taskResponse, skill_tree, estimated_minutes, xp_reward: xpReward };
});

fastify.get('/api/tasks', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const query = { userId: user.id };
  if (request.query.completed !== undefined) {
    query.completed = request.query.completed === 'true';
  }
  
  const tasks = await db.collection('tasks').find(query, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
  return tasks.map(t => ({
    ...t,
    skill_tree: t.skillTree,
    estimated_minutes: t.estimatedMinutes,
    xp_reward: t.xpReward,
    user_id: t.userId,
    created_at: t.createdAt,
    completed_at: t.completedAt
  }));
});

fastify.patch('/api/tasks/:taskId/complete', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const user = await getCurrentUser(request);
  const { taskId } = request.params;
  
  const task = await db.collection('tasks').findOne({ id: taskId, userId: user.id });
  if (!task) return reply.status(404).send({ detail: 'Task not found' });
  if (task.completed) return reply.status(400).send({ detail: 'Task already completed' });
  
  await db.collection('tasks').updateOne(
    { id: taskId },
    { $set: { completed: true, completedAt: new Date().toISOString() } }
  );
  
  const xpGained = task.xpReward;
  const newTotalXp = user.totalXp + xpGained;
  const newLevel = calculateLevelFromXp(newTotalXp);
  const [newStreak] = calculateStreak(user.lastActive, user.currentStreak);
  
  await db.collection('users').updateOne(
    { id: user.id },
    { $set: {
      totalXp: newTotalXp,
      xp: newTotalXp % xpForNextLevel(newLevel),
      level: newLevel,
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, user.longestStreak),
      lastActive: new Date().toISOString()
    }}
  );
  
  await db.collection('skill_trees').updateOne(
    { userId: user.id, skillTree: task.skillTree },
    { $inc: { xp: xpGained, totalXp: xpGained } }
  );
  
  return { success: true, xp_gained: xpGained, new_level: newLevel, level_up: newLevel > user.level };
});

fastify.delete('/api/tasks/:taskId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const user = await getCurrentUser(request);
  const result = await db.collection('tasks').deleteOne({ id: request.params.taskId, userId: user.id });
  if (result.deletedCount === 0) return reply.status(404).send({ detail: 'Task not found' });
  return { success: true };
});

// Skill Trees
fastify.get('/api/skill-trees', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const trees = await db.collection('skill_trees').find({ userId: user.id }, { projection: { _id: 0 } }).toArray();
  return trees.map(t => ({ ...t, skill_tree: t.skillTree, user_id: t.userId, total_xp: t.totalXp }));
});

// Achievements
fastify.get('/api/achievements', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const achievements = await db.collection('achievements').find({ userId: user.id }, { projection: { _id: 0 } }).toArray();
  return achievements.map(a => ({ ...a, user_id: a.userId, achievement_id: a.achievementId, unlocked_at: a.unlockedAt }));
});

fastify.get('/api/achievements/available', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const today = new Date().toISOString().split('T')[0];
  
  const tasksCompleted = await db.collection('tasks').countDocuments({ userId: user.id, completed: true });
  const tasksToday = await db.collection('tasks').countDocuments({
    userId: user.id, completed: true, completedAt: { $regex: today }
  });
  const focusSessions = await db.collection('focus_sessions').countDocuments({ userId: user.id });
  
  const userStats = {
    tasksCompleted,
    tasksToday,
    currentStreak: user.currentStreak,
    level: user.level,
    totalFocusSessions: focusSessions,
    disciplineScore: user.disciplineScore
  };
  
  const unlockedIds = checkAchievements(userStats);
  const existing = await db.collection('achievements').find({ userId: user.id }).toArray();
  const existingIds = existing.map(a => a.achievementId);
  
  const newAchievements = [];
  for (const achId of unlockedIds) {
    if (!existingIds.includes(achId)) {
      const achievement = {
        id: uuidv4(),
        userId: user.id,
        achievementId: achId,
        title: ACHIEVEMENTS[achId].title,
        description: ACHIEVEMENTS[achId].description,
        icon: ACHIEVEMENTS[achId].icon,
        unlockedAt: new Date().toISOString()
      };
      await db.collection('achievements').insertOne(achievement);
      newAchievements.push(achievement);
    }
  }
  
  const allAchievements = Object.entries(ACHIEVEMENTS).map(([id, data]) => ({
    achievement_id: id,
    title: data.title,
    description: data.description,
    icon: data.icon,
    unlocked: unlockedIds.includes(id) || existingIds.includes(id)
  }));
  
  return { achievements: allAchievements, new_unlocks: newAchievements };
});

// Focus Sessions
fastify.post('/api/focus-sessions', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const { mode } = request.body;
  
  const session = {
    id: uuidv4(),
    userId: user.id,
    mode: mode || 'normal',
    startTime: new Date().toISOString(),
    successful: false
  };
  
  await db.collection('focus_sessions').insertOne(session);
  const { _id, ...sessionResponse } = session;
  return { ...sessionResponse, user_id: session.userId, start_time: session.startTime };
});

fastify.patch('/api/focus-sessions/:sessionId/end', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const { duration_minutes, successful } = request.body;
  
  await db.collection('focus_sessions').updateOne(
    { id: request.params.sessionId, userId: user.id },
    { $set: { endTime: new Date().toISOString(), durationMinutes: duration_minutes, successful } }
  );
  
  return { success: true };
});

fastify.get('/api/focus-sessions', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const sessions = await db.collection('focus_sessions').find({ userId: user.id }, { projection: { _id: 0 } }).sort({ startTime: -1 }).toArray();
  return sessions.map(s => ({ ...s, user_id: s.userId, start_time: s.startTime, end_time: s.endTime, duration_minutes: s.durationMinutes }));
});

// AI Coach
fastify.post('/api/ai-coach/chat', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const { message, mode } = request.body;
  
  const today = new Date().toISOString().split('T')[0];
  const tasksToday = await db.collection('tasks').countDocuments({
    userId: user.id, completed: true, completedAt: { $regex: today }
  });
  
  const userContext = {
    level: user.level,
    streak: user.currentStreak,
    disciplineScore: user.disciplineScore,
    tasksToday
  };
  
  const response = await getAIResponse(message, mode, userContext);
  
  await db.collection('chat_history').insertOne({
    userId: user.id,
    mode,
    userMessage: message,
    assistantMessage: response,
    timestamp: new Date().toISOString()
  });
  
  return { response, mode };
});

// Analytics
fastify.get('/api/analytics/dashboard', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  
  const tasks = await db.collection('tasks').find({ userId: user.id, completed: true }, { projection: { _id: 0 } }).toArray();
  const focusSessions = await db.collection('focus_sessions').find({ userId: user.id }, { projection: { _id: 0 } }).toArray();
  
  const totalTasks = tasks.length;
  const totalFocusTime = focusSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  
  const burnoutRisk = detectBurnoutRisk(focusSessions, tasks);
  const optimalTime = suggestOptimalTime(focusSessions);
  
  const weeklyData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayTasks = tasks.filter(t => t.completedAt?.startsWith(dateStr)).length;
    const dayFocus = focusSessions
      .filter(s => s.startTime?.startsWith(dateStr))
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    
    weeklyData.push({ date: dateStr, tasks: dayTasks, focus_minutes: dayFocus });
  }
  
  return {
    total_tasks: totalTasks,
    total_focus_time: totalFocusTime,
    current_level: user.level,
    current_xp: user.xp,
    next_level_xp: xpForNextLevel(user.level),
    discipline_score: user.disciplineScore,
    current_streak: user.currentStreak,
    longest_streak: user.longestStreak,
    burnout_risk: { risk_level: burnoutRisk.riskLevel, message: burnoutRisk.message },
    optimal_time: optimalTime,
    weekly_data: weeklyData
  };
});

// Boss Challenge
fastify.get('/api/boss-challenge/today', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const today = new Date().toISOString().split('T')[0];
  
  let existing = await db.collection('boss_challenges').findOne({ userId: user.id, date: today }, { projection: { _id: 0 } });
  if (existing) {
    return { ...existing, user_id: existing.userId, challenge_text: existing.challengeText, xp_reward: existing.xpReward };
  }
  
  const bossData = generateBossChallenge(user.level);
  const boss = {
    id: uuidv4(),
    userId: user.id,
    date: today,
    challengeText: bossData.challengeText,
    difficulty: bossData.difficulty,
    xpReward: bossData.xpReward,
    completed: false
  };
  
  await db.collection('boss_challenges').insertOne(boss);
  return { ...boss, user_id: boss.userId, challenge_text: boss.challengeText, xp_reward: boss.xpReward };
});

fastify.get('/api/boss-challenge/:challengeId/generate-exam', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const { challengeId } = request.params;
  
  const challenge = await db.collection('boss_challenges').findOne({ id: challengeId, userId: user.id });
  if (!challenge) return { statusCode: 404, message: 'Challenge not found' };
  
  const scaledDifficulty = Math.min(5, Math.max(1, Math.floor(user.level / 200) + 1));
  const questions = `Q1. What is the primary benefit of breaking tasks into micro-wins?
A) Less work overall
B) Instant dopamine rewards that reinforce positive habits
C) Avoiding responsibility
D) Making tasks harder
Correct: B

Q2. How does the streak multiplier work?
A) 5% per day
B) 10% per day up to 3x maximum
C) 20% per day
D) No multiplier exists
Correct: B

Q3. What happens when you score below 50% on a boss exam?
A) Nothing
B) XP penalty and extra daily quests
C) Account deletion
D) Level reset
Correct: B

Q4. Which skill tree focuses on mental agility?
A) Knowledge
B) Discipline
C) Mind
D) Fitness
Correct: C

Q5. What is the maximum level in the system?
A) 100
B) 500
C) 1000
D) Unlimited
Correct: C`;
  
  const exam = {
    id: uuidv4(),
    userId: user.id,
    challengeId,
    questions,
    createdAt: new Date().toISOString(),
    submitted: false
  };
  
  await db.collection('exams').insertOne(exam);
  return { exam_id: exam.id, questions };
});

fastify.post('/api/boss-challenge/submit-exam', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const user = await getCurrentUser(request);
  const examId = request.query.exam_id;
  const answers = request.body;
  
  const exam = await db.collection('exams').findOne({ id: examId, userId: user.id });
  if (!exam) return reply.status(404).send({ detail: 'Exam not found' });
  if (exam.submitted) return reply.status(400).send({ detail: 'Exam already submitted' });
  
  const correctAnswers = { q1: 'B', q2: 'B', q3: 'B', q4: 'C', q5: 'C' };
  let correct = 0;
  for (let i = 1; i <= 5; i++) {
    if (answers[`q${i}`]?.toUpperCase() === correctAnswers[`q${i}`]) correct++;
  }
  const scorePercentage = (correct / 5) * 100;
  
  const gradeData = calculateGrade(scorePercentage);
  const challenge = await db.collection('boss_challenges').findOne({ id: exam.challengeId });
  const baseXp = challenge?.xpReward || 100;
  const finalXp = Math.floor(baseXp * gradeData.xpMultiplier);
  const xpGained = finalXp - gradeData.xpPenalty;
  
  const newTotalXp = Math.max(0, user.totalXp + xpGained);
  const newLevel = calculateLevelFromXp(newTotalXp);
  
  await db.collection('users').updateOne(
    { id: user.id },
    { $set: { totalXp: newTotalXp, xp: newTotalXp % xpForNextLevel(newLevel), level: newLevel } }
  );
  
  await db.collection('exams').updateOne(
    { id: examId },
    { $set: { submitted: true, score: scorePercentage, grade: gradeData.grade, xpGained, submittedAt: new Date().toISOString() } }
  );
  
  await db.collection('boss_challenges').updateOne(
    { id: exam.challengeId },
    { $set: { completed: true, completedAt: new Date().toISOString() } }
  );
  
  return {
    success: true,
    score: gradeData.score,
    grade: gradeData.grade,
    xp_gained: xpGained,
    xp_penalty: gradeData.xpPenalty,
    extra_quests: gradeData.extraDailyQuests,
    level_up: newLevel > user.level,
    new_level: newLevel
  };
});

// Daily Quests
fastify.get('/api/quests/daily', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const today = new Date().toISOString().split('T')[0];
  
  const existing = await db.collection('daily_quests').find({ userId: user.id, date: today }, { projection: { _id: 0 } }).toArray();
  if (existing.length > 0) {
    return { quests: existing.map(q => ({ ...q, user_id: q.userId, xp_reward: q.xpReward })), date: today };
  }
  
  let extraQuests = 0;
  const recentExam = await db.collection('exams').findOne(
    { userId: user.id, submitted: true },
    { sort: { submittedAt: -1 } }
  );
  if (recentExam && recentExam.score < 50) {
    const gradeData = calculateGrade(recentExam.score);
    extraQuests = gradeData.extraDailyQuests;
  }
  
  const questTemplates = [
    { title: 'Complete 3 Study Tasks', xpReward: 50, target: 3, type: 'tasks' },
    { title: 'Focus for 30 minutes', xpReward: 40, target: 30, type: 'focus' },
    { title: 'Maintain your streak', xpReward: 30, target: 1, type: 'streak' },
    { title: 'Level up one skill tree', xpReward: 60, target: 1, type: 'skill' },
    { title: 'Complete AI Study session', xpReward: 50, target: 1, type: 'ai_study' }
  ];
  
  const totalQuests = Math.min(3 + extraQuests, questTemplates.length);
  const shuffled = questTemplates.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, totalQuests);
  
  const quests = [];
  for (const template of selected) {
    const quest = {
      id: uuidv4(),
      userId: user.id,
      date: today,
      title: template.title,
      xpReward: template.xpReward,
      target: template.target,
      progress: 0,
      completed: false,
      type: template.type
    };
    await db.collection('daily_quests').insertOne(quest);
    quests.push({ ...quest, user_id: quest.userId, xp_reward: quest.xpReward });
  }
  
  return { quests, date: today, extra_quests: extraQuests };
});

// Weekly Quests
fastify.get('/api/quests/weekly', { preHandler: [fastify.authenticate] }, async (request) => {
  const user = await getCurrentUser(request);
  const now = new Date();
  const weekNum = `${now.getFullYear()}-W${String(Math.ceil((now.getDate() + new Date(now.getFullYear(), 0, 1).getDay()) / 7)).padStart(2, '0')}`;
  
  const existing = await db.collection('weekly_quests').find({ userId: user.id, week: weekNum }, { projection: { _id: 0 } }).toArray();
  if (existing.length > 0) {
    return { quests: existing.map(q => ({ ...q, user_id: q.userId, xp_reward: q.xpReward })), week: weekNum };
  }
  
  const weeklyTemplates = [
    { title: 'Complete 20 tasks this week', xpReward: 200, target: 20, type: 'tasks' },
    { title: 'Achieve 7-day streak', xpReward: 300, target: 7, type: 'streak' },
    { title: 'Complete 3 Boss Challenges', xpReward: 250, target: 3, type: 'boss' },
    { title: 'Earn 1000 XP this week', xpReward: 150, target: 1000, type: 'xp' }
  ];
  
  const quests = [];
  for (const template of weeklyTemplates) {
    const quest = {
      id: uuidv4(),
      userId: user.id,
      week: weekNum,
      title: template.title,
      xpReward: template.xpReward,
      target: template.target,
      progress: 0,
      completed: false,
      type: template.type
    };
    await db.collection('weekly_quests').insertOne(quest);
    quests.push({ ...quest, user_id: quest.userId, xp_reward: quest.xpReward });
  }
  
  return { quests, week: weekNum };
});

// Complete Quest
fastify.post('/api/quests/:questId/complete', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const user = await getCurrentUser(request);
  const { questId } = request.params;
  const questType = request.query.quest_type || 'daily';
  
  const collection = questType === 'daily' ? 'daily_quests' : 'weekly_quests';
  const quest = await db.collection(collection).findOne({ id: questId, userId: user.id });
  
  if (!quest) return reply.status(404).send({ detail: 'Quest not found' });
  if (quest.completed) return reply.status(400).send({ detail: 'Quest already completed' });
  
  await db.collection(collection).updateOne(
    { id: questId },
    { $set: { completed: true, progress: quest.target } }
  );
  
  const newTotalXp = user.totalXp + quest.xpReward;
  const newLevel = calculateLevelFromXp(newTotalXp);
  
  await db.collection('users').updateOne(
    { id: user.id },
    { $set: { totalXp: newTotalXp, xp: newTotalXp % xpForNextLevel(newLevel), level: newLevel } }
  );
  
  return { success: true, xp_gained: quest.xpReward, level_up: newLevel > user.level, new_level: newLevel };
});

// YouTube Learning (mocked)
fastify.get('/api/learning/youtube', { preHandler: [fastify.authenticate] }, async (request) => {
  const { subject, topic } = request.query;
  
  const videoDatabase = {
    math: [
      { title: 'Algebra Basics', url: 'https://youtube.com/watch?v=example1', channel: 'Khan Academy' },
      { title: 'Calculus Fundamentals', url: 'https://youtube.com/watch?v=example2', channel: '3Blue1Brown' }
    ],
    physics: [
      { title: 'Classical Mechanics', url: 'https://youtube.com/watch?v=example3', channel: 'MIT OpenCourseWare' },
      { title: 'Quantum Physics', url: 'https://youtube.com/watch?v=example4', channel: 'PBS Space Time' }
    ],
    programming: [
      { title: 'Python Tutorial', url: 'https://youtube.com/watch?v=example5', channel: 'freeCodeCamp' },
      { title: 'JavaScript Basics', url: 'https://youtube.com/watch?v=example6', channel: 'Traversy Media' }
    ]
  };
  
  const videos = videoDatabase[subject?.toLowerCase()] || [
    { title: `${subject} - ${topic}`, url: `https://youtube.com/results?search_query=${subject}+${topic}`, channel: 'Search Results' }
  ];
  
  return { videos, subject, topic };
});

// ==================== ADMIN ROUTES ====================

fastify.post('/api/system/access', async (request, reply) => {
  const { username, password } = request.body;
  
  const admin = await db.collection('admins').findOne({ username });
  if (!admin) return reply.status(401).send({ detail: 'Access denied' });
  
  // Support both camelCase and snake_case password field
  const hashedPwd = admin.hashedPassword || admin.hashed_password;
  const valid = await verifyPassword(password, hashedPwd);
  if (!valid) return reply.status(401).send({ detail: 'Access denied' });
  
  const token = fastify.jwt.sign({ adminId: admin.id });
  // Support both naming conventions for isSuperAdmin
  const isSuperAdmin = admin.isSuperAdmin ?? admin.is_super_admin ?? false;
  return { access_token: token, token_type: 'bearer', admin: { id: admin.id, username: admin.username, is_super_admin: isSuperAdmin } };
});

fastify.get('/api/system/status', { preHandler: [fastify.authenticate] }, async (request) => {
  const admin = await getCurrentAdmin(request);
  
  const totalUsers = await db.collection('users').countDocuments({});
  const totalTasks = await db.collection('tasks').countDocuments({});
  const completedTasks = await db.collection('tasks').countDocuments({ completed: true });
  
  const focusAgg = await db.collection('focus_sessions').aggregate([
    { $group: { _id: null, total: { $sum: '$durationMinutes' } } }
  ]).toArray();
  const totalFocusMinutes = focusAgg[0]?.total || 0;
  
  const users = await db.collection('users').find({}, { projection: { _id: 0, hashedPassword: 0 } }).sort({ createdAt: -1 }).limit(100).toArray();
  
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const activeUsers = await db.collection('users').countDocuments({ lastActive: { $gte: yesterday } });
  
  const recentTasks = await db.collection('tasks').find({ completed: true }, { projection: { _id: 0 } }).sort({ completedAt: -1 }).limit(20).toArray();
  
  return {
    total_users: totalUsers,
    active_users_24h: activeUsers,
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    total_focus_minutes: totalFocusMinutes,
    users: users.map(u => ({
      ...u,
      total_xp: u.totalXp,
      current_streak: u.currentStreak,
      created_at: u.createdAt
    })),
    recent_activity: recentTasks,
    admin: { username: admin.username, is_super_admin: admin.isSuperAdmin }
  };
});

fastify.post('/api/system/admin/create', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const admin = await getCurrentAdmin(request);
  if (!admin.isSuperAdmin) return reply.status(403).send({ detail: 'Only super admins can create new admins' });
  
  const { username, password } = request.body;
  
  const existing = await db.collection('admins').findOne({ username });
  if (existing) return reply.status(400).send({ detail: 'Admin username already exists' });
  
  const newAdmin = {
    id: uuidv4(),
    username,
    hashedPassword: await hashPassword(password),
    createdBy: admin.id,
    isSuperAdmin: false,
    createdAt: new Date().toISOString()
  };
  
  await db.collection('admins').insertOne(newAdmin);
  return { success: true, message: `Admin ${username} created` };
});

fastify.get('/api/system/admins', { preHandler: [fastify.authenticate] }, async () => {
  const admins = await db.collection('admins').find({}, { projection: { _id: 0, hashedPassword: 0 } }).toArray();
  return { admins: admins.map(a => ({ ...a, is_super_admin: a.isSuperAdmin, created_at: a.createdAt })) };
});

fastify.delete('/api/system/users/:userId', { preHandler: [fastify.authenticate] }, async (request) => {
  const { userId } = request.params;
  
  await db.collection('users').deleteOne({ id: userId });
  await db.collection('tasks').deleteMany({ userId });
  await db.collection('skill_trees').deleteMany({ userId });
  await db.collection('achievements').deleteMany({ userId });
  await db.collection('focus_sessions').deleteMany({ userId });
  await db.collection('boss_challenges').deleteMany({ userId });
  
  return { success: true, message: 'User deleted' };
});

fastify.post('/api/system/users/:userId/award-xp', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const { userId } = request.params;
  const xpAmount = parseInt(request.query.xp_amount) || 0;
  
  const user = await db.collection('users').findOne({ id: userId });
  if (!user) return reply.status(404).send({ detail: 'User not found' });
  
  const newTotalXp = user.totalXp + xpAmount;
  const newLevel = calculateLevelFromXp(newTotalXp);
  
  await db.collection('users').updateOne(
    { id: userId },
    { $set: { totalXp: newTotalXp, xp: newTotalXp % xpForNextLevel(newLevel), level: newLevel } }
  );
  
  return { success: true, xp_awarded: xpAmount, new_level: newLevel };
});

fastify.post('/api/system/users/:userId/ban', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const admin = await getCurrentAdmin(request);
  if (!admin.isSuperAdmin) return reply.status(403).send({ detail: 'Only super admins can ban users' });
  
  const { userId } = request.params;
  const durationDays = parseInt(request.query.duration_days) || 1;
  const banUntil = new Date(Date.now() + durationDays * 86400000).toISOString();
  
  await db.collection('users').updateOne(
    { id: userId },
    { $set: { banned: true, banUntil } }
  );
  
  return { success: true, banned_until: banUntil };
});

fastify.post('/api/system/users/:userId/reset', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const admin = await getCurrentAdmin(request);
  if (!admin.isSuperAdmin) return reply.status(403).send({ detail: 'Only super admins can reset progress' });
  
  const { userId } = request.params;
  
  await db.collection('users').updateOne(
    { id: userId },
    { $set: { level: 1, xp: 0, totalXp: 0, currentStreak: 0, disciplineScore: 50 } }
  );
  
  await db.collection('tasks').deleteMany({ userId });
  await db.collection('skill_trees').deleteMany({ userId });
  await db.collection('achievements').deleteMany({ userId });
  await db.collection('exams').deleteMany({ userId });
  
  return { success: true, message: 'User progress reset' };
});

fastify.get('/api/system/analytics/export', { preHandler: [fastify.authenticate] }, async (request) => {
  const format = request.query.format || 'json';
  const users = await db.collection('users').find({}, { projection: { _id: 0, hashedPassword: 0 } }).toArray();
  
  if (format === 'json') {
    return { users, total: users.length };
  }
  
  // CSV format
  let csv = 'Username,Email,Level,Total XP,Streak,Discipline\n';
  users.forEach(u => {
    csv += `${u.username},${u.email},${u.level},${u.totalXp},${u.currentStreak},${u.disciplineScore}\n`;
  });
  
  return { csv };
});

// Initialize super admin if not exists
const initSuperAdmin = async () => {
  const existing = await db.collection('admins').findOne({ username: 'Rebadion' });
  if (!existing) {
    await db.collection('admins').insertOne({
      id: uuidv4(),
      username: 'Rebadion',
      hashedPassword: await hashPassword('Rebadion2010'),
      isSuperAdmin: true,
      createdAt: new Date().toISOString()
    });
    console.log('Super admin created: Rebadion');
  }
};

// Start server
const start = async () => {
  try {
    await connectDB();
    await initSuperAdmin();
    await fastify.listen({ port: 8001, host: '0.0.0.0' });
    console.log('Server running on http://0.0.0.0:8001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
