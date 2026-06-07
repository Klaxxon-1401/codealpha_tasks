# CodeAlpha Internship - Full Stack Development

This repository contains the tasks completed during the CodeAlpha Full Stack Development Internship.

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

### Local Setup Instructions

#### First-Time Setup
1. Open PowerShell and navigate to the project directory:
   ```powershell
   cd "C:\codealpha_tasks\Codealpha_SimpleEcommerceStore"
   ```
2. Create a local virtual environment:
   ```powershell
   python -m venv venv
   ```
3. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\activate
   ```
4. Install the required dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
5. Start the development server:
   ```powershell
   python manage.py runserver
   ```
6. Open the application in a browser:
   `http://127.0.0.1:8000`

#### Running Subsequently
Once setup is complete, you can start the application with:
```powershell
cd "C:\codealpha_tasks\Codealpha_SimpleEcommerceStore"
.\venv\Scripts\activate
python manage.py runserver
```

### Test Account Credentials
An account is seeded in the database for testing:
- **Username**: `devan`
- **Password**: `password123`
- **Email**: `devan@example.com`

*(New user accounts can also be created via the registration form).*
