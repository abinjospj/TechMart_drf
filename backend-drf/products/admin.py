from django.contrib import admin
from .models import Product

class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'price', 'stock', 'is_active']



admin.site.register(Product, ProductAdmin)