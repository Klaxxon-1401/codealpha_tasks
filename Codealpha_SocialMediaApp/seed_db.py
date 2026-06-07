import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from social.models import UserProfile, Post, Comment, Like, Follow

def seed_social_data():
    print("Seeding social media database...")

    # Clear existing data to prevent duplicate or stale records
    print("Clearing old database records...")
    Comment.objects.all().delete()
    Like.objects.all().delete()
    Post.objects.all().delete()
    Follow.objects.all().delete()
    UserProfile.objects.all().delete()
    User.objects.all().delete()

    # 1. Create Users & Profiles
    users_data = [
        {
            "username": "alice",
            "email": "alice@example.com",
            "password": "password123",
            "first_name": "Alice",
            "last_name": "Smith",
            "bio": "Graphic designer | Dog lover | Minimalist advocate",
            "location": "New York, NY",
            "avatar_url": "/static/images/avatar_alice.png"
        },
        {
            "username": "bob",
            "email": "bob@example.com",
            "password": "password123",
            "first_name": "Bob",
            "last_name": "Johnson",
            "bio": "Software developer | Tech enthusiast | Coffee addict",
            "location": "San Francisco, CA",
            "avatar_url": "/static/images/avatar_bob.png"
        },
        {
            "username": "clara",
            "email": "clara@example.com",
            "password": "password123",
            "first_name": "Clara",
            "last_name": "Muller",
            "bio": "Photographer and traveler. Captured moments from 30+ countries.",
            "location": "Berlin, Germany",
            "avatar_url": "/static/images/avatar_clara.png"
        }
    ]

    users = {}
    for u_data in users_data:
        user, created = User.objects.get_or_create(
            username=u_data["username"],
            defaults={
                "email": u_data["email"],
                "first_name": u_data["first_name"],
                "last_name": u_data["last_name"]
            }
        )
        if created:
            user.set_password(u_data["password"])
            user.save()
            print(f"Created user: {user.username}")
        else:
            print(f"User already exists: {user.username}")

        # Update profile (profile is auto-created by django signal)
        profile = user.profile
        profile.bio = u_data["bio"]
        profile.location = u_data["location"]
        profile.avatar_url = u_data["avatar_url"]
        profile.save()
        
        users[user.username] = user

    # 2. Create Follows
    print("Setting up follows...")
    # Alice follows Bob & Clara
    Follow.objects.get_or_create(follower=users["alice"], following=users["bob"])
    Follow.objects.get_or_create(follower=users["alice"], following=users["clara"])
    # Bob follows Alice
    Follow.objects.get_or_create(follower=users["bob"], following=users["alice"])
    # Clara follows Alice & Bob
    Follow.objects.get_or_create(follower=users["clara"], following=users["alice"])
    Follow.objects.get_or_create(follower=users["clara"], following=users["bob"])

    # 3. Create Posts
    print("Creating posts...")
    posts = []
    
    post1, created = Post.objects.get_or_create(
        user=users["alice"],
        content="Just finished designing the new minimalist layout for my portfolio. Clean lines, dark slate backgrounds, and simple typography. Less is always more!",
    )
    posts.append(post1)
    
    post2, created = Post.objects.get_or_create(
        user=users["bob"],
        content="Spent the morning debugging a race condition in our distributed cache systems. Finally solved it by utilizing standard database atomic transactions. Coffee tastes extra good today!",
    )
    posts.append(post2)

    post3, created = Post.objects.get_or_create(
        user=users["clara"],
        content="Woke up early to capture the golden hour at Brandenburg Gate. The fog was rolling in and the lighting was absolutely magical. Berlin is beautiful.",
    )
    posts.append(post3)

    # 4. Create Likes & Comments
    print("Setting up likes and comments...")
    # Bob and Clara like Alice's post
    Like.objects.get_or_create(post=post1, user=users["bob"])
    Like.objects.get_or_create(post=post1, user=users["clara"])
    
    # Alice likes Bob's post
    Like.objects.get_or_create(post=post2, user=users["alice"])

    # Alice and Bob comment on Clara's post
    Comment.objects.get_or_create(post=post3, user=users["alice"], content="This shot is absolutely stunning, Clara! The lighting is perfect.")
    Comment.objects.get_or_create(post=post3, user=users["bob"], content="Amazing photography! Makes me want to visit Berlin.")

    # Clara replies to Bob
    Comment.objects.get_or_create(post=post3, user=users["clara"], content="Thank you Bob! You should definitely visit, it is a great city.")

    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_social_data()
