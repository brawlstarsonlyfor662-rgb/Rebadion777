from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime, timezone
import uuid

# User Models
class UserBase(BaseModel):
    email: str
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    level: int = 1
    xp: int = 0
    total_xp: int = 0
    discipline_score: int = 50
    current_streak: int = 0
    longest_streak: int = 0
    last_active: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Task Models
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    skill_tree: str  # Mind, Knowledge, Discipline, Fitness
    difficulty: int = 1  # 1-5
    estimated_minutes: int = 10

class Task(TaskCreate):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    completed: bool = False
    xp_reward: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

# Skill Tree Models
class SkillTreeProgress(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    skill_tree: str  # Mind, Knowledge, Discipline, Fitness
    level: int = 1
    xp: int = 0
    total_xp: int = 0
    unlocked_abilities: List[str] = []

# Achievement Models
class Achievement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    achievement_id: str
    title: str
    description: str
    icon: str
    unlocked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Focus Session Models
class FocusSessionCreate(BaseModel):
    task_id: Optional[str] = None
    mode: str = "normal"  # normal, emergency, boss_challenge

class FocusSession(FocusSessionCreate):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    start_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    duration_minutes: int = 0
    successful: bool = False

# AI Coach Models
class ChatMessage(BaseModel):
    role: str  # user or assistant
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CoachChatRequest(BaseModel):
    message: str
    mode: str = "motivational"  # strict, strategic, analytical, motivational

class CoachChatResponse(BaseModel):
    response: str
    mode: str

# Analytics Models
class AnalyticsData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    date: str
    tasks_completed: int = 0
    focus_minutes: int = 0
    xp_earned: int = 0
    discipline_score: int = 50
    dopamine_level: int = 50  # 0-100

# Boss Challenge Models
class BossChallenge(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: str
    challenge_text: str
    difficulty: int
    xp_reward: int
    completed: bool = False
    completed_at: Optional[datetime] = None