from rest_framework import serializers
from .models import CustomUser, UserRole

class UserSerializer(serializers.ModelSerializer):
    # Make role human-readable on GET, but accept the internal value on POST/PUT
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    role = serializers.ChoiceField(choices=UserRole.choices)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 
            'role', 'role_display', 'is_active', 'is_staff', 'date_joined'
        )
        read_only_fields = ('date_joined', 'role_display')

    def create(self, validated_data):
        # Handle password creation separately to ensure it's hashed
        user = CustomUser.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        # Handle password update if provided
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)
