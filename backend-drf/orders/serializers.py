from rest_framework import serializers
from .models import OrderItem, Order

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    class Meta:
        model = OrderItem
        fields = ['product_name', 'quantity', 'price', 'total_price']



class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(source='orderitem_set',many=True,read_only=True)
    class Meta:
        model = Order
        fields = '__all__'