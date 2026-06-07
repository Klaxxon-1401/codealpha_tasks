import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from .models import UserProfile, Post, Comment, Like, Follow

def serialize_user(user):
    profile = user.profile
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": f"{user.first_name} {user.last_name}".strip(),
        "bio": profile.bio,
        "avatar_url": profile.avatar_url,
        "location": profile.location,
    }

def serialize_post(post, current_user):
    likes_count = post.likes.count()
    comments_count = post.comments.count()
    user_liked = False
    if current_user.is_authenticated:
        user_liked = post.likes.filter(user=current_user).exists()

    return {
        "id": post.id,
        "content": post.content,
        "created_at": post.created_at.isoformat(),
        "user": {
            "id": post.user.id,
            "username": post.user.username,
            "avatar_url": post.user.profile.avatar_url,
            "full_name": f"{post.user.first_name} {post.user.last_name}".strip()
        },
        "likes_count": likes_count,
        "comments_count": comments_count,
        "user_liked": user_liked
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

        # Split full name
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

        login(request, user)
        return JsonResponse({
            "message": "User registered and logged in successfully",
            "user": serialize_user(user)
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
                "user": serialize_user(user)
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
            "user": serialize_user(request.user)
        })
    else:
        return JsonResponse({"authenticated": False})

@csrf_exempt
def feed_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)

    if request.method == 'GET':
        # Get list of user IDs that current user follows
        followed_user_ids = Follow.objects.filter(follower=request.user).values_list('following_id', flat=True)
        
        # Query posts from followed users + own posts
        posts = Post.objects.filter(Q(user_id__in=followed_user_ids) | Q(user=request.user))
        
        # Fallback: if user follows no one and has no posts, show all public posts
        if not posts.exists():
            posts = Post.objects.all()

        posts_data = [serialize_post(p, request.user) for p in posts]
        return JsonResponse(posts_data, safe=False)

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            content = data.get("content", "").strip()

            if not content:
                return JsonResponse({"error": "Post content cannot be empty"}, status=400)

            post = Post.objects.create(user=request.user, content=content)
            return JsonResponse({
                "message": "Post created successfully",
                "post": serialize_post(post, request.user)
            }, status=201)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def like_toggle_view(request, post_id):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)

    try:
        post = Post.objects.get(pk=post_id)
        like_qs = Like.objects.filter(post=post, user=request.user)

        if like_qs.exists():
            like_qs.delete()
            liked = False
        else:
            Like.objects.create(post=post, user=request.user)
            liked = True

        return JsonResponse({
            "liked": liked,
            "likes_count": post.likes.count()
        })
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found"}, status=404)

@csrf_exempt
def comments_view(request, post_id):
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found"}, status=404)

    if request.method == 'GET':
        comments = post.comments.all()
        data = []
        for c in comments:
            data.append({
                "id": c.id,
                "content": c.content,
                "created_at": c.created_at.isoformat(),
                "user": {
                    "username": c.user.username,
                    "avatar_url": c.user.profile.avatar_url,
                    "full_name": f"{c.user.first_name} {c.user.last_name}".strip()
                }
            })
        return JsonResponse(data, safe=False)

    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required"}, status=401)
        try:
            data = json.loads(request.body)
            content = data.get("content", "").strip()

            if not content:
                return JsonResponse({"error": "Comment cannot be empty"}, status=400)

            comment = Comment.objects.create(post=post, user=request.user, content=content)
            return JsonResponse({
                "message": "Comment added successfully",
                "comment": {
                    "id": comment.id,
                    "content": comment.content,
                    "created_at": comment.created_at.isoformat(),
                    "user": {
                        "username": comment.user.username,
                        "avatar_url": comment.user.profile.avatar_url,
                        "full_name": f"{comment.user.first_name} {comment.user.last_name}".strip()
                    }
                }
            }, status=201)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def profile_view(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    if request.method == 'GET':
        followers_count = Follow.objects.filter(following=user).count()
        following_count = Follow.objects.filter(follower=user).count()
        
        is_following = False
        if request.user.is_authenticated:
            is_following = Follow.objects.filter(follower=request.user, following=user).exists()

        posts = user.posts.all()
        posts_data = [serialize_post(p, request.user) for p in posts]

        return JsonResponse({
            "user": serialize_user(user),
            "followers_count": followers_count,
            "following_count": following_count,
            "is_following": is_following,
            "posts": posts_data
        })

    elif request.method == 'POST':
        if not request.user.is_authenticated or request.user != user:
            return JsonResponse({"error": "Unauthorized"}, status=401)
        try:
            data = json.loads(request.body)
            profile = user.profile
            
            # Edit bio, location, or avatar
            if "bio" in data:
                profile.bio = data.get("bio", "").strip()
            if "location" in data:
                profile.location = data.get("location", "").strip()
            if "avatar_url" in data:
                avatar = data.get("avatar_url", "").strip()
                if avatar:
                    profile.avatar_url = avatar
            
            # Optionally edit full name
            if "full_name" in data:
                full_name = data.get("full_name", "").strip()
                names = full_name.split(" ", 1)
                user.first_name = names[0] if len(names) > 0 else ""
                user.last_name = names[1] if len(names) > 1 else ""
                user.save()

            profile.save()
            return JsonResponse({
                "message": "Profile updated successfully",
                "user": serialize_user(user)
            })

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def follow_toggle_view(request, username):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)

    try:
        user_to_follow = User.objects.get(username=username)
        if user_to_follow == request.user:
            return JsonResponse({"error": "You cannot follow yourself"}, status=400)

        follow_qs = Follow.objects.filter(follower=request.user, following=user_to_follow)

        if follow_qs.exists():
            follow_qs.delete()
            following = False
        else:
            Follow.objects.create(follower=request.user, following=user_to_follow)
            following = True

        followers_count = Follow.objects.filter(following=user_to_follow).count()

        return JsonResponse({
            "following": following,
            "followers_count": followers_count
        })

    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def search_users_view(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    query = request.GET.get("query", "").strip()
    if not query:
        return JsonResponse([], safe=False)

    users = User.objects.filter(Q(username__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query)).exclude(id=request.user.id)
    data = [serialize_user(u) for u in users]
    return JsonResponse(data, safe=False)
