from django.test import TestCase, Client
from django.contrib.auth.models import User
from pm.models import Project, Task, Comment, ActivityLog

class ProjectManagementTests(TestCase):
    def setUp(self):
        # Create users
        self.user1 = User.objects.create_user(username="testalice", password="password123", email="alice@test.com")
        self.user2 = User.objects.create_user(username="testbob", password="password123", email="bob@test.com")
        
        # Create client
        self.client = Client()

    def test_project_creation(self):
        # Test creating a project in the database
        proj = Project.objects.create(
            name="Alpha Board",
            description="First test project board",
            owner=self.user1
        )
        self.assertEqual(proj.name, "Alpha Board")
        self.assertEqual(proj.owner, self.user1)
        self.assertEqual(Project.objects.count(), 1)

    def test_task_creation_and_activity_logging(self):
        # Create project
        proj = Project.objects.create(
            name="Beta Board",
            description="Second test project board",
            owner=self.user1
        )
        
        # Create task
        task = Task.objects.create(
            project=proj,
            title="Design Dashboard UI",
            description="Create clean slate components.",
            status="TODO",
            priority="HIGH",
            assignee=self.user1
        )
        
        self.assertEqual(task.title, "Design Dashboard UI")
        self.assertEqual(task.status, "TODO")
        self.assertEqual(task.assignee, self.user1)
        
        # Log initial mock creation activity
        ActivityLog.objects.create(
            task=task,
            user=self.user1,
            action="created the task"
        )
        
        self.assertEqual(ActivityLog.objects.count(), 1)
        log = ActivityLog.objects.first()
        self.assertEqual(log.task, task)
        self.assertEqual(log.user, self.user1)
        self.assertEqual(log.action, "created the task")

    def test_api_unauthorized_redirect(self):
        # Access projects list without login
        response = self.client.get("/api/projects/")
        self.assertEqual(response.status_code, 302) # Redirects to LOGIN_URL
