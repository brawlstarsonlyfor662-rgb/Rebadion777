from datetime import datetime, timezone, timedelta
from typing import List, Dict
import random

# XP calculation
def calculate_xp_reward(difficulty: int, estimated_minutes: int, streak_multiplier: float = 1.0) -> int:
    """Calculate XP based on difficulty and time"""
    base_xp = difficulty * 20  # 20-100 XP base
    time_bonus = estimated_minutes * 2  # 2 XP per minute
    total = int((base_xp + time_bonus) * streak_multiplier)
    return total

def calculate_level_from_xp(total_xp: int) -> int:
    """Calculate level from total XP (exponential growth up to level 1000)"""
    # Level formula: level = sqrt(total_xp / 100) + 1
    import math
    level = int(math.sqrt(total_xp / 100)) + 1
    return max(1, min(1000, level))  # Cap at 1000

def xp_for_next_level(current_level: int) -> int:
    """XP needed to reach next level"""
    if current_level >= 1000:
        return 0  # Max level reached
    return (current_level ** 2) * 100

# Streak calculation
def calculate_streak(last_active: datetime, current_streak: int) -> tuple:
    """Calculate if streak should continue or reset"""
    now = datetime.now(timezone.utc)
    diff = now - last_active
    
    # If last active was today or yesterday, continue streak
    if diff.total_seconds() < 86400:  # Less than 24 hours
        return current_streak, 1.0
    elif diff.total_seconds() < 172800:  # Less than 48 hours
        new_streak = current_streak + 1
        multiplier = 1.0 + (new_streak * 0.1)  # +10% per streak day
        return new_streak, min(multiplier, 3.0)  # Max 3x multiplier
    else:
        return 0, 1.0  # Reset streak

# Achievement definitions
ACHIEVEMENTS = {
    "first_task": {
        "title": "First Steps",
        "description": "Complete your first task",
        "icon": "🎯",
        "check": lambda stats: stats["tasks_completed"] >= 1
    },
    "speed_demon": {
        "title": "Speed Demon",
        "description": "Complete 5 tasks in one day",
        "icon": "⚡",
        "check": lambda stats: stats["tasks_today"] >= 5
    },
    "week_warrior": {
        "title": "Week Warrior",
        "description": "Maintain a 7-day streak",
        "icon": "🔥",
        "check": lambda stats: stats["current_streak"] >= 7
    },
    "level_10": {
        "title": "Rising Star",
        "description": "Reach level 10",
        "icon": "⭐",
        "check": lambda stats: stats["level"] >= 10
    },
    "focus_master": {
        "title": "Focus Master",
        "description": "Complete 100 focus sessions",
        "icon": "🧠",
        "check": lambda stats: stats["total_focus_sessions"] >= 100
    },
    "discipline_god": {
        "title": "Discipline God",
        "description": "Reach 90+ discipline score",
        "icon": "👑",
        "check": lambda stats: stats["discipline_score"] >= 90
    }
}

def check_achievements(user_stats: Dict) -> List[str]:
    """Check which achievements have been unlocked"""
    unlocked = []
    for achievement_id, achievement in ACHIEVEMENTS.items():
        if achievement["check"](user_stats):
            unlocked.append(achievement_id)
    return unlocked

# Daily Boss Challenge Generator
def generate_boss_challenge(user_level: int) -> Dict:
    """Generate a daily boss challenge based on user level"""
    challenges = [
        "Complete 5 high-difficulty tasks",
        "Study for 2 hours without breaks",
        "Complete all tasks in your weakest skill tree",
        "Achieve a perfect focus session (no distractions)",
        "Complete tasks worth 500+ XP today"
    ]
    
    difficulty = min(5, max(1, user_level // 5 + 1))
    xp_reward = difficulty * 100 + user_level * 10
    
    return {
        "challenge_text": random.choice(challenges),
        "difficulty": difficulty,
        "xp_reward": xp_reward
    }

# Discipline Score calculation
def calculate_discipline_score(completed_tasks: int, missed_tasks: int, streak: int, focus_time: int) -> int:
    """Calculate discipline score (0-100)"""
    base_score = 50
    
    # Task completion rate
    if completed_tasks + missed_tasks > 0:
        completion_rate = completed_tasks / (completed_tasks + missed_tasks)
        base_score += int((completion_rate - 0.5) * 40)  # ±20 points
    
    # Streak bonus
    streak_bonus = min(20, streak * 2)
    
    # Focus time bonus
    focus_bonus = min(10, focus_time // 30)  # 1 point per 30 min
    
    final_score = base_score + streak_bonus + focus_bonus
    return max(0, min(100, final_score))