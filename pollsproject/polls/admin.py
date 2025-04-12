from django.contrib import admin
from .models import Survey, Question, Choice, Answer

@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ['title', 'is_active', 'author']
    list_filter = ['is_active', 'author']
    search_fields = ['title']

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['text', 'survey', 'question_type']
    list_filter = ['survey', 'question_type']
    search_fields = ['text']

@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ['text', 'question']
    list_filter = ['question']
    search_fields = ['text']

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ['survey', 'user', 'question', 'get_answer_display', 'submitted_at']
    list_filter = ['survey', 'user', 'question__question_type']
    search_fields = ['text_answer', 'user__username', 'question__text']

    def get_answer_display(self, obj):
        """Возвращает строковое представление ответа в зависимости от типа вопроса."""
        question_type = obj.question.question_type
        if question_type == 'text':
            return obj.text_answer or '-'
        elif question_type in ('radio', 'checkbox'):
            return obj.choice.text if obj.choice else '-'
        elif question_type == 'ranking':
            return str(obj.ranking_answer) if obj.ranking_answer else '-'
        elif question_type == 'rating':
            return str(obj.rating_answer) if obj.rating_answer is not None else '-'
        elif question_type == 'yesno':
            return 'Да' if obj.yesno_answer else 'Нет' if obj.yesno_answer is not None else '-'
        return '-'

    get_answer_display.short_description = 'Ответ'