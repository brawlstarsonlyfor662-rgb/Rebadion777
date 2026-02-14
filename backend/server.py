from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from models import (
    User, UserCreate, UserLogin, Token, Task, TaskCreate,
    SkillTreeProgress, Achievement, FocusSession, FocusSessionCreate,
    FocusSessionEnd, ChatMessage, CoachChatRequest, CoachChatResponse,
    AnalyticsData, BossChallenge, Admin, AdminCreate, AdminLogin,
    AdminToken, AdminCreateRequest
)
from auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, security
)
from gamification import (
    calculate_xp_reward, calculate_level_from_xp, xp_for_next_level,
    calculate_streak, check_achievements, ACHIEVEMENTS,
    generate_boss_challenge, calculate_discipline_score
)
from ai_coach import AICoach, detect_burnout_risk, suggest_optimal_time

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Initialize AI Coach
ai_coach = AICoach()

# Dependency for getting DB in protected routes
async def get_db():
    return db

# Auth Routes
@api_router.post("/auth/signup", response_model=Token)
async def signup(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        username=user_data.username
    )
    
    # Hash password and store
    user_dict = user.model_dump()
    user_dict['hashed_password'] = get_password_hash(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['last_active'] = user_dict['last_active'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Initialize skill trees
    for skill in ["Mind", "Knowledge", "Discipline", "Fitness"]:
        skill_tree = SkillTreeProgress(user_id=user.id, skill_tree=skill)
        await db.skill_trees.insert_one(skill_tree.model_dump())
    
    # Create token
    access_token = create_access_token({"user_id": user.id})
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin):
    user_data = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(login_data.password, user_data['hashed_password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Convert timestamps
    if isinstance(user_data.get('created_at'), str):
        user_data['created_at'] = datetime.fromisoformat(user_data['created_at'])
    if isinstance(user_data.get('last_active'), str):
        user_data['last_active'] = datetime.fromisoformat(user_data['last_active'])
    
    user = User(**{k: v for k, v in user_data.items() if k != 'hashed_password'})
    access_token = create_access_token({"user_id": user.id})
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return await get_current_user(credentials, db)

# Task Routes
@api_router.post("/tasks", response_model=Task)
async def create_task(
    task_data: TaskCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user = await get_current_user(credentials, db)
    
    # Calculate XP reward
    xp_reward = calculate_xp_reward(
        task_data.difficulty,
        task_data.estimated_minutes,
        1.0 + (user.current_streak * 0.1)
    )
    
    task = Task(**task_data.model_dump(), user_id=user.id, xp_reward=xp_reward)
    task_dict = task.model_dump()
    task_dict['created_at'] = task_dict['created_at'].isoformat()
    
    await db.tasks.insert_one(task_dict)
    return task

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    completed: Optional[bool] = None
):
    user = await get_current_user(credentials, db)
    query = {"user_id": user.id}
    if completed is not None:
        query["completed"] = completed
    
    tasks = await db.tasks.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for task in tasks:
        if isinstance(task.get('created_at'), str):
            task['created_at'] = datetime.fromisoformat(task['created_at'])
        if task.get('completed_at') and isinstance(task['completed_at'], str):
            task['completed_at'] = datetime.fromisoformat(task['completed_at'])
    
    return tasks

@api_router.patch("/tasks/{task_id}/complete", response_model=dict)
async def complete_task(
    task_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user = await get_current_user(credentials, db)
    
    task = await db.tasks.find_one({"id": task_id, "user_id": user.id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task['completed']:
        raise HTTPException(status_code=400, detail="Task already completed")
    
    # Update task
    await db.tasks.update_one(
        {"id": task_id},
        {"$set": {"completed": True, "completed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Update user XP and level
    xp_gained = task['xp_reward']
    new_total_xp = user.total_xp + xp_gained
    new_level = calculate_level_from_xp(new_total_xp)
    
    # Update streak
    new_streak, multiplier = calculate_streak(user.last_active, user.current_streak)
    longest_streak = max(new_streak, user.longest_streak)
    
    await db.users.update_one(
        {"id": user.id},
        {"$set": {
            "total_xp": new_total_xp,
            "xp": new_total_xp % xp_for_next_level(new_level),
            "level": new_level,
            "current_streak": new_streak,
            "longest_streak": longest_streak,
            "last_active": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update skill tree
    await db.skill_trees.update_one(
        {"user_id": user.id, "skill_tree": task['skill_tree']},
        {"$inc": {"xp": xp_gained, "total_xp": xp_gained}}
    )
    
    # Check for level up in skill tree
    skill_tree = await db.skill_trees.find_one(
        {"user_id": user.id, "skill_tree": task['skill_tree']},
        {"_id": 0}
    )
    if skill_tree:
        skill_level = calculate_level_from_xp(skill_tree['total_xp'])
        await db.skill_trees.update_one(
            {"user_id": user.id, "skill_tree": task['skill_tree']},
            {"$set": {"level": skill_level}}
        )
    
    return {
        "success": True,
        "xp_gained": xp_gained,
        "new_level": new_level,
        "level_up": new_level > user.level
    }

@api_router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user = await get_current_user(credentials, db)
    result = await db.tasks.delete_one({"id": task_id, "user_id": user.id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"success": True}

# Skill Tree Routes
@api_router.get("/skill-trees", response_model=List[SkillTreeProgress])
async def get_skill_trees(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials, db)
    skill_trees = await db.skill_trees.find({"user_id": user.id}, {"_id": 0}).to_list(10)
    return skill_trees

# Achievement Routes
@api_router.get("/achievements", response_model=List[Achievement])
async def get_achievements(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials, db)
    achievements = await db.achievements.find({"user_id": user.id}, {"_id": 0}).to_list(1000)
    
    for ach in achievements:
        if isinstance(ach.get('unlocked_at'), str):
            ach['unlocked_at'] = datetime.fromisoformat(ach['unlocked_at'])
    
    return achievements

@api_router.get("/achievements/available")
async def get_available_achievements(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials, db)
    
    # Get user stats
    tasks_completed = await db.tasks.count_documents({"user_id": user.id, "completed": True})
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    tasks_today = await db.tasks.count_documents({
        "user_id": user.id,
        "completed": True,
        "completed_at": {"$regex": today}
    })
    focus_sessions = await db.focus_sessions.count_documents({"user_id": user.id})
    
    user_stats = {
        "tasks_completed": tasks_completed,
        "tasks_today": tasks_today,
        "current_streak": user.current_streak,
        "level": user.level,
        "total_focus_sessions": focus_sessions,
        "discipline_score": user.discipline_score
    }
    
    # Check which achievements are unlocked
    unlocked_ids = check_achievements(user_stats)
    
    # Get already unlocked achievements
    existing = await db.achievements.find({"user_id": user.id}, {"_id": 0, "achievement_id": 1}).to_list(1000)
    existing_ids = [a['achievement_id'] for a in existing]
    
    # Add new achievements
    new_achievements = []
    for ach_id in unlocked_ids:
        if ach_id not in existing_ids:
            achievement = Achievement(
                user_id=user.id,
                achievement_id=ach_id,
                title=ACHIEVEMENTS[ach_id]['title'],
                description=ACHIEVEMENTS[ach_id]['description'],
                icon=ACHIEVEMENTS[ach_id]['icon']
            )
            ach_dict = achievement.model_dump()
            ach_dict['unlocked_at'] = ach_dict['unlocked_at'].isoformat()
            await db.achievements.insert_one(ach_dict)
            new_achievements.append(achievement)
    
    # Return all achievements with locked status
    all_achievements = []
    for ach_id, ach_data in ACHIEVEMENTS.items():
        all_achievements.append({
            "achievement_id": ach_id,
            "title": ach_data['title'],
            "description": ach_data['description'],
            "icon": ach_data['icon'],
            "unlocked": ach_id in unlocked_ids or ach_id in existing_ids
        })
    
    return {"achievements": all_achievements, "new_unlocks": new_achievements}

# Focus Session Routes
@api_router.post("/focus-sessions", response_model=FocusSession)
async def start_focus_session(
    session_data: FocusSessionCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user = await get_current_user(credentials, db)
    
    session = FocusSession(**session_data.model_dump(), user_id=user.id)
    session_dict = session.model_dump()
    session_dict['start_time'] = session_dict['start_time'].isoformat()
    
    await db.focus_sessions.insert_one(session_dict)
    return session

@api_router.patch("/focus-sessions/{session_id}/end")
async def end_focus_session(
    session_id: str,
    data: FocusSessionEnd,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user = await get_current_user(credentials, db)
    
    await db.focus_sessions.update_one(
        {"id": session_id, "user_id": user.id},
        {"$set": {
            "end_time": datetime.now(timezone.utc).isoformat(),
            "duration_minutes": data.duration_minutes,
            "successful": data.successful
        }}
    )
    
    return {"success": True}

@api_router.get("/focus-sessions")
async def get_focus_sessions(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials, db)
    sessions = await db.focus_sessions.find({"user_id": user.id}, {"_id": 0}).sort("start_time", -1).to_list(1000)
    
    for session in sessions:
        if isinstance(session.get('start_time'), str):
            session['start_time'] = datetime.fromisoformat(session['start_time'])
        if session.get('end_time') and isinstance(session['end_time'], str):
            session['end_time'] = datetime.fromisoformat(session['end_time'])
    
    return sessions

# AI Coach Routes
@api_router.post("/ai-coach/chat", response_model=CoachChatResponse)
async def chat_with_coach(
    request: CoachChatRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user = await get_current_user(credentials, db)
    
    # Get user context
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    tasks_today = await db.tasks.count_documents({
        "user_id": user.id,
        "completed": True,
        "completed_at": {"$regex": today}
    })
    
    user_context = {
        "level": user.level,
        "streak": user.current_streak,
        "discipline_score": user.discipline_score,
        "tasks_today": tasks_today
    }
    
    # Get AI response
    response = await ai_coach.get_response(request.message, request.mode, user_context)
    
    # Save chat history
    chat_entry = {
        "user_id": user.id,
        "mode": request.mode,
        "user_message": request.message,
        "assistant_message": response,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_history.insert_one(chat_entry)
    
    return CoachChatResponse(response=response, mode=request.mode)

# Analytics Routes
@api_router.get("/analytics/dashboard")
async def get_analytics(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials, db)
    
    # Get last 30 days of data
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    # Tasks completed over time
    tasks = await db.tasks.find({
        "user_id": user.id,
        "completed": True
    }, {"_id": 0}).to_list(1000)
    
    # Focus sessions
    focus_sessions = await db.focus_sessions.find(
        {"user_id": user.id},
        {"_id": 0}
    ).to_list(1000)
    
    # Calculate stats
    total_tasks = len(tasks)
    total_focus_time = sum(s.get('duration_minutes', 0) for s in focus_sessions)
    
    # Burnout detection
    burnout_data = detect_burnout_risk(focus_sessions, tasks)
    
    # Optimal time suggestion
    optimal_time = suggest_optimal_time(focus_sessions)
    
    # Weekly data for graph
    weekly_data = []
    for i in range(7):
        date = (datetime.now(timezone.utc) - timedelta(days=6-i)).strftime("%Y-%m-%d")
        day_tasks = sum(1 for t in tasks if t.get('completed_at', '').startswith(date))
        day_focus = sum(s.get('duration_minutes', 0) for s in focus_sessions if str(s.get('start_time', '')).startswith(date))
        
        weekly_data.append({
            "date": date,
            "tasks": day_tasks,
            "focus_minutes": day_focus
        })
    
    return {
        "total_tasks": total_tasks,
        "total_focus_time": total_focus_time,
        "current_level": user.level,
        "current_xp": user.xp,
        "next_level_xp": xp_for_next_level(user.level),
        "discipline_score": user.discipline_score,
        "current_streak": user.current_streak,
        "longest_streak": user.longest_streak,
        "burnout_risk": burnout_data,
        "optimal_time": optimal_time,
        "weekly_data": weekly_data
    }

# Boss Challenge Routes
@api_router.get("/boss-challenge/today")
async def get_daily_boss(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials, db)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Check if boss exists for today
    existing = await db.boss_challenges.find_one({"user_id": user.id, "date": today}, {"_id": 0})
    if existing:
        return existing
    
    # Generate new boss
    boss_data = generate_boss_challenge(user.level)
    boss = BossChallenge(
        user_id=user.id,
        date=today,
        **boss_data
    )
    
    await db.boss_challenges.insert_one(boss.model_dump())
    return boss

@api_router.patch("/boss-challenge/{challenge_id}/complete")
async def complete_boss(
    challenge_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user = await get_current_user(credentials, db)
    
    challenge = await db.boss_challenges.find_one({"id": challenge_id, "user_id": user.id}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    if challenge['completed']:
        raise HTTPException(status_code=400, detail="Already completed")
    
    # Mark complete
    await db.boss_challenges.update_one(
        {"id": challenge_id},
        {"$set": {"completed": True, "completed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Award XP
    xp_gained = challenge['xp_reward']
    new_total_xp = user.total_xp + xp_gained
    new_level = calculate_level_from_xp(new_total_xp)
    
    await db.users.update_one(
        {"id": user.id},
        {"$set": {
            "total_xp": new_total_xp,
            "xp": new_total_xp % xp_for_next_level(new_level),
            "level": new_level
        }}
    )
    
    return {"success": True, "xp_gained": xp_gained, "level_up": new_level > user.level}

# ============= ADMIN ROUTES (Hidden) =============
# Helper function for admin auth
async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Admin:
    token = credentials.credentials
    from auth import decode_token
    payload = decode_token(token)
    admin_id = payload.get("admin_id")
    if admin_id is None:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    admin_data = await db.admins.find_one({"id": admin_id}, {"_id": 0})
    if not admin_data:
        raise HTTPException(status_code=401, detail="Admin not found")
    
    if isinstance(admin_data.get('created_at'), str):
        admin_data['created_at'] = datetime.fromisoformat(admin_data['created_at'])
    
    return Admin(**admin_data)

@api_router.post("/system/access", response_model=AdminToken)
async def admin_login(login_data: AdminLogin):
    """Hidden admin login endpoint"""
    admin_data = await db.admins.find_one({"username": login_data.username}, {"_id": 0})
    if not admin_data:
        raise HTTPException(status_code=401, detail="Access denied")
    
    if not verify_password(login_data.password, admin_data['hashed_password']):
        raise HTTPException(status_code=401, detail="Access denied")
    
    if isinstance(admin_data.get('created_at'), str):
        admin_data['created_at'] = datetime.fromisoformat(admin_data['created_at'])
    
    admin = Admin(**{k: v for k, v in admin_data.items() if k != 'hashed_password'})
    access_token = create_access_token({"admin_id": admin.id})
    
    return AdminToken(access_token=access_token, token_type="bearer", admin=admin)

@api_router.get("/system/status")
async def admin_dashboard(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Admin dashboard data"""
    admin = await get_current_admin(credentials)
    
    # Get system stats
    total_users = await db.users.count_documents({})
    total_tasks = await db.tasks.count_documents({})
    completed_tasks = await db.tasks.count_documents({"completed": True})
    total_focus_time = await db.focus_sessions.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$duration_minutes"}}}
    ]).to_list(1)
    
    # Get users list with stats
    users = await db.users.find({}, {"_id": 0, "hashed_password": 0}).sort("created_at", -1).to_list(100)
    
    # Recent activity
    recent_tasks = await db.tasks.find(
        {"completed": True},
        {"_id": 0}
    ).sort("completed_at", -1).limit(20).to_list(20)
    
    # Active users (last 24 hours)
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    active_users = await db.users.count_documents({
        "last_active": {"$gte": yesterday}
    })
    
    return {
        "total_users": total_users,
        "active_users_24h": active_users,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "total_focus_minutes": total_focus_time[0]['total'] if total_focus_time else 0,
        "users": users,
        "recent_activity": recent_tasks,
        "admin": {"username": admin.username, "is_super_admin": admin.is_super_admin}
    }

@api_router.post("/system/admin/create")
async def create_new_admin(
    data: AdminCreateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Create a new admin (only super admins can do this)"""
    admin = await get_current_admin(credentials)
    
    if not admin.is_super_admin:
        raise HTTPException(status_code=403, detail="Only super admins can create new admins")
    
    # Check if admin already exists
    existing = await db.admins.find_one({"username": data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Admin username already exists")
    
    # Create new admin
    new_admin = Admin(
        username=data.username,
        created_by=admin.id,
        is_super_admin=False
    )
    
    admin_dict = new_admin.model_dump()
    admin_dict['hashed_password'] = get_password_hash(data.password)
    admin_dict['created_at'] = admin_dict['created_at'].isoformat()
    
    await db.admins.insert_one(admin_dict)
    
    return {"success": True, "message": f"Admin {data.username} created"}

@api_router.get("/system/admins")
async def list_admins(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """List all admins"""
    admin = await get_current_admin(credentials)
    
    admins = await db.admins.find({}, {"_id": 0, "hashed_password": 0}).to_list(100)
    return {"admins": admins}

@api_router.delete("/system/users/{user_id}")
async def delete_user(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Delete a user (admin only)"""
    admin = await get_current_admin(credentials)
    
    # Delete user and all related data
    await db.users.delete_one({"id": user_id})
    await db.tasks.delete_many({"user_id": user_id})
    await db.skill_trees.delete_many({"user_id": user_id})
    await db.achievements.delete_many({"user_id": user_id})
    await db.focus_sessions.delete_many({"user_id": user_id})
    await db.boss_challenges.delete_many({"user_id": user_id})
    
    return {"success": True, "message": "User deleted"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()