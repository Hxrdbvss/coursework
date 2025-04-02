from django.contrib import admin
from .models import Survey, Question, Choice, Answer

@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ('title', 'id')  # Отображаем название и ID опроса
    search_fields = ('title',)      # Поиск по названию

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'survey', 'question_type', 'id')  # Отображаем текст, опрос, тип и ID
    list_filter = ('question_type', 'survey')                # Фильтры по типу и опросу
    search_fields = ('text',)                                # Поиск по тексту

@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ('text', 'question', 'id')  # Отображаем текст, вопрос и ID
    list_filter = ('question',)                # Фильтр по вопросу
    search_fields = ('text',)                  # Поиск по тексту

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('question', 'choice', 'text_answer', 'id')  # Отображаем вопрос, выбор, текстовый ответ и ID
    list_filter = ('question',)                                 # Фильтр по вопросу