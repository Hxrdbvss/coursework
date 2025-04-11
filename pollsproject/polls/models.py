from django.db import models
from django.contrib.auth.models import User
from django.db.models import JSONField

class Survey(models.Model):
    title = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return self.title

class Question(models.Model):
    QUESTION_TYPES = (
        ('radio', 'Radio'),
        ('checkbox', 'Checkbox'),
        ('text', 'Text'),
        ('rating', 'Rating'),
        ('yesno', 'Yes/No'),
        ('ranking', 'Ranking'),
    )
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='questions')
    text = models.CharField(max_length=200, blank=True)  # Разрешаем пустые строки
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)

    def __str__(self):
        return self.text

    def clean(self):
        if not self.text.strip():
            raise ValidationError("Текст вопроса не может быть пустым")

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
    rating_answer = models.IntegerField(null=True, blank=True)  
    yesno_answer = models.BooleanField(null=True, blank=True)  
    ranking_answer = JSONField(null=True, blank=True)         
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"Answer to {self.question} by {self.user}"

    def clean(self):
        if self.question.question_type == 'radio' and not self.choice:
            raise ValidationError("Для вопроса с типом 'radio' требуется выбрать вариант ответа")
        elif self.question.question_type == 'rating' and (self.rating_answer is None or self.rating_answer < 1 or self.rating_answer > 5):
            raise ValidationError("Рейтинг должен быть числом от 1 до 5")
        elif self.question.question_type == 'ranking' and not isinstance(self.ranking_answer, list):
            raise ValidationError("Для ранжирования требуется список вариантов")