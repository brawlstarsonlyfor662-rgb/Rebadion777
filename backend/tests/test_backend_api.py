"""
Backend API Tests for Level Up / Quest Rush - Dopamine Productivity System
Tests: Auth, Tasks, Boss Challenge, Quests, AI Coach, Admin Panel
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPublicEndpoints:
    """Test public endpoints (no auth required)"""
    
    def test_public_stats(self):
        """Test landing page stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/public/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "completed_tasks" in data
        assert "success_rate" in data
        print(f"Public stats: {data}")


class TestAuthFlow:
    """Test authentication flow - signup and login"""
    test_email = f"test_{uuid.uuid4().hex[:8]}@test.com"
    test_password = "TestPass123!"
    test_username = f"TestUser_{uuid.uuid4().hex[:4]}"
    access_token = None
    user_id = None
    
    def test_signup(self):
        """Test user signup"""
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": self.test_email,
            "password": self.test_password,
            "username": self.test_username
        })
        assert response.status_code == 200, f"Signup failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == self.test_email
        assert data["user"]["username"] == self.test_username
        TestAuthFlow.access_token = data["access_token"]
        TestAuthFlow.user_id = data["user"]["id"]
        print(f"Signup successful for {self.test_email}")
    
    def test_duplicate_signup(self):
        """Test duplicate signup rejection"""
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": self.test_email,
            "password": self.test_password,
            "username": self.test_username
        })
        assert response.status_code == 400
        print("Duplicate signup correctly rejected")
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == self.test_email
        TestAuthFlow.access_token = data["access_token"]
        print("Login successful")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.test_email,
            "password": "WrongPassword123"
        })
        assert response.status_code == 401
        print("Invalid credentials correctly rejected")
    
    def test_get_current_user(self):
        """Test getting current user info"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == self.test_email
        print(f"Current user: {data['username']}, Level: {data['level']}")


class TestTasksCRUD:
    """Test Task CRUD operations"""
    task_id = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Ensure we have a valid token"""
        if not TestAuthFlow.access_token:
            pytest.skip("No auth token available")
    
    def test_create_task(self):
        """Test task creation"""
        response = requests.post(
            f"{BASE_URL}/api/tasks",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"},
            json={
                "title": "TEST_Study Python",
                "description": "Complete Python tutorial chapter 1",
                "skill_tree": "Knowledge",
                "difficulty": 3,
                "estimated_minutes": 30
            }
        )
        assert response.status_code == 200, f"Task creation failed: {response.text}"
        data = response.json()
        assert data["title"] == "TEST_Study Python"
        assert data["skill_tree"] == "Knowledge"
        assert data["difficulty"] == 3
        assert data["xp_reward"] > 0
        TestTasksCRUD.task_id = data["id"]
        print(f"Task created with XP reward: {data['xp_reward']}")
    
    def test_get_tasks(self):
        """Test getting all tasks"""
        response = requests.get(
            f"{BASE_URL}/api/tasks",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Retrieved {len(data)} tasks")
    
    def test_get_incomplete_tasks(self):
        """Test filtering incomplete tasks"""
        response = requests.get(
            f"{BASE_URL}/api/tasks?completed=false",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        for task in data:
            assert task["completed"] == False
        print(f"Retrieved {len(data)} incomplete tasks")
    
    def test_complete_task(self):
        """Test task completion with XP reward"""
        if not TestTasksCRUD.task_id:
            pytest.skip("No task ID available")
        
        response = requests.patch(
            f"{BASE_URL}/api/tasks/{TestTasksCRUD.task_id}/complete",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"}
        )
        assert response.status_code == 200, f"Task completion failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        assert data["xp_gained"] > 0
        print(f"Task completed! XP gained: {data['xp_gained']}, Level up: {data['level_up']}")
    
    def test_complete_task_again(self):
        """Test completing already completed task (should fail)"""
        if not TestTasksCRUD.task_id:
            pytest.skip("No task ID available")
        
        response = requests.patch(
            f"{BASE_URL}/api/tasks/{TestTasksCRUD.task_id}/complete",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"}
        )
        assert response.status_code == 400
        print("Double completion correctly rejected")
    
    def test_delete_task(self):
        """Test task deletion"""
        # Create a new task to delete
        create_response = requests.post(
            f"{BASE_URL}/api/tasks",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"},
            json={
                "title": "TEST_Task_To_Delete",
                "skill_tree": "Mind",
                "difficulty": 1,
                "estimated_minutes": 5
            }
        )
        assert create_response.status_code == 200
        delete_task_id = create_response.json()["id"]
        
        # Delete the task
        response = requests.delete(
            f"{BASE_URL}/api/tasks/{delete_task_id}",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"}
        )
        assert response.status_code == 200
        print("Task deleted successfully")


class TestBossChallenge:
    """Test Boss Challenge system"""
    challenge_id = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        if not TestAuthFlow.access_token:
            pytest.skip("No auth token available")
    
    def test_get_daily_boss(self):
        """Test getting daily boss challenge"""
        response = requests.get(
            f"{BASE_URL}/api/boss-challenge/today",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"}
        )
        assert response.status_code == 200, f"Boss challenge failed: {response.text}"
        data = response.json()
        assert "challenge_text" in data
        assert "difficulty" in data
        assert "xp_reward" in data
        TestBossChallenge.challenge_id = data["id"]
        print(f"Boss challenge: {data['challenge_text']} (Difficulty: {data['difficulty']})")
    
    def test_generate_exam(self):
        """Test AI exam generation for boss challenge"""
        if not TestBossChallenge.challenge_id:
            pytest.skip("No challenge ID available")
        
        response = requests.get(
            f"{BASE_URL}/api/boss-challenge/{TestBossChallenge.challenge_id}/generate-exam",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"},
            timeout=30  # AI generation may take time
        )
        assert response.status_code == 200, f"Exam generation failed: {response.text}"
        data = response.json()
        assert "exam_id" in data
        assert "questions" in data
        print(f"Exam generated with ID: {data['exam_id']}")
        return data["exam_id"]


class TestQuestsSystems:
    """Test Daily and Weekly Quests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        if not TestAuthFlow.access_token:
            pytest.skip("No auth token available")
    
    def test_get_daily_quests(self):
        """Test daily quests retrieval"""
        response = requests.get(
            f"{BASE_URL}/api/quests/daily",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"}
        )
        assert response.status_code == 200, f"Daily quests failed: {response.text}"
        data = response.json()
        assert "quests" in data
        assert "date" in data
        quests = data["quests"]
        assert len(quests) >= 3  # At least 3 base quests
        for quest in quests:
            assert "title" in quest
            assert "xp_reward" in quest
            assert "target" in quest
        print(f"Daily quests ({data['date']}): {len(quests)} quests")
    
    def test_get_weekly_quests(self):
        """Test weekly quests retrieval"""
        response = requests.get(
            f"{BASE_URL}/api/quests/weekly",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"}
        )
        assert response.status_code == 200, f"Weekly quests failed: {response.text}"
        data = response.json()
        assert "quests" in data
        assert "week" in data
        quests = data["quests"]
        assert len(quests) >= 1
        print(f"Weekly quests ({data['week']}): {len(quests)} quests")


class TestSkillTrees:
    """Test Skill Tree system"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        if not TestAuthFlow.access_token:
            pytest.skip("No auth token available")
    
    def test_get_skill_trees(self):
        """Test skill trees retrieval"""
        response = requests.get(
            f"{BASE_URL}/api/skill-trees",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"}
        )
        assert response.status_code == 200, f"Skill trees failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        # Should have 4 skill trees: Mind, Knowledge, Discipline, Fitness
        skill_names = [s["skill_tree"] for s in data]
        assert "Mind" in skill_names or len(data) >= 4
        print(f"Skill trees: {skill_names}")


class TestAchievements:
    """Test Achievement system"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        if not TestAuthFlow.access_token:
            pytest.skip("No auth token available")
    
    def test_get_achievements(self):
        """Test achievements retrieval"""
        response = requests.get(
            f"{BASE_URL}/api/achievements",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"}
        )
        assert response.status_code == 200, f"Achievements failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Unlocked achievements: {len(data)}")
    
    def test_get_available_achievements(self):
        """Test available achievements with unlock status"""
        response = requests.get(
            f"{BASE_URL}/api/achievements/available",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"}
        )
        assert response.status_code == 200, f"Available achievements failed: {response.text}"
        data = response.json()
        assert "achievements" in data
        print(f"Total achievements available: {len(data['achievements'])}")


class TestFocusSessions:
    """Test Focus Session system"""
    session_id = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        if not TestAuthFlow.access_token:
            pytest.skip("No auth token available")
    
    def test_start_focus_session(self):
        """Test starting a focus session"""
        response = requests.post(
            f"{BASE_URL}/api/focus-sessions",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"},
            json={"mode": "normal"}
        )
        assert response.status_code == 200, f"Focus session start failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["mode"] == "normal"
        TestFocusSessions.session_id = data["id"]
        print(f"Focus session started: {data['id']}")
    
    def test_end_focus_session(self):
        """Test ending a focus session"""
        if not TestFocusSessions.session_id:
            pytest.skip("No session ID available")
        
        response = requests.patch(
            f"{BASE_URL}/api/focus-sessions/{TestFocusSessions.session_id}/end",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"},
            json={"duration_minutes": 25, "successful": True}
        )
        assert response.status_code == 200, f"Focus session end failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        print("Focus session ended successfully")
    
    def test_get_focus_sessions(self):
        """Test getting focus session history"""
        response = requests.get(
            f"{BASE_URL}/api/focus-sessions",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"}
        )
        assert response.status_code == 200, f"Focus sessions list failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Total focus sessions: {len(data)}")


class TestAICoach:
    """Test AI Coach chat functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        if not TestAuthFlow.access_token:
            pytest.skip("No auth token available")
    
    def test_chat_motivational_mode(self):
        """Test AI Coach in motivational mode"""
        response = requests.post(
            f"{BASE_URL}/api/ai-coach/chat",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"},
            json={
                "message": "I need help staying focused on my studies",
                "mode": "motivational"
            },
            timeout=30  # AI responses may take time
        )
        assert response.status_code == 200, f"AI Coach failed: {response.text}"
        data = response.json()
        assert "response" in data
        assert data["mode"] == "motivational"
        print(f"AI Coach (motivational): {data['response'][:100]}...")
    
    def test_chat_strict_mode(self):
        """Test AI Coach in strict mode"""
        response = requests.post(
            f"{BASE_URL}/api/ai-coach/chat",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"},
            json={
                "message": "What should I do next?",
                "mode": "strict"
            },
            timeout=30
        )
        assert response.status_code == 200, f"AI Coach strict failed: {response.text}"
        data = response.json()
        assert "response" in data
        assert data["mode"] == "strict"
        print(f"AI Coach (strict): {data['response'][:100]}...")


class TestAnalytics:
    """Test Analytics dashboard"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        if not TestAuthFlow.access_token:
            pytest.skip("No auth token available")
    
    def test_get_analytics_dashboard(self):
        """Test analytics dashboard data"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/dashboard",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"}
        )
        assert response.status_code == 200, f"Analytics failed: {response.text}"
        data = response.json()
        assert "total_tasks" in data
        assert "current_level" in data
        assert "burnout_risk" in data
        assert "weekly_data" in data
        print(f"Analytics: Level {data['current_level']}, Tasks: {data['total_tasks']}, Discipline: {data['discipline_score']}")


class TestYouTubeLearning:
    """Test YouTube Learning integration (MOCKED)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        if not TestAuthFlow.access_token:
            pytest.skip("No auth token available")
    
    def test_search_youtube_videos(self):
        """Test YouTube video search (returns placeholder data)"""
        response = requests.get(
            f"{BASE_URL}/api/learning/youtube?subject=math&topic=algebra",
            headers={"Authorization": f"Bearer {TestAuthFlow.access_token}"}
        )
        assert response.status_code == 200, f"YouTube search failed: {response.text}"
        data = response.json()
        assert "videos" in data
        assert "subject" in data
        print(f"YouTube results for {data['subject']}: {len(data['videos'])} videos (MOCKED)")


class TestAdminPanel:
    """Test Admin Panel functionality"""
    admin_token = None
    
    def test_admin_login(self):
        """Test admin login with super admin credentials"""
        response = requests.post(f"{BASE_URL}/api/system/access", json={
            "username": "Rebadion",
            "password": "Rebadion2010"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["admin"]["is_super_admin"] == True
        TestAdminPanel.admin_token = data["access_token"]
        print(f"Admin login successful: {data['admin']['username']} (super_admin: {data['admin']['is_super_admin']})")
    
    def test_admin_invalid_credentials(self):
        """Test admin login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/system/access", json={
            "username": "WrongUser",
            "password": "WrongPass"
        })
        assert response.status_code == 401
        print("Invalid admin credentials correctly rejected")
    
    def test_admin_get_status(self):
        """Test admin dashboard status"""
        if not TestAdminPanel.admin_token:
            pytest.skip("No admin token available")
        
        response = requests.get(
            f"{BASE_URL}/api/system/status",
            headers={"Authorization": f"Bearer {TestAdminPanel.admin_token}"}
        )
        assert response.status_code == 200, f"Admin status failed: {response.text}"
        data = response.json()
        assert "total_users" in data
        assert "total_tasks" in data
        assert "users" in data
        print(f"Admin Status: {data['total_users']} users, {data['total_tasks']} tasks")
    
    def test_admin_list_admins(self):
        """Test listing admins"""
        if not TestAdminPanel.admin_token:
            pytest.skip("No admin token available")
        
        response = requests.get(
            f"{BASE_URL}/api/system/admins",
            headers={"Authorization": f"Bearer {TestAdminPanel.admin_token}"}
        )
        assert response.status_code == 200, f"Admin list failed: {response.text}"
        data = response.json()
        assert "admins" in data
        print(f"Total admins: {len(data['admins'])}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
