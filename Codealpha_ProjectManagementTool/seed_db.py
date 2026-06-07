import os
import django
from datetime import date, timedelta

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from pm.models import UserProfile, Project, Task, Comment, ActivityLog

def seed_pm_data():
    print("Seeding Project Management database...")

    # 1. Clear existing data
    print("Clearing old records...")
    ActivityLog.objects.all().delete()
    Comment.objects.all().delete()
    Task.objects.all().delete()
    Project.objects.all().delete()
    UserProfile.objects.all().delete()
    User.objects.all().delete()

    # 2. Create Users & Profiles
    users_data = [
        {
            "username": "alice",
            "email": "alice@example.com",
            "password": "password123",
            "first_name": "Alice",
            "last_name": "Smith",
            "bio": "Lead UI/UX Designer | Focused on elegant design systems",
            "location": "New York, NY",
            "avatar_url": "/static/images/avatar_alice.png"
        },
        {
            "username": "bob",
            "email": "bob@example.com",
            "password": "password123",
            "first_name": "Bob",
            "last_name": "Johnson",
            "bio": "Lead Backend Developer | Database optimizer & API designer",
            "location": "San Francisco, CA",
            "avatar_url": "/static/images/avatar_bob.png"
        },
        {
            "username": "clara",
            "email": "clara@example.com",
            "password": "password123",
            "first_name": "Clara",
            "last_name": "Muller",
            "bio": "Product Manager | Coordinating milestones & deliverables",
            "location": "Berlin, Germany",
            "avatar_url": "/static/images/avatar_clara.png"
        }
    ]

    users = {}
    for u_data in users_data:
        user = User.objects.create_user(
            username=u_data["username"],
            email=u_data["email"],
            password=u_data["password"],
            first_name=u_data["first_name"],
            last_name=u_data["last_name"]
        )
        print(f"Created user: {user.username}")
        
        # Profile is auto-created by signal, update it
        profile = user.profile
        profile.bio = u_data["bio"]
        profile.location = u_data["location"]
        profile.avatar_url = u_data["avatar_url"]
        profile.save()
        
        users[user.username] = user

    today = date.today()

    # 3. Create Projects
    print("Creating projects...")
    proj1 = Project.objects.create(
        name="Design System Refresh",
        description="Update the core design system for the main customer dashboard. Create modular UI components, smooth transitions, and dark slate dashboard layouts.",
        owner=users["clara"]
    )
    
    proj2 = Project.objects.create(
        name="Backend API Optimization",
        description="Optimize database queries, configure query caching layers, index primary tables, and restructure views to minimize response sizes.",
        owner=users["bob"]
    )

    # 4. Create Tasks for Project 1 (Design System Refresh)
    print("Populating Design System Refresh tasks...")
    
    t1 = Task.objects.create(
        project=proj1,
        title="Define Color Palette & Typography Guidelines",
        description="Define standard color tokens, border radiuses, and outline glow variables. Document Google Font usage (Inter and Outfit).",
        status="DONE",
        priority="HIGH",
        due_date=today - timedelta(days=3),
        assignee=users["alice"]
    )
    ActivityLog.objects.create(task=t1, user=users["clara"], action="created the task")
    ActivityLog.objects.create(task=t1, user=users["clara"], action="assigned the task to alice")
    ActivityLog.objects.create(task=t1, user=users["alice"], action="moved status from 'To Do' to 'In Progress'")
    ActivityLog.objects.create(task=t1, user=users["alice"], action="moved status from 'In Progress' to 'Done'")

    t2 = Task.objects.create(
        project=proj1,
        title="Design High-Fidelity Mockups for Settings Panel",
        description="Draw layout screens for the user settings dashboard, supporting customizable profiles and theme selectors.",
        status="IN_PROGRESS",
        priority="HIGH",
        due_date=today + timedelta(days=1),
        assignee=users["alice"]
    )
    ActivityLog.objects.create(task=t2, user=users["clara"], action="created the task")
    ActivityLog.objects.create(task=t2, user=users["clara"], action="assigned the task to alice")
    ActivityLog.objects.create(task=t2, user=users["alice"], action="moved status from 'To Do' to 'In Progress'")

    t3 = Task.objects.create(
        project=proj1,
        title="Implement Custom Transition Animations in CSS",
        description="Add smooth micro-animations on hover states for action keys, board cards, and navigation panel options.",
        status="TODO",
        priority="MEDIUM",
        due_date=today + timedelta(days=4),
        assignee=users["bob"]
    )
    ActivityLog.objects.create(task=t3, user=users["clara"], action="created the task")
    ActivityLog.objects.create(task=t3, user=users["clara"], action="assigned the task to bob")

    t4 = Task.objects.create(
        project=proj1,
        title="Gather Feedback on Component Mockups",
        description="Send Figma layout review invites to engineering and product teams to gather suggestions.",
        status="TODO",
        priority="LOW",
        due_date=today + timedelta(days=7),
        assignee=users["clara"]
    )
    ActivityLog.objects.create(task=t4, user=users["clara"], action="created the task")

    # Comments on Project 1
    Comment.objects.create(
        task=t2,
        user=users["alice"],
        content="Working on the dark mode variation right now. Will post mockups shortly."
    )
    Comment.objects.create(
        task=t2,
        user=users["clara"],
        content="Excellent. Make sure card borders have a subtle cobalt/teal glow on hover."
    )

    # 5. Create Tasks for Project 2 (Backend API Optimization)
    print("Populating Backend API Optimization tasks...")

    t5 = Task.objects.create(
        project=proj2,
        title="Profile Slow Running Queries",
        description="Run query analyzer logs to identify bottlenecks on user lists and dashboard load endpoints.",
        status="DONE",
        priority="HIGH",
        due_date=today - timedelta(days=1),
        assignee=users["bob"]
    )
    ActivityLog.objects.create(task=t5, user=users["bob"], action="created the task")
    ActivityLog.objects.create(task=t5, user=users["bob"], action="assigned the task to bob")
    ActivityLog.objects.create(task=t5, user=users["bob"], action="moved status from 'To Do' to 'Done'")

    t6 = Task.objects.create(
        project=proj2,
        title="Add Cache Headers and Query Indexing",
        description="Implement local cache middleware to store static statistics query results. Add database indexes to task.project_id.",
        status="IN_PROGRESS",
        priority="HIGH",
        due_date=today + timedelta(days=2),
        assignee=users["bob"]
    )
    ActivityLog.objects.create(task=t6, user=users["bob"], action="created the task")
    ActivityLog.objects.create(task=t6, user=users["bob"], action="assigned the task to bob")
    ActivityLog.objects.create(task=t6, user=users["bob"], action="moved status from 'To Do' to 'In Progress'")

    t7 = Task.objects.create(
        project=proj2,
        title="Document Endpoint Payloads",
        description="Draft OpenAPI schema detailing required parameters and responses for the REST APIs.",
        status="TODO",
        priority="LOW",
        due_date=today + timedelta(days=10),
        assignee=users["clara"]
    )
    ActivityLog.objects.create(task=t7, user=users["bob"], action="created the task")
    ActivityLog.objects.create(task=t7, user=users["bob"], action="assigned the task to clara")

    # Comments on Project 2
    Comment.objects.create(
        task=t6,
        user=users["bob"],
        content="Query indexing is done. Working on caching middleware implementation."
    )

    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_pm_data()
