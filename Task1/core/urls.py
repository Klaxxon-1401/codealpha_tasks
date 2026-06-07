"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    path('product/', TemplateView.as_view(template_name='product.html'), name='product-detail-view'),
    path('cart/', TemplateView.as_view(template_name='cart.html'), name='cart-view'),
    path('checkout/', TemplateView.as_view(template_name='checkout.html'), name='checkout-view'),
    path('auth/', TemplateView.as_view(template_name='auth.html'), name='auth-view'),
    path('orders/', TemplateView.as_view(template_name='orders.html'), name='orders-view'),
    path('', include('store.urls')),
]

