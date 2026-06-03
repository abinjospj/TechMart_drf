#  ClickMart - Online Grocery Ordering System

## Overview

ClickMart is a simple e-commerce backend application built using Django REST Framework. It allows customers to browse products, manage their cart, place orders, and track order status.

## Features

### Customer

* User Registration & Login
* View Products
* View Product Details
* Add Products to Cart
* Update Cart Quantity
* Remove Products from Cart
* Place Orders
* View Order History

### Admin

* Add, Update, and Delete Products
* Activate/Deactivate Products
* View All Orders
* Update Order Status

## Tech Stack

* Python
* Django
* Django REST Framework
* PostgreSQL
* Docker
* GitHub Actions
* React.js (Frontend) 

## Installation

```bash
git clone https://github.com/abinjospj/clickmart_drf.git

cd clickmart_drf

pip install -r requirements.txt

python manage.py migrate

python manage.py createsuperuser

python manage.py runserver
```

## Order Status Flow

```text
Pending → Confirmed → Delivered
```

## Future Improvements

* Wishlist
* Product Reviews
* Online Payments
* Inventory Management

## Author

**Abin Jos**

GitHub: https://github.com/abinjospj
