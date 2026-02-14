# Level Up - Dopamine-Optimized Productivity System

## Original Problem Statement
Build a dopamine-optimized AI productivity and performance system for students and high achievers. The goal is to create a digital system that rewires procrastination, increases focus, builds discipline, and makes self-improvement addictive in a healthy way.

## Target Users
- Students preparing for exams
- High achievers seeking structured productivity
- Anyone wanting to gamify their learning and self-improvement

## Core Features (Implemented)

### 1. Dopamine-Engineered Task System
- Micro-tasks (2-10 min) with instant XP rewards
- 4 Skill Trees: Mind, Knowledge, Discipline, Fitness
- Level system (1-1000) with exponential XP curve
- Streak system with 10% multiplier per day (up to 3x)
- 6 Achievements with unlock conditions

### 2. AI-Powered Features
- AI Coach with 4 personality modes (Strict, Strategic, Analytical, Motivational)
- AI Study Assistant with 8 subjects
- Boss Challenge with AI-generated multiple-choice exams
- Grading system: A* (95%+), A (85%+), B (70%+), C (50%+), D (40%+), F (<40%)
- XP penalties and extra quests for failing exams

### 3. Focus Mode
- Timer with Normal, Emergency, and Boss Mode options
- Session tracking and logging

### 4. Analytics Dashboard
- Weekly performance charts
- Burnout risk detection
- Optimal study time suggestions
- Discipline score tracking

### 5. Quest System
- Daily quests (3-5 per day)
- Weekly quests (4 epic challenges)
- XP rewards for completion

### 6. Hidden Admin Panel
- Access at `/system-control`
- Super admin credentials: Rebadion / Rebadion2010
- User management (view, delete, award XP)
- System statistics dashboard

## Technical Stack
- **Frontend:** React, Tailwind CSS, Framer Motion, Recharts
- **Backend:** Fastify (Node.js), MongoDB
- **AI:** OpenAI GPT-5.2 via Emergent LLM Key
- **Auth:** JWT tokens with bcryptjs password hashing

## Key API Endpoints
- `/api/auth/signup`, `/api/auth/login`, `/api/auth/me`
- `/api/tasks` (CRUD)
- `/api/boss-challenge/today`, `/api/boss-challenge/{id}/generate-exam`
- `/api/quests/daily`, `/api/quests/weekly`
- `/api/ai-coach/chat`
- `/api/analytics/dashboard`
- `/api/system/access` (Admin login)

## What's Been Implemented (Feb 2026)
- [x] Full authentication system
- [x] Gamified dashboard with XP/Level display
- [x] Task creation and completion with XP rewards
- [x] XP and Level Up animations
- [x] 4 Skill Trees with progress tracking
- [x] 6 Achievements with unlock system
- [x] Boss Challenge with AI exams
- [x] Grading system with XP multipliers/penalties
- [x] Daily and Weekly quests
- [x] AI Coach with 4 modes
- [x] AI Study Assistant (8 subjects)
- [x] Focus Mode timer
- [x] Analytics with charts
- [x] Hidden Admin Panel
- [x] Cyberpunk/anime-themed UI

## Known Mocked Features
- YouTube Learning API returns placeholder video links (needs Google API key)
- Email on incorrect login not implemented (needs email service integration)

## Prioritized Backlog

### P0 (Critical - Next)
- None (core features complete)

### P1 (High Priority)
- Language Learning Center page
- Email on incorrect login (Resend/SendGrid integration)
- Real YouTube API integration

### P2 (Medium Priority)
- AI Adaptive Brain Engine (pattern detection, burnout prediction)
- Anti-Procrastination Mode (distraction blockers)
- AI Coach personality modes fine-tuning

### P3 (Nice to Have)
- Refactor server.py into modular routers
- Mobile app version
- Social features (leaderboards, challenges)

## Architecture Notes
- Backend is monolithic in `server.py` (1000+ lines) - needs refactoring
- Frontend uses component-based architecture with shared Layout
- All pages have data-testid attributes for testing
- MongoDB collections: users, tasks, skill_trees, achievements, focus_sessions, boss_challenges, exams, daily_quests, weekly_quests, admins
