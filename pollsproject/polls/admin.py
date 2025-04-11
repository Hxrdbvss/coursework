from django.contrib import admin
from .models import Survey, Question, Choice, Answer

@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ('title', 'id')  
    search_fields = ('title',)      

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'survey', 'question_type', 'id')   
    list_filter = ('question_type', 'survey')              
    search_fields = ('text',)                              

@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ('text', 'question', 'id') 
    list_filter = ('question',)               
    search_fields = ('text',)                 
@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('question', 'choice', 'text_answer', 'id')  
    list_filter = ('question',)                                 