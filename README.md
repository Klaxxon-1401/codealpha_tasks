# CodeAlpha Internship - Full Stack Development

This repository contains the tasks completed during the CodeAlpha Full Stack Development Internship.

---

## Shared UI/UX Design System

All three projects have been upgraded with a modern, custom CSS/JS design system built completely from scratch without external frameworks:
- **Animations:** Custom `@keyframes` (fadeInUp, shimmer, heartBeat, etc.) with staggered entrance effects (via `IntersectionObserver`) for smooth content loading.
- **Micro-interactions:** Ripple effects on buttons, smooth CSS transitions (`cubic-bezier(0.4, 0, 0.2, 1)`), dynamic page-load progress bars, and a custom SVG-icon toast notification system.
- **Aesthetics:** Glassmorphism headers, dynamic gradients, dark slate backgrounds with vibrant teal accents, and skeleton loaders for async content.

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

### Setup Instructions

```powershell
cd Codealpha_SimpleEcommerceStore
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python seed_db.py
python manage.py runserver
```

Open `http://127.0.0.1:8000` in a browser.

### Test Account Credentials
- **Username**: `devan`
- **Password**: `password123`

New accounts can also be created via the registration form.

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

### Setup Instructions

```powershell
cd Codealpha_SocialMediaApp
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python seed_db.py
python manage.py runserver
```

Open `http://127.0.0.1:8000` in a browser.

### Test Account Credentials
- **Usernames**: `alice`, `bob`, `clara`
- **Password**: `password123`

New accounts can also be created via the registration form.

---

## Task 3: Project Management Tool

A responsive visual Project Management workspace resembling Trello and Jira. It contains a dynamic dashboard with inline SVG-based analytics, interactive Kanban boards with drag-and-drop actions, project creation/deletion, task assignment, comments, and audit timeline tracking.

### Technology Stack
- **Backend**: Python + Django
- **Database**: SQLite3
- **Frontend**: Vanilla HTML5, CSS3, JavaScript ES6

### Core Features
1. **Interactive Kanban Board**: Visual columns (To Do, In Progress, Done) with HTML5 Drag and Drop event bindings to transition task states seamlessly.
2. **Dynamic SVG Dashboard**: Donut charts for status distribution and horizontal priority bar graphs rendered purely from raw SVG paths, updating automatically upon task shifts.
3. **Task Detailed Operations**: Custom detailed modals with tabs to manage descriptions, prioritize (Low, Medium, High), set deadlines, select assignees, write comments, and view historical audit logs (timelines).
4. **Project Workspaces**: Multi-project sidebar navigations allowing owners to launch and delete boards dynamically.
5. **Team Management**: Shared assignee list to distribute workloads.

### Setup Instructions

```powershell
cd Codealpha_ProjectManagementTool
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python seed_db.py
python manage.py runserver
```

Open `http://127.0.0.1:8000` in a browser.

### Test Account Credentials
- **Usernames**: `alice`, `bob`, `clara`
- **Password**: `password123`

New accounts can also be created via the registration form.
