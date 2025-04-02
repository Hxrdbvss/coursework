from django.db import models
from django.contrib.auth.models import User
from django.db.models import JSONField

class Survey(models.Model):
    title = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title

class Question(models.Model):
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='questions')
    text = models.CharField(max_length=200)
    question_type = models.CharField(max_length=10, choices=[
        ('radio', 'Radio'),
        ('checkbox', 'Checkbox'),
        ('text', 'Text'),
        ('rating', 'Rating'),    # Новый тип: шкала оценки
        ('yesno', 'Yes/No'),     # Новый тип: да/нет
        ('ranking', 'Ranking'),  # Новый тип: ранжирование
    ])

    def __str__(self):
        return self.text

class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=200)

    def __str__(self):
        return self.text

class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    choice = models.ForeignKey(Choice, on_delete=models.CASCADE, null=True, blank=True)
    text_answer = models.TextField(null=True, blank=True)
    rating_answer = models.IntegerField(null=True, blank=True)  # Для Rating
    yesno_answer = models.BooleanField(null=True, blank=True)  # Для Yes/No
    ranking_answer = JSONField(null=True, blank=True)          # Для Ranking (список ID вариантов)

    def __str__(self):
        return f"Answer to {self.question} by {self.user}"