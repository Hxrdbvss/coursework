from django.shortcuts import render, get_object_or_404, redirect
from django.forms import formset_factory
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login
from django.contrib.auth.models import User
from rest_framework import generics
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.views import ObtainAuthToken
from .models import Survey, Question, Choice, Answer
from .forms import QuestionFormSet, ChoiceFormSet
from .serializers import SurveySerializer, UserSerializer


# Вспомогательная функция для сохранения ответов в detail
def save_answer(question, request, user):
    if question.question_type == 'radio':
        choice_id = request.POST.get(f'question_{question.id}')
        if choice_id:
            choice = get_object_or_404(Choice, pk=choice_id, question=question)
            Answer.objects.create(question=question, choice=choice, user=user)
        else:
            return f'Выберите вариант для "{question.text}"'
    elif question.question_type == 'checkbox':
        choice_ids = request.POST.getlist(f'question_{question.id}')
        if choice_ids:
            for choice_id in choice_ids:
                choice = get_object_or_404(Choice, pk=choice_id, question=question)
                Answer.objects.create(question=question, choice=choice, user=user)
        else:
            return f'Выберите хотя бы один вариант для "{question.text}"'
    elif question.question_type == 'text':
        text_answer = request.POST.get(f'question_{question.id}')
        if text_answer and text_answer.strip():
            Answer.objects.create(question=question, text_answer=text_answer, user=user)
        else:
            return f'Введите текст для "{question.text}"'
    elif question.question_type == 'rating':
        rating = request.POST.get(f'question_{question.id}')
        if rating and rating.isdigit() and 1 <= int(rating) <= 10:
            Answer.objects.create(question=question, user=user, rating_answer=int(rating))
        else:
            return f'Выберите оценку от 1 до 10 для "{question.text}"'
    elif question.question_type == 'yesno':
        yesno = request.POST.get(f'question_{question.id}')
        if yesno in ['yes', 'no']:
            Answer.objects.create(question=question, user=user, yesno_answer=(yesno == 'yes'))
        else:
            return f'Выберите "Да" или "Нет" для "{question.text}"'
    elif question.question_type == 'ranking':
        ranking = request.POST.getlist(f'question_{question.id}')
        if ranking and len(ranking) == question.choices.count():
            Answer.objects.create(
                question=question,
                user=user,
                ranking_answer=[int(choice_id) for choice_id in ranking]
            )
        else:
            return f'Расставьте все варианты для "{question.text}"'
    return None


# API-представления
class SurveyList(generics.ListAPIView):
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer
    permission_classes = [AllowAny]  # Можно заменить на IsAuthenticated


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            login(request, user)  # Автоматический вход для сессии
            return Response({'token': token.key, 'user_id': user.id, 'username': user.username})
        return Response(serializer.errors, status=400)


class LoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        login(request, user)  # Автоматический вход для сессии
        return Response({'token': token.key, 'user_id': user.id, 'username': user.username})


# Обычные представления
def index(request):
    surveys = Survey.objects.all()  # Можно добавить .filter(is_active=True)
    return render(request, 'polls/index.html', {'surveys': surveys})


def detail(request, survey_id):
    survey = get_object_or_404(Survey, pk=survey_id)
    user_answers = Answer.objects.filter(question__survey=survey, user=request.user) if request.user.is_authenticated else None

    # Подготовка данных для отображения ответов
    answers_with_ranking = []
    if user_answers:
        for answer in user_answers:
            answer_data = {'answer': answer}
            if answer.question.question_type == 'ranking' and answer.ranking_answer:
                ranked_choices = [answer.question.choices.get(id=choice_id).text for choice_id in answer.ranking_answer]
                answer_data['ranked_choices'] = ranked_choices
            answers_with_ranking.append(answer_data)

    context = {
        'survey': survey,
        'user_answers': answers_with_ranking,
    }

    if request.method == 'POST' and not user_answers and survey.is_active:
        if not request.POST:
            context['error_message'] = 'Форма пуста'
            return render(request, 'polls/detail.html', context)

        questions = survey.questions.all()
        for question in questions:
            error = save_answer(question, request, request.user)
            if error:
                context['error_message'] = error
                return render(request, 'polls/detail.html', context)

        context['show_thanks'] = True

    return render(request, 'polls/detail.html', context)


def create_survey(request):
    if request.method == 'POST':
        title = request.POST.get('title')
        if not title:
            return render(request, 'polls/create_survey.html', {'error': 'Введите название опроса'})

        survey = Survey.objects.create(title=title, author=request.user if request.user.is_authenticated else None)
        
        # Используем formset-подход для вопросов
        question_formset = QuestionFormSet(request.POST, prefix='questions')
        if question_formset.is_valid():
            for question_form in question_formset:
                if question_form.cleaned_data and not question_form.cleaned_data.get('DELETE', False):
                    question = question_form.save(commit=False)
                    question.survey = survey
                    question.save()
                    if question.question_type in ['radio', 'checkbox', 'ranking']:
                        choice_formset = ChoiceFormSet(request.POST, prefix=f'choices-{question_form.prefix}')
                        if choice_formset.is_valid():
                            for choice_form in choice_formset:
                                if choice_form.cleaned_data and not choice_form.cleaned_data.get('DELETE', False):
                                    choice = choice_form.save(commit=False)
                                    choice.question = question
                                    choice.save()
            return redirect('polls:index')
        else:
            return render(request, 'polls/create_survey.html', {'question_formset': question_formset, 'title': title})

    question_formset = QuestionFormSet(prefix='questions')
    return render(request, 'polls/create_survey.html', {'question_formset': question_formset})


def add_questions(request, survey_id):
    survey = get_object_or_404(Survey, pk=survey_id)
    
    if request.method == 'POST':
        question_formset = QuestionFormSet(request.POST, prefix='questions')
        if question_formset.is_valid():
            has_valid_forms = False
            for question_form in question_formset:
                if question_form.cleaned_data and not question_form.cleaned_data.get('DELETE', False):
                    has_valid_forms = True
                    question = question_form.save(commit=False)
                    question.survey = survey
                    question.save()
                    if question.question_type in ['radio', 'checkbox', 'ranking']:
                        choice_formset = ChoiceFormSet(request.POST, prefix=f'choices-{question_form.prefix}')
                        if choice_formset.is_valid():
                            for choice_form in choice_formset:
                                if choice_form.cleaned_data and not choice_form.cleaned_data.get('DELETE', False):
                                    choice = choice_form.save(commit=False)
                                    choice.question = question
                                    choice.save()
            if not has_valid_forms:
                return render(request, 'polls/add_questions.html', {
                    'survey': survey,
                    'question_formset': question_formset,
                    'error': 'Добавьте хотя бы один вопрос'
                })
            return redirect('polls:index')
    else:
        question_formset = QuestionFormSet(prefix='questions')

    choice_formsets = [ChoiceFormSet(prefix=f'choices-questions-{i}') for i in range(question_formset.total_form_count())]
    return render(request, 'polls/add_questions.html', {
        'survey': survey,
        'question_formset': question_formset,
        'choice_formsets': choice_formsets,
    })


def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('polls:index')
    else:
        form = UserCreationForm()
    return render(request, 'polls/register.html', {'form': form})


def profile(request, username):
    profile = get_object_or_404(User, username=username)
    user_answers = Answer.objects.filter(user=profile).select_related('question__survey')
    surveys = Survey.objects.filter(questions__answers__user=profile).distinct()
    context = {
        'profile': profile,
        'surveys': surveys,
    }
    return render(request, 'polls/profile.html', context)


def edit(request, survey_id):
    survey = get_object_or_404(Survey, pk=survey_id)
    if request.user != survey.author and request.user.is_authenticated:  # Проверка прав
        return redirect('polls:index')

    if request.method == 'POST':
        if 'delete_survey' in request.POST:
            survey.delete()
            return redirect('polls:index')

        survey_form = SurveyForm(request.POST, instance=survey)
        question_formset = QuestionFormSet(request.POST, prefix='questions', queryset=survey.questions.all())

        if survey_form.is_valid() and question_formset.is_valid():
            survey_form.save()
            for question_form in question_formset:
                if question_form.cleaned_data and not question_form.cleaned_data.get('DELETE', False):
                    question = question_form.save(commit=False)
                    question.survey = survey
                    question.save()
                    if question.question_type in ['radio', 'checkbox', 'ranking']:
                        choice_formset = ChoiceFormSet(request.POST, prefix=f'choices-{question_form.prefix}', queryset=question.choices.all())
                        if choice_formset.is_valid():
                            for choice_form in choice_formset:
                                if choice_form.cleaned_data and not choice_form.cleaned_data.get('DELETE', False):
                                    choice = choice_form.save(commit=False)
                                    choice.question = question
                                    choice.save()
            return redirect('polls:index')
    else:
        survey_form = SurveyForm(instance=survey)
        question_formset = QuestionFormSet(prefix='questions', queryset=survey.questions.all())

    choice_formsets = [ChoiceFormSet(prefix=f'choices-questions-{i}', queryset=Question.objects.get(id=form.instance.id).choices.all() if form.instance.id else ChoiceFormSet().queryset) for i, form in enumerate(question_formset)]
    return render(request, 'polls/edit.html', {
        'survey': survey,
        'survey_form': survey_form,
        'question_formset': question_formset,
        'choice_formsets': choice_formsets,
    })