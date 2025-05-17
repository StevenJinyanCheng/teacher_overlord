from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import CustomUser, Grade, SchoolClass, RuleChapter, RuleDimension, RuleSubItem # Added Rule models

# Define SchoolClassSerializer before UserSerializer
class SchoolClassSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source='grade.name', read_only=True)

    class Meta:
        model = SchoolClass
        fields = ['id', 'name', 'grade', 'grade_name']

class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = ['id', 'name', 'description']

class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    # Use the now defined SchoolClassSerializer
    school_class_details = SchoolClassSerializer(source='school_class', read_only=True)
    school_class = serializers.PrimaryKeyRelatedField(
        queryset=SchoolClass.objects.all(),
        allow_null=True,
        required=False,
        # Ensure this field is not written when school_class_details is used for representation
        # but it should be writeable for input
    )

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display',
            'school_class', # ID for writing
            'school_class_details', # Nested object for reading
            'password'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
        }

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data.get('password'))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        # If 'school_class' is explicitly passed (even as None), update it.
        # If it's not in validated_data, school_class remains unchanged.
        if 'school_class' in validated_data:
            instance.school_class = validated_data.pop('school_class', instance.school_class)
        elif self.partial and 'school_class' not in validated_data:
            # For PATCH requests, if school_class is not provided, do not change it.
            pass # school_class remains instance.school_class
        else:
            # For PUT requests where school_class is not provided, it implies unsetting it (if nullable)
            instance.school_class = None 

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)
        
        instance.save()
        return instance

class RuleSubItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RuleSubItem
        fields = ['id', 'name', 'description', 'dimension', 'max_score']

class RuleDimensionSerializer(serializers.ModelSerializer):
    sub_items = RuleSubItemSerializer(many=True, read_only=True, source='rulesubitem_set') # For nested listing

    class Meta:
        model = RuleDimension
        fields = ['id', 'name', 'description', 'chapter', 'sub_items']

class RuleChapterSerializer(serializers.ModelSerializer):
    dimensions = RuleDimensionSerializer(many=True, read_only=True, source='ruledimension_set') # For nested listing

    class Meta:
        model = RuleChapter
        fields = ['id', 'name', 'description', 'dimensions']
