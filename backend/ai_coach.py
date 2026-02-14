from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv
import os
from typing import Dict

load_dotenv()

# Coach personality system messages
COACH_MODES = {
    "strict": "You are a strict military-style discipline coach. Be tough, direct, and push the user to their limits. Use short, commanding sentences. No excuses accepted. Example: 'Stop wasting time. Get it done NOW. Your excuses are irrelevant.'",
    
    "strategic": "You are a calm, strategic planner and productivity expert. Analyze the situation logically and provide structured, actionable advice. Be methodical and clear. Example: 'Let's break this down: First, prioritize your tasks. Second, eliminate distractions. Third, execute with focus.'",
    
    "analytical": "You are a data-driven performance analyst. Use stats, patterns, and metrics to provide insights. Be precise and evidence-based. Example: 'Your completion rate dropped 15% this week. Pattern analysis shows procrastination peaks at 3 PM. Adjust your schedule accordingly.'",
    
    "motivational": "You are an energetic, supportive motivational coach. Inspire and energize the user with positivity and encouragement. Be enthusiastic and uplifting. Example: 'You're doing AMAZING! Look at that streak! You're building unstoppable momentum. Keep crushing it!'"
}

class AICoach:
    def __init__(self):
        self.api_key = os.getenv('EMERGENT_LLM_KEY')
        
    async def get_response(self, user_message: str, mode: str, user_context: Dict = None) -> str:
        """Get AI coach response based on mode"""
        try:
            # Build system message with context
            system_message = COACH_MODES.get(mode, COACH_MODES["motivational"])
            
            if user_context:
                context_info = f"\n\nUser Context: Level {user_context.get('level', 1)}, "
                context_info += f"Streak: {user_context.get('streak', 0)} days, "
                context_info += f"Discipline Score: {user_context.get('discipline_score', 50)}/100, "
                context_info += f"Tasks Today: {user_context.get('tasks_today', 0)}"
                system_message += context_info
            
            # Initialize chat
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"coach_{mode}",
                system_message=system_message
            ).with_model("openai", "gpt-5.2")
            
            # Send message
            message = UserMessage(text=user_message)
            response = await chat.send_message(message)
            
            return response
            
        except Exception as e:
            return f"Coach system error: {str(e)}"

# Burnout detection
def detect_burnout_risk(focus_sessions: list, tasks_completed: list) -> Dict:
    """Analyze patterns to detect burnout risk"""
    if len(focus_sessions) < 7:
        return {"risk_level": "low", "message": "Not enough data yet"}
    
    recent_sessions = focus_sessions[-7:]
    avg_duration = sum(s.get('duration_minutes', 0) for s in recent_sessions) / 7
    success_rate = sum(1 for s in recent_sessions if s.get('successful', False)) / 7
    
    risk_level = "low"
    message = "You're doing great!"
    
    if avg_duration > 360:  # Over 6 hours/day
        risk_level = "high"
        message = "Warning: Overworking detected. Take breaks to avoid burnout."
    elif success_rate < 0.5:
        risk_level = "medium"
        message = "Your focus success rate is dropping. Consider shorter sessions."
    
    return {"risk_level": risk_level, "message": message}

# Optimal study time suggestion
def suggest_optimal_time(focus_sessions: list) -> str:
    """Analyze when user is most productive"""
    if len(focus_sessions) < 10:
        return "Try studying in the morning for better focus."
    
    hour_performance = {}
    for session in focus_sessions:
        if 'start_time' in session and session.get('successful'):
            hour = session['start_time'].hour
            hour_performance[hour] = hour_performance.get(hour, 0) + 1
    
    if not hour_performance:
        return "Complete more sessions to get personalized recommendations."
    
    best_hour = max(hour_performance, key=hour_performance.get)
    
    if best_hour < 12:
        return f"Your peak performance is at {best_hour}:00. Morning power!"
    elif best_hour < 17:
        return f"You focus best at {best_hour}:00. Afternoon warrior!"
    else:
        return f"You're most productive at {best_hour}:00. Night owl mode!"