from django.urls import path
from . import views

urlpatterns = [
    path('api/auth/register/', views.register_view, name='register'),
    path('api/auth/login/', views.login_view, name='login'),
    path('api/auth/logout/', views.logout_view, name='logout'),
    path('api/auth/me/', views.me_view, name='me'),
    path('api/products/', views.product_list_view, name='product-list'),
    path('api/products/<int:pk>/', views.product_detail_view, name='product-detail'),
    path('api/orders/', views.checkout_view, name='checkout'),
    path('api/orders/my-orders/', views.my_orders_view, name='my-orders'),
]
