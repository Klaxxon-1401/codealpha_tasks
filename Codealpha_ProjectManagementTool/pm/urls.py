from django.urls import path
from . import views

urlpatterns = [
    # Pages
    path('', views.dashboard_view, name='dashboard'),
    path('auth/', views.auth_view, name='auth'),
    
    # Auth API
    path('api/auth/me/', views.api_me, name='api_me'),
    path('api/auth/login/', views.api_login, name='api_login'),
    path('api/auth/logout/', views.api_logout, name='api_logout'),
    path('api/auth/register/', views.api_register, name='api_register'),
    
    # Users API
    path('api/users/', views.api_users, name='api_users'),
    
    # Projects API
    path('api/projects/', views.api_projects, name='api_projects'),
    path('api/projects/<int:project_id>/', views.api_project_detail, name='api_project_detail'),
    path('api/projects/<int:project_id>/tasks/', views.api_project_tasks, name='api_project_tasks'),
    
    # Tasks API
    path('api/tasks/<int:task_id>/', views.api_task_detail, name='api_task_detail'),
    path('api/tasks/<int:task_id>/comments/', views.api_task_comments, name='api_task_comments'),
    path('api/tasks/<int:task_id>/activity/', views.api_task_activity, name='api_task_activity'),
]
