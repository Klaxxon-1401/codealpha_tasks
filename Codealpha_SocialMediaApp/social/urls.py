from django.urls import path
from . import views

urlpatterns = [
    path('api/auth/register/', views.register_view, name='register'),
    path('api/auth/login/', views.login_view, name='login'),
    path('api/auth/logout/', views.logout_view, name='logout'),
    path('api/auth/me/', views.me_view, name='me'),
    path('api/posts/', views.feed_view, name='feed'),
    path('api/posts/<int:post_id>/like/', views.like_toggle_view, name='like-toggle'),
    path('api/posts/<int:post_id>/comments/', views.comments_view, name='comments'),
    path('api/profiles/<str:username>/', views.profile_view, name='profile'),
    path('api/profiles/<str:username>/follow/', views.follow_toggle_view, name='follow-toggle'),
    path('api/users/search/', views.search_users_view, name='search-users'),
]
