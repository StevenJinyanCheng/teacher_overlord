from rest_framework import serializers
from .models import CustomUser, Grade, SchoolClass, UserRole # Add UserRole
from .permissions import IsSystemAdmin

class UserSerializer(serializers.ModelSerializer):
    # Make role human-readable on GET, but accept the internal value on POST/PUT
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    role = serializers.ChoiceField(choices=UserRole.choices) # Now UserRole is defined

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

class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = ['id', 'name']

# Serializer for SchoolClass
class SchoolClassSerializer(serializers.ModelSerializer):
    grade_id = serializers.PrimaryKeyRelatedField(
        queryset=Grade.objects.all(), 
        source='grade', 
        write_only=True,
        label='Grade' # Add a label for better browsable API rendering
    )
    grade_name = serializers.CharField(source='grade.name', read_only=True)
    # Ensure name is present for validation logic
    name = serializers.CharField(max_length=100)

    class Meta:
        model = SchoolClass
        fields = ['id', 'name', 'grade_id', 'grade_name']

    def validate(self, data):
        grade = data.get('grade') # This will be the Grade instance due to source='grade' on grade_id
        name = data.get('name')

        # Instance being updated
        instance = self.instance

        if grade and name:
            queryset = SchoolClass.objects.filter(grade=grade, name=name)
            if instance:
                queryset = queryset.exclude(pk=instance.pk)
            if queryset.exists():
                raise serializers.ValidationError(
                    {"detail": f"The class name '{name}' already exists in grade '{grade.name}'."}
                )
        return data
