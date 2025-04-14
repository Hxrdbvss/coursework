from rest_framework import serializers
from .models import Survey, Question, Choice, Answer  # Добавлен Answer
from django.contrib.auth.models import User

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text']

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'choices']

    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        question = Question.objects.create(**validated_data)
        for choice_data in choices_data:
            Choice.objects.create(question=question, **choice_data)
        return question

class SurveySerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)

    class Meta:
        model = Survey
        fields = ['id', 'title', 'is_active', 'questions']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['questions'] = QuestionSerializer(instance.questions.all(), many=True).data
        return representation

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        survey = Survey.objects.create(**validated_data)
        for question_data in questions_data:
            question_data['survey'] = survey
            QuestionSerializer().create(question_data)
        return survey

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)
        instance.title = validated_data.get('title', instance.title)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        instance.save()

        if questions_data is not None:
            instance.questions.all().delete()
            for question_data in questions_data:
                question_data['survey'] = instance
                QuestionSerializer().create(question_data)
        return instance

class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = [
            'survey', 'user', 'question', 'choice',
            'text_answer', 'ranking_answer', 'rating_answer', 'yesno_answer',
            'submitted_at'
        ]
        read_only_fields = ['submitted_at']

    def validate(self, data):
        question = data['question']
        if question.survey != data['survey']:
            raise serializers.ValidationError("Вопрос не относится к этому опросу")

        question_type = question.question_type
        if question_type == 'text' and not data.get('text_answer'):
            raise serializers.ValidationError("Текстовый ответ обязателен")
        elif question_type == 'radio' and not data.get('choice'):
            raise serializers.ValidationError("Выбор обязателен для вопросов с одним вариантом")
        elif question_type == 'checkbox' and not data.get('choice'):
            raise serializers.ValidationError("Выбор обязателен для вопросов с множественным выбором")
        elif question_type == 'ranking' and not data.get('ranking_answer'):
            raise serializers.ValidationError("Ранжирование обязательно")
        elif question_type == 'rating' and not data.get('rating_answer'):
            raise serializers.ValidationError("Оценка обязательна")
        elif question_type == 'yesno' and data.get('yesno_answer') is None:
            raise serializers.ValidationError("Ответ 'Да/Нет' обязателен")
        
        return data

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name']
        extra_kwargs = {
            'username': {'read_only': True},  
            'id': {'read_only': True},
        }

    def get_full_name(self, obj):
        return obj.get_full_name() or None