from django.db import models
from django.contrib.auth.models import User
from django.db.models import JSONField

class Survey(models.Model):
    title = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='surveys')

    def __str__(self):
        return self.title

class Question(models.Model):
    QUESTION_TYPES = (
        ('radio', 'Один выбор'),
        ('checkbox', 'Множественный выбор'),
        ('text', 'Текстовый ответ'),
        ('rating', 'Шкала оценки'),
        ('yesno', 'Да/Нет'),
        ('ranking', 'Ранжирование'),
    )
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='questions')
    text = models.CharField(max_length=500)
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)

    def __str__(self):
        return self.text

class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=200)

    def __str__(self):
        return self.text
        
class Answer(models.Model):
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='answers')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    choice = models.ForeignKey(Choice, on_delete=models.CASCADE, null=True, blank=True)
    text_answer = models.TextField(null=True, blank=True)
    ranking_answer = models.JSONField(null=True, blank=True)
    rating_answer = models.IntegerField(null=True, blank=True)
    yesno_answer = models.BooleanField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Answer to {self.question} by {self.user} in {self.survey}"

    class Meta:
        unique_together = ('user', 'question')