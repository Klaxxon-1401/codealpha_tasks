import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from store.models import Product

def seed_products():
    products = [
        {
            "name": "Wireless ANC Headphones",
            "description": "Premium noise-canceling headphones with 40-hour battery life, immersive soundstage, and ultra-soft memory foam earcups for ultimate comfort.",
            "price": 199.99,
            "image_url": "/static/images/wireless_headphones.png",
            "category": "Audio",
            "stock": 15
        },
        {
            "name": "Premium Smart Watch",
            "description": "Track your fitness, heart rate, and sleep with this sleek, water-resistant smartwatch featuring an always-on AMOLED display and 7-day battery life.",
            "price": 299.99,
            "image_url": "/static/images/smart_watch.png",
            "category": "Wearables",
            "stock": 10
        },
        {
            "name": "Mechanical Keyboard",
            "description": "Tactile, responsive typing experience with hot-swappable mechanical switches, custom keycaps, and white backlight.",
            "price": 129.99,
            "image_url": "/static/images/mechanical_keyboard.png",
            "category": "Accessories",
            "stock": 20
        },
        {
            "name": "Minimalist Desk Lamp",
            "description": "Adjustable brightness and color temperature with an elegant aluminum neck. Modern touch controls and integrated USB-C charging port.",
            "price": 79.99,
            "image_url": "/static/images/desk_lamp.png",
            "category": "Home",
            "stock": 8
        },
        {
            "name": "Ceramic Travel Coffee Mug",
            "description": "Double-wall insulated ceramic body keeps your brew hot for 4 hours. Spill-resistant lid with a matte, non-slip textured finish.",
            "price": 24.99,
            "image_url": "/static/images/coffee_mug.png",
            "category": "Kitchen",
            "stock": 50
        },
        {
            "name": "Ergonomic Waterproof Backpack",
            "description": "Durable, weather-resistant nylon backpack with a dedicated padded 16-inch laptop compartment and hidden anti-theft pockets.",
            "price": 89.99,
            "image_url": "/static/images/backpack.png",
            "category": "Travel",
            "stock": 12
        }
    ]

    print("Seeding products into database...")
    for p_data in products:
        product, created = Product.objects.get_or_create(
            name=p_data["name"],
            defaults={
                "description": p_data["description"],
                "price": p_data["price"],
                "image_url": p_data["image_url"],
                "category": p_data["category"],
                "stock": p_data["stock"]
            }
        )
        if created:
            print(f"Created product: {product.name}")
        else:
            # Update values if it exists
            product.description = p_data["description"]
            product.price = p_data["price"]
            product.image_url = p_data["image_url"]
            product.category = p_data["category"]
            product.stock = p_data["stock"]
            product.save()
            print(f"Updated product: {product.name}")
            
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_products()
