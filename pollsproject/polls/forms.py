from django import forms
from django.forms import formset_factory, BaseFormSet
from .models import Survey, Question, Choice

class SurveyForm(forms.ModelForm):
    class Meta:
        model = Survey
        fields = ['title']
        labels = {'title': 'Название опроса'}
        widgets = {'title': forms.TextInput(attrs={'class': 'form-control'})}

class QuestionForm(forms.ModelForm):
    class Meta:
        model = Question
        fields = ['text', 'question_type']
        labels = {'text': 'Текст вопроса', 'question_type': 'Тип вопроса'}
        widgets = {
            'text': forms.TextInput(attrs={'class': 'form-control'}),
            'question_type': forms.Select(attrs={'class': 'form-control'}),
        }


class ChoiceForm(forms.ModelForm):
    class Meta:
        model = Choice
        fields = ['text']
        labels = {'text': 'Вариант ответа'}
        widgets = {'text': forms.TextInput(attrs={'class': 'form-control'})}

QuestionFormSet = formset_factory(QuestionForm, extra=0, can_delete=True)

class BaseChoiceFormSet(BaseFormSet):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.can_delete = True

ChoiceFormSet = formset_factory(ChoiceForm, formset=BaseChoiceFormSet, extra=1, can_delete=True)