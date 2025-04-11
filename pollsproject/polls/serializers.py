from rest_framework import serializers
from .models import Survey, Question, Choice, Answer  
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
        fields = ['question', 'choice', 'text_answer']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']