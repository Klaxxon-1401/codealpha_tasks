import json
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from .models import UserProfile, Project, Task, Comment, ActivityLog

# Page Views
@login_required
def dashboard_view(request):
    return render(request, 'dashboard.html')

def auth_view(request):
    if request.user.is_authenticated:
        return redirect('/')
    return render(request, 'auth.html')

# API Auth Endpoints
def api_me(request):
    if request.user.is_authenticated:
        return JsonResponse({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'full_name': f"{request.user.first_name} {request.user.last_name}".strip(),
                'avatar_url': request.user.profile.avatar_url,
                'bio': request.user.profile.bio,
                'location': request.user.profile.location
            }
        })
    return JsonResponse({'authenticated': False})

@csrf_exempt
@require_http_methods(["POST"])
def api_login(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
    except Exception:
        return JsonResponse({'error': 'Invalid request body.'}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return JsonResponse({'success': True})
    return JsonResponse({'error': 'Invalid credentials.'}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def api_logout(request):
    logout(request)
    return JsonResponse({'success': True})

@csrf_exempt
@require_http_methods(["POST"])
def api_register(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        full_name = data.get('full_name', '')
    except Exception:
        return JsonResponse({'error': 'Invalid request body.'}, status=400)

    if not username or not password or not email:
        return JsonResponse({'error': 'Username, email, and password are required.'}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({'error': 'Username is already taken.'}, status=400)

    first_name = ''
    last_name = ''
    if full_name:
        parts = full_name.split(' ', 1)
        first_name = parts[0]
        if len(parts) > 1:
            last_name = parts[1]

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )
    login(request, user)
    return JsonResponse({'success': True})

# Users Endpoint (for Task Assignment)
@login_required
def api_users(request):
    users = User.objects.all().order_by('username')
    users_list = []
    for u in users:
        users_list.append({
            'id': u.id,
            'username': u.username,
            'full_name': f"{u.first_name} {u.last_name}".strip() or u.username,
            'avatar_url': u.profile.avatar_url
        })
    return JsonResponse(users_list, safe=False)

# API Projects Endpoints
@login_required
@require_http_methods(["GET", "POST"])
@csrf_exempt
def api_projects(request):
    if request.method == "GET":
        # Returns projects owned or where tasks are assigned
        projects = Project.objects.filter(
            Q(owner=request.user) | Q(tasks__assignee=request.user)
        ).distinct()
        
        projects_list = []
        for p in projects:
            # Gather tasks count and status metrics
            tasks = p.tasks.all()
            total_tasks = tasks.count()
            done_tasks = tasks.filter(status='DONE').count()
            progress = int((done_tasks / total_tasks * 100)) if total_tasks > 0 else 0
            
            projects_list.append({
                'id': p.id,
                'name': p.name,
                'description': p.description,
                'created_at': p.created_at.isoformat(),
                'owner': p.owner.username,
                'total_tasks': total_tasks,
                'progress': progress
            })
        return JsonResponse(projects_list, safe=False)
        
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            name = data.get('name')
            description = data.get('description', '')
        except Exception:
            return JsonResponse({'error': 'Invalid request body.'}, status=400)
            
        if not name:
            return JsonResponse({'error': 'Project name is required.'}, status=400)
            
        project = Project.objects.create(
            name=name,
            description=description,
            owner=request.user
        )
        return JsonResponse({
            'id': project.id,
            'name': project.name,
            'description': project.description,
            'owner': project.owner.username
        }, status=201)

@login_required
@require_http_methods(["GET", "PUT", "DELETE"])
@csrf_exempt
def api_project_detail(request, project_id):
    project = get_object_or_404(Project, id=project_id)
    
    if request.method == "GET":
        tasks = project.tasks.all()
        todo_count = tasks.filter(status='TODO').count()
        in_progress_count = tasks.filter(status='IN_PROGRESS').count()
        done_count = tasks.filter(status='DONE').count()
        
        low_priority = tasks.filter(priority='LOW').count()
        medium_priority = tasks.filter(priority='MEDIUM').count()
        high_priority = tasks.filter(priority='HIGH').count()
        
        return JsonResponse({
            'id': project.id,
            'name': project.name,
            'description': project.description,
            'owner': project.owner.username,
            'stats': {
                'total': tasks.count(),
                'todo': todo_count,
                'in_progress': in_progress_count,
                'done': done_count,
                'low': low_priority,
                'medium': medium_priority,
                'high': high_priority
            }
        })
        
    elif request.method == "PUT":
        if project.owner != request.user:
            return JsonResponse({'error': 'Only the owner can edit the project.'}, status=403)
        try:
            data = json.loads(request.body)
            project.name = data.get('name', project.name)
            project.description = data.get('description', project.description)
            project.save()
            return JsonResponse({'success': True})
        except Exception:
            return JsonResponse({'error': 'Invalid payload.'}, status=400)
            
    elif request.method == "DELETE":
        if project.owner != request.user:
            return JsonResponse({'error': 'Only the owner can delete the project.'}, status=403)
        project.delete()
        return JsonResponse({'success': True})

# API Tasks Endpoints
@login_required
@require_http_methods(["GET", "POST"])
@csrf_exempt
def api_project_tasks(request, project_id):
    project = get_object_or_404(Project, id=project_id)
    
    if request.method == "GET":
        tasks = project.tasks.all()
        tasks_list = []
        for t in tasks:
            tasks_list.append({
                'id': t.id,
                'title': t.title,
                'description': t.description,
                'status': t.status,
                'priority': t.priority,
                'due_date': t.due_date.isoformat() if t.due_date else None,
                'assignee': {
                    'id': t.assignee.id,
                    'username': t.assignee.username,
                    'full_name': f"{t.assignee.first_name} {t.assignee.last_name}".strip() or t.assignee.username,
                    'avatar_url': t.assignee.profile.avatar_url
                } if t.assignee else None
            })
        return JsonResponse(tasks_list, safe=False)
        
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            title = data.get('title')
            description = data.get('description', '')
            status = data.get('status', 'TODO')
            priority = data.get('priority', 'MEDIUM')
            due_date = data.get('due_date') or None
            assignee_id = data.get('assignee_id')
        except Exception:
            return JsonResponse({'error': 'Invalid request body.'}, status=400)
            
        if not title:
            return JsonResponse({'error': 'Task title is required.'}, status=400)
            
        assignee = None
        if assignee_id:
            assignee = get_object_or_404(User, id=assignee_id)
            
        task = Task.objects.create(
            project=project,
            title=title,
            description=description,
            status=status,
            priority=priority,
            due_date=due_date,
            assignee=assignee
        )
        
        # Log initial creation activity
        ActivityLog.objects.create(
            task=task,
            user=request.user,
            action="created the task"
        )
        if assignee:
            ActivityLog.objects.create(
                task=task,
                user=request.user,
                action=f"assigned the task to {assignee.username}"
            )
            
        return JsonResponse({'id': task.id, 'title': task.title})

@login_required
@require_http_methods(["GET", "PUT", "DELETE"])
@csrf_exempt
def api_task_detail(request, task_id):
    task = get_object_or_404(Task, id=task_id)
    
    if request.method == "GET":
        return JsonResponse({
            'id': task.id,
            'project_id': task.project.id,
            'title': task.title,
            'description': task.description,
            'status': task.status,
            'priority': task.priority,
            'due_date': task.due_date.isoformat() if task.due_date else None,
            'assignee': {
                'id': task.assignee.id,
                'username': task.assignee.username,
                'full_name': f"{task.assignee.first_name} {task.assignee.last_name}".strip() or task.assignee.username,
                'avatar_url': task.assignee.profile.avatar_url
            } if task.assignee else None
        })
        
    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
            # Log modifications
            changes = []
            
            title = data.get('title')
            description = data.get('description')
            status = data.get('status')
            priority = data.get('priority')
            due_date = data.get('due_date', '')
            assignee_id = data.get('assignee_id')
            
            if title is not None and title != task.title:
                changes.append(f"renamed task to '{title}'")
                task.title = title
            if description is not None and description != task.description:
                changes.append("updated the description")
                task.description = description
            if status is not None and status != task.status:
                old_status = task.get_status_display()
                task.status = status
                new_status = task.get_status_display()
                changes.append(f"moved status from '{old_status}' to '{new_status}'")
            if priority is not None and priority != task.priority:
                old_priority = task.get_priority_display()
                task.priority = priority
                new_priority = task.get_priority_display()
                changes.append(f"changed priority from '{old_priority}' to '{new_priority}'")
            if due_date != '':
                date_val = due_date or None
                if date_val != (task.due_date.isoformat() if task.due_date else None):
                    changes.append(f"updated due date to {due_date or 'none'}")
                    task.due_date = date_val
                    
            if assignee_id is not None:
                if assignee_id == '':
                    if task.assignee:
                        changes.append(f"removed assignee {task.assignee.username}")
                        task.assignee = None
                else:
                    new_assignee = get_object_or_404(User, id=int(assignee_id))
                    if task.assignee != new_assignee:
                        changes.append(f"reassigned task to {new_assignee.username}")
                        task.assignee = new_assignee
                        
            task.save()
            
            # Log all changes in ActivityLog
            for change in changes:
                ActivityLog.objects.create(
                    task=task,
                    user=request.user,
                    action=change
                )
                
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
            
    elif request.method == "DELETE":
        task.delete()
        return JsonResponse({'success': True})

# API Comments Endpoints
@login_required
@require_http_methods(["GET", "POST"])
@csrf_exempt
def api_task_comments(request, task_id):
    task = get_object_or_404(Task, id=task_id)
    
    if request.method == "GET":
        comments = task.comments.all()
        comments_list = []
        for c in comments:
            comments_list.append({
                'id': c.id,
                'content': c.content,
                'created_at': c.created_at.isoformat(),
                'user': {
                    'username': c.user.username,
                    'full_name': f"{c.user.first_name} {c.user.last_name}".strip() or c.user.username,
                    'avatar_url': c.user.profile.avatar_url
                }
            })
        return JsonResponse(comments_list, safe=False)
        
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            content = data.get('content')
        except Exception:
            return JsonResponse({'error': 'Invalid request body.'}, status=400)
            
        if not content:
            return JsonResponse({'error': 'Comment content cannot be empty.'}, status=400)
            
        comment = Comment.objects.create(
            task=task,
            user=request.user,
            content=content
        )
        return JsonResponse({
            'id': comment.id,
            'content': comment.content,
            'created_at': comment.created_at.isoformat(),
            'user': {
                'username': comment.user.username,
                'avatar_url': comment.user.profile.avatar_url
            }
        }, status=201)

# API Task Activity Endpoint
@login_required
def api_task_activity(request, task_id):
    task = get_object_or_404(Task, id=task_id)
    activities = task.activities.all()
    act_list = []
    for a in activities:
        act_list.append({
            'id': a.id,
            'action': a.action,
            'created_at': a.created_at.isoformat(),
            'user': {
                'username': a.user.username,
                'full_name': f"{a.user.first_name} {a.user.last_name}".strip() or a.user.username
            }
        })
    return JsonResponse(act_list, safe=False)
