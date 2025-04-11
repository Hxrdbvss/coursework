from rest_framework import serializers
from .models import Survey, Question, Choice, Answer
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text']

class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ['id', 'user', 'survey', 'question', 'choice', 'text_answer', 'rating_answer', 'yesno_answer', 'ranking_answer', 'created_at']

class QuestionSerializer(serializers.ModelSerializer):
    choices = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        default=[]
    )
    choices_display = serializers.SerializerMethodField(source='choices')

    text = serializers.CharField(allow_blank=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'choices', 'choices_display']
        extra_kwargs = {'choices_display': {'read_only': True}}

    def get_choices_display(self, obj):
        return [choice.text for choice in obj.choices.all()]

    def validate(self, data):
        valid_types = [choice[0] for choice in Question._meta.get_field('question_type').choices]
        if data['question_type'] not in valid_types:
            raise serializers.ValidationError(f"Недопустимый тип вопроса: {data['question_type']}. Допустимые значения: {valid_types}")
        if data['question_type'] in ['radio', 'checkbox', 'ranking'] and not data.get('choices', []):
            raise serializers.ValidationError("Для типов 'radio', 'checkbox' или 'ranking' требуется хотя бы один вариант ответа")
        return data

    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        question = Question.objects.create(**validated_data)
        for choice_text in choices_data:
            if choice_text:
                Choice.objects.create(question=question, text=choice_text)
        return question

class SurveySerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)
    author = UserSerializer(read_only=True)

    class Meta:
        model = Survey
        fields = ['id', 'title', 'is_active', 'questions', 'author']

    def validate(self, data):
        print("SurveySerializer validate data:", data)
        if not data.get('title'):
            raise serializers.ValidationError("Название опроса не может быть пустым")
        if not data.get('questions'):
            raise serializers.ValidationError("Опрос должен содержать хотя бы один вопрос")
        return data

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

        if questions_data:
            instance.questions.all().delete()
            for question_data in questions_data:
                question_data['survey'] = instance
                QuestionSerializer().create(question_data)
        return instance