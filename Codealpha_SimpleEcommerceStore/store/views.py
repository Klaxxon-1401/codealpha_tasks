import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from .models import Product, Order, OrderItem

def serialize_product(product):
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": float(product.price),
        "image_url": product.image_url,
        "category": product.category,
        "stock": product.stock,
    }

@csrf_exempt
def register_view(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")
        full_name = data.get("full_name", "")

        if not username or not email or not password:
            return JsonResponse({"error": "Username, email, and password are required"}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({"error": "Username already exists"}, status=400)
        
        if User.objects.filter(email=email).exists():
            return JsonResponse({"error": "Email already exists"}, status=400)

        # Split full name into first and last name
        names = full_name.split(" ", 1)
        first_name = names[0] if len(names) > 0 else ""
        last_name = names[1] if len(names) > 1 else ""

        user = User.objects.create_user(
            username=username, 
            email=email, 
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Auto-login after registration
        login(request, user)
        
        return JsonResponse({
            "message": "User registered and logged in successfully",
            "user": {
                "username": user.username,
                "email": user.email,
                "full_name": f"{user.first_name} {user.last_name}".strip()
            }
        }, status=201)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def login_view(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return JsonResponse({"error": "Username and password are required"}, status=400)

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({
                "message": "Logged in successfully",
                "user": {
                    "username": user.username,
                    "email": user.email,
                    "full_name": f"{user.first_name} {user.last_name}".strip()
                }
            })
        else:
            return JsonResponse({"error": "Invalid username or password"}, status=400)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def logout_view(request):
    if request.method not in ['POST', 'GET']:
        return JsonResponse({"error": "Method not allowed"}, status=405)
    logout(request)
    return JsonResponse({"message": "Logged out successfully"})

def me_view(request):
    if request.user.is_authenticated:
        return JsonResponse({
            "authenticated": True,
            "user": {
                "username": request.user.username,
                "email": request.user.email,
                "full_name": f"{request.user.first_name} {request.user.last_name}".strip()
            }
        })
    else:
        return JsonResponse({"authenticated": False})

def product_list_view(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    category = request.GET.get("category")
    search = request.GET.get("search")
    
    products = Product.objects.all()
    
    if category:
        products = products.filter(category__iexact=category)
    if search:
        products = products.filter(name__icontains=search) | products.filter(description__icontains=search)
        
    data = [serialize_product(p) for p in products]
    return JsonResponse(data, safe=False)

def product_detail_view(request, pk):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        product = Product.objects.get(pk=pk)
        return JsonResponse(serialize_product(product))
    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found"}, status=404)

@csrf_exempt
def checkout_view(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
        
    try:
        data = json.loads(request.body)
        shipping_name = data.get("shipping_name")
        shipping_address = data.get("shipping_address")
        shipping_city = data.get("shipping_city")
        shipping_zip = data.get("shipping_zip")
        items = data.get("items") # list of {product_id, quantity}

        if not shipping_name or not shipping_address or not shipping_city or not shipping_zip or not items:
            return JsonResponse({"error": "Shipping details and items are required"}, status=400)

        total_amount = 0
        order_items_to_create = []

        with transaction.atomic():
            for item in items:
                product_id = item.get("product_id")
                quantity = int(item.get("quantity", 0))

                if quantity <= 0:
                    return JsonResponse({"error": "Invalid quantity"}, status=400)

                try:
                    product = Product.objects.select_for_update().get(pk=product_id)
                except Product.DoesNotExist:
                    return JsonResponse({"error": f"Product with ID {product_id} not found"}, status=404)

                if product.stock < quantity:
                    return JsonResponse({"error": f"Insufficient stock for {product.name}. Available: {product.stock}"}, status=400)

                # Deduct stock
                product.stock -= quantity
                product.save()

                item_total = product.price * quantity
                total_amount += item_total

                order_items_to_create.append({
                    "product": product,
                    "quantity": quantity,
                    "price": product.price
                })

            # Create Order
            order = Order.objects.create(
                user=request.user,
                total_amount=total_amount,
                shipping_name=shipping_name,
                shipping_address=shipping_address,
                shipping_city=shipping_city,
                shipping_zip=shipping_zip,
                status='Processing' # Set default as Processing upon checkout
            )

            # Create OrderItems
            for item_data in order_items_to_create:
                OrderItem.objects.create(
                    order=order,
                    product=item_data["product"],
                    quantity=item_data["quantity"],
                    price=item_data["price"]
                )

        return JsonResponse({
            "message": "Order placed successfully",
            "order_id": order.id,
            "total_amount": float(order.total_amount)
        }, status=201)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def my_orders_view(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)
        
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)

    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    data = []
    
    for order in orders:
        items = []
        for item in order.items.all():
            items.append({
                "product_id": item.product.id if item.product else None,
                "product_name": item.product.name if item.product else "Unknown Product",
                "quantity": item.quantity,
                "price": float(item.price)
            })
            
        data.append({
            "id": order.id,
            "total_amount": float(order.total_amount),
            "shipping_name": order.shipping_name,
            "shipping_address": order.shipping_address,
            "shipping_city": order.shipping_city,
            "shipping_zip": order.shipping_zip,
            "status": order.status,
            "created_at": order.created_at.isoformat(),
            "items": items
        })

    return JsonResponse(data, safe=False)
