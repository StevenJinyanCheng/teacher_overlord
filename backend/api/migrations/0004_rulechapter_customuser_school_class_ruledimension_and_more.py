# Generated by Django 5.2.1 on 2025-05-17 07:12

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_schoolclass'),
    ]

    operations = [
        migrations.CreateModel(
            name='RuleChapter',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, unique=True)),
                ('description', models.TextField(blank=True)),
                ('order', models.PositiveIntegerField(default=0, help_text='Order in which chapters are displayed')),
            ],
            options={
                'ordering': ['order', 'name'],
            },
        ),
        migrations.AddField(
            model_name='customuser',
            name='school_class',
            field=models.ForeignKey(blank=True, help_text='The class a student belongs to, if applicable.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='students', to='api.schoolclass'),
        ),
        migrations.CreateModel(
            name='RuleDimension',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text="A core dimension, e.g., 'Respect and Courtesy'", max_length=200)),
                ('description', models.TextField(blank=True)),
                ('order', models.PositiveIntegerField(default=0, help_text='Order of dimension within the chapter')),
                ('chapter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='dimensions', to='api.rulechapter')),
            ],
            options={
                'ordering': ['chapter', 'order', 'name'],
                'unique_together': {('chapter', 'name')},
            },
        ),
        migrations.CreateModel(
            name='RuleSubItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text="Specific rule or behavior, e.g., 'Greets teachers and elders'", max_length=255)),
                ('description', models.TextField(blank=True)),
                ('order', models.PositiveIntegerField(default=0, help_text='Order of sub-item within the dimension')),
                ('dimension', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sub_items', to='api.ruledimension')),
            ],
            options={
                'ordering': ['dimension', 'order', 'name'],
                'unique_together': {('dimension', 'name')},
            },
        ),
    ]
