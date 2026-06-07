# CodeAlpha Internship - Full Stack Development

This repository contains the tasks completed during the CodeAlpha Full Stack Development Internship.

---

## Task 1: Simple E-commerce Store

A responsive full-stack E-commerce Store application utilizing a Python/Django backend, SQLite database, and a vanilla HTML/CSS/JavaScript frontend.

### Technology Stack
- **Backend**: Python + Django
- **Database**: SQLite3
- **Frontend**: Vanilla HTML5, CSS3, JavaScript ES6

### Core Features
1. **Catalog and Filtering**: Product list with a search bar and category filters (Audio, Wearables, Accessories, Home, Kitchen, Travel) that update dynamically.
2. **Product Details Page**: View details for individual products including description, price, stock availability, and a quantity selector.
3. **Shopping Cart**: Client-side cart state persisted in local storage with support for quantity adjustments, item removals, and total calculations.
4. **User Authentication**: User registration and login views with session persistence.
5. **Order Processing**: Checkout form with shipping details, stock checking, automatic inventory deduction, and database order logging.
6. **Order History**: User dashboard listing previous orders, dates, total amounts, item summaries, and fulfillment status.

### Local Setup Instructions

#### First-Time Setup
1. Open PowerShell and navigate to the project directory:
   ```powershell
   cd "C:\codealpha_tasks\Codealpha_SimpleEcommerceStore"
   ```
2. Create a local virtual environment:
   ```powershell
   python -m venv venv
   ```
3. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\activate
   ```
4. Install the required dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
5. Start the development server:
   ```powershell
   python manage.py runserver
   ```
6. Open the application in a browser:
   `http://127.0.0.1:8000`

#### Running Subsequently
Once setup is complete, you can start the application with:
```powershell
cd "C:\codealpha_tasks\Codealpha_SimpleEcommerceStore"
.\venv\Scripts\activate
python manage.py runserver
```

### Test Account Credentials
An account is seeded in the database for testing:
- **Username**: `devan`
- **Password**: `password123`
- **Email**: `devan@example.com`

*(New user accounts can also be created via the registration form).*

---

## Task 2: Social Media Platform

A responsive mini Social Media application allowing users to share posts, write comments, like posts, and follow other users.

### Technology Stack
- **Backend**: Python + Django
- **Database**: SQLite3
- **Frontend**: Vanilla HTML5, CSS3, JavaScript ES6

### Core Features
1. **Feed Dashboard**: Chronological timeline showing updates from followed accounts, with a fallback to the public global feed if no users are followed.
2. **Interactive Profiles**: Displays bio, locations, avatar pictures, followings and followers counts, along with a grid of posts shared by the user.
3. **Follower System**: Toggleable follow links on profile details and feed suggestions to build personalized feeds.
4. **Likes & Comments**: Interactive toggle switches to like posts and popup modals to view/write comments.
5. **Dynamic Search**: Instant dropdown search results matching users by username or display names.

### Local Setup Instructions

#### First-Time Setup
1. Open PowerShell and navigate to the project directory:
   ```powershell
   cd "C:\codealpha_tasks\Codealpha_SocialMediaApp"
   ```
2. Create a local virtual environment:
   ```powershell
   python -m venv venv
   ```
3. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\activate
   ```
4. Install the required dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
5. Start the development server:
   ```powershell
   python manage.py runserver
   ```
6. Open the application in a browser:
   `http://127.0.0.1:8000`

#### Running Subsequently
Once setup is complete, you can start the application with:
```powershell
cd "C:\codealpha_tasks\Codealpha_SocialMediaApp"
.\venv\Scripts\activate
python manage.py runserver
```

### Test Account Credentials
Three seeded test accounts are available in the database (all accounts share the same password):
- **Usernames**: `alice`, `bob`, `clara`
- **Password**: `password123`

*(New user accounts can also be created via the registration form).*

---

## Task 3: Project Management Tool

A responsive visual Project Management workspace resembling Trello and Jira. It contains a dynamic dashboard with inline SVG-based analytics, interactive Kanban boards with drag-and-drop actions, project creation/deletion, task assignment, comments, and audit timeline tracking.

### Technology Stack
- **Backend**: Python + Django
- **Database**: SQLite3
- **Frontend**: Vanilla HTML5, CSS3, JavaScript ES6

### Core Features
1. **Interactive Kanban Board**: Visual Columns (To Do, In Progress, Done) with HTML5 Drag & Drop event bindings to transition task states seamlessly.
2. **Dynamic SVG Dashboard**: Donut charts for status distribution and horizontal priority bar graphs rendered purely from raw SVG paths, updating automatically upon task shifts.
3. **Task Detailed Operations**: Custom detailed modals with tabs to manage descriptions, prioritize (Low, Medium, High), set deadlines, select assignees, write comments, and view historical audit logs (timelines).
4. **Project Workspaces**: Multi-project sidebar navigations allowing owners to launch and delete boards dynamically.
5. **Team Management**: Shared assignee list to distribute workloads.

### Local Setup Instructions

#### First-Time Setup
1. Open PowerShell and navigate to the project directory:
   ```powershell
   cd "C:\codealpha_tasks\Codealpha_ProjectManagementTool"
   ```
2. Create a local virtual environment:
   ```powershell
   python -m venv venv
   ```
3. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\activate
   ```
4. Install the required dependencies:
   ```powershell
   pip install django
   ```
5. Seed the database with workspaces and team accounts:
   ```powershell
   python seed_db.py
   ```
6. Start the development server:
   ```powershell
   python manage.py runserver
   ```
7. Open the application in a browser:
   `http://127.0.0.1:8000`

#### Running Subsequently
Once setup is complete, you can start the application with:
```powershell
cd "C:\codealpha_tasks\Codealpha_ProjectManagementTool"
.\venv\Scripts\activate
python manage.py runserver
```

### Test Account Credentials
Three seeded test accounts are available in the database (all accounts share the same password):
- **Usernames**: `alice`, `bob`, `clara`
- **Password**: `password123`

*(New user accounts can also be created via the registration form).*
