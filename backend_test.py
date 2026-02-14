import requests
import sys
import json
import time
from datetime import datetime

class ProductivitySystemTester:
    def __init__(self, base_url="https://neural-boost-1.preview.emergentagent.com"):
        self.base_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                pass

            details = f"Status: {response.status_code}"
            if not success:
                details += f", Expected: {expected_status}, Response: {str(response_data)[:200]}"
            
            self.log_test(name, success, details)
            return success, response_data

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_auth_flow(self):
        """Test authentication system"""
        print("\n🔐 Testing Authentication...")
        
        # Generate unique user
        timestamp = int(time.time())
        test_email = f"test_user_{timestamp}@example.com"
        test_username = f"warrior_{timestamp}"
        test_password = "TestPass123!"

        # Test signup
        success, response = self.run_test(
            "User Signup",
            "POST",
            "auth/signup",
            200,
            {
                "email": test_email,
                "username": test_username,
                "password": test_password
            }
        )

        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   User created: {test_username} (Level: {response['user']['level']})")
        else:
            return False

        # Test login
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            {
                "email": test_email,
                "password": test_password
            }
        )

        if success and 'access_token' in response:
            print(f"   Login successful for Level {response['user']['level']} user")
        
        # Test get current user
        self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )

        return True

    def test_task_system(self):
        """Test task CRUD and completion with XP"""
        print("\n🎯 Testing Task System...")
        
        if not self.token:
            print("❌ No auth token - skipping task tests")
            return False

        # Create task
        task_data = {
            "title": "Master AI Algorithms",
            "description": "Study and implement machine learning algorithms",
            "skill_tree": "Knowledge",
            "difficulty": 3,
            "estimated_minutes": 60
        }
        
        success, response = self.run_test(
            "Create Task",
            "POST",
            "tasks",
            200,
            task_data
        )
        
        task_id = None
        if success and 'id' in response:
            task_id = response['id']
            print(f"   Task created: {response.get('title')} (+{response.get('xp_reward')} XP)")

        # Get tasks
        self.run_test(
            "Get All Tasks",
            "GET",
            "tasks",
            200
        )

        # Get active tasks only
        self.run_test(
            "Get Active Tasks",
            "GET",
            "tasks?completed=false",
            200
        )

        # Complete task
        if task_id:
            success, response = self.run_test(
                "Complete Task",
                "PATCH",
                f"tasks/{task_id}/complete",
                200
            )
            
            if success:
                print(f"   XP gained: {response.get('xp_gained')}")
                print(f"   Level up: {response.get('level_up')}")

        # Delete task
        if task_id:
            self.run_test(
                "Delete Task",
                "DELETE",
                f"tasks/{task_id}",
                200
            )

        return True

    def test_skill_trees(self):
        """Test skill tree progression"""
        print("\n🌳 Testing Skill Trees...")
        
        if not self.token:
            print("❌ No auth token - skipping skill tree tests")
            return False

        success, response = self.run_test(
            "Get Skill Trees",
            "GET",
            "skill-trees",
            200
        )

        if success and response:
            print(f"   Found {len(response)} skill trees:")
            for skill in response:
                print(f"     - {skill.get('skill_tree')}: Level {skill.get('level')} ({skill.get('total_xp')} XP)")

        return True

    def test_achievements_system(self):
        """Test achievements"""
        print("\n🏆 Testing Achievement System...")
        
        if not self.token:
            print("❌ No auth token - skipping achievement tests")
            return False

        # Get user achievements
        self.run_test(
            "Get User Achievements",
            "GET",
            "achievements",
            200
        )

        # Get available achievements
        success, response = self.run_test(
            "Get Available Achievements",
            "GET",
            "achievements/available",
            200
        )

        if success and response.get('achievements'):
            unlocked_count = sum(1 for a in response['achievements'] if a.get('unlocked'))
            total_count = len(response['achievements'])
            print(f"   Achievements: {unlocked_count}/{total_count} unlocked")
            
            if response.get('new_unlocks'):
                print(f"   New unlocks: {len(response['new_unlocks'])}")

        return True

    def test_boss_challenge(self):
        """Test daily boss challenge"""
        print("\n⚔️ Testing Boss Challenge...")
        
        if not self.token:
            print("❌ No auth token - skipping boss challenge tests")
            return False

        # Get today's boss
        success, response = self.run_test(
            "Get Daily Boss",
            "GET",
            "boss-challenge/today",
            200
        )

        boss_id = None
        if success and response:
            boss_id = response.get('id')
            print(f"   Challenge: {response.get('challenge_text')}")
            print(f"   Difficulty: {response.get('difficulty')}/5")
            print(f"   XP Reward: {response.get('xp_reward')}")

        # Complete boss challenge
        if boss_id and not response.get('completed'):
            success, complete_response = self.run_test(
                "Complete Boss Challenge",
                "PATCH",
                f"boss-challenge/{boss_id}/complete",
                200
            )
            
            if success:
                print(f"   Boss defeated! +{complete_response.get('xp_gained')} XP")

        return True

    def test_ai_coach(self):
        """Test AI coach with all 4 modes"""
        print("\n🤖 Testing AI Coach...")
        
        if not self.token:
            print("❌ No auth token - skipping AI coach tests")
            return False

        modes = ['motivational', 'strict', 'strategic', 'analytical']
        test_message = "I'm struggling with procrastination on my tasks. Help me stay focused."

        for mode in modes:
            success, response = self.run_test(
                f"AI Coach ({mode.title()} Mode)",
                "POST",
                "ai-coach/chat",
                200,
                {
                    "message": test_message,
                    "mode": mode
                }
            )
            
            if success and response.get('response'):
                print(f"   {mode.title()}: {response['response'][:100]}...")
                # Add delay for rate limiting
                time.sleep(1)

        return True

    def test_focus_sessions(self):
        """Test focus mode functionality"""
        print("\n🎯 Testing Focus Sessions...")
        
        if not self.token:
            print("❌ No auth token - skipping focus session tests")
            return False

        # Start focus session
        success, response = self.run_test(
            "Start Focus Session",
            "POST",
            "focus-sessions",
            200,
            {
                "mode": "normal"
            }
        )

        session_id = None
        if success and response:
            session_id = response.get('id')
            print(f"   Focus session started: {session_id}")

        # End focus session
        if session_id:
            self.run_test(
                "End Focus Session",
                "PATCH",
                f"focus-sessions/{session_id}/end",
                200,
                {
                    "duration_minutes": 25,
                    "successful": True
                }
            )

        # Get focus sessions
        self.run_test(
            "Get Focus Sessions",
            "GET",
            "focus-sessions",
            200
        )

        return True

    def test_analytics(self):
        """Test analytics dashboard"""
        print("\n📊 Testing Analytics...")
        
        if not self.token:
            print("❌ No auth token - skipping analytics tests")
            return False

        success, response = self.run_test(
            "Get Analytics Dashboard",
            "GET",
            "analytics/dashboard",
            200
        )

        if success and response:
            print(f"   Total Tasks: {response.get('total_tasks', 0)}")
            print(f"   Total Focus Time: {response.get('total_focus_time', 0)} min")
            print(f"   Current Level: {response.get('current_level', 1)}")
            print(f"   Discipline Score: {response.get('discipline_score', 50)}/100")
            print(f"   Current Streak: {response.get('current_streak', 0)} days")
            
            burnout = response.get('burnout_risk', {})
            print(f"   Burnout Risk: {burnout.get('risk_level', 'unknown')} - {burnout.get('message', '')}")

        return True

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Dopamine Productivity System Test Suite...")
        print("=" * 60)

        try:
            # Test authentication
            if not self.test_auth_flow():
                print("❌ Authentication failed - stopping tests")
                return False

            # Test all features
            self.test_task_system()
            self.test_skill_trees()
            self.test_achievements_system()
            self.test_boss_challenge()
            self.test_ai_coach()
            self.test_focus_sessions()
            self.test_analytics()

        except Exception as e:
            print(f"❌ Test suite failed with error: {str(e)}")
            return False

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("✅ System is functioning well!")
        elif success_rate >= 60:
            print("⚠️ Some issues found - review failed tests")
        else:
            print("❌ Major issues detected - system needs attention")

        return success_rate >= 80

def main():
    tester = ProductivitySystemTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())