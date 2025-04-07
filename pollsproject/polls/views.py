from django.shortcuts import render, get_object_or_404, redirect
from django.forms import formset_factory
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login
from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.decorators import api_view
from .models import Survey, Question, Choice, Answer
from .forms import QuestionFormSet, ChoiceFormSet
from .serializers import SurveySerializer, AnswerSerializer, UserSerializer

class SubmitAnswers(generics.CreateAPIView):
    serializer_class = AnswerSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        survey_id = self.kwargs['survey_id']
        survey = get_object_or_404(Survey, pk=survey_id)
        if not survey.is_active:
            return Response({"detail": "Survey is not active"}, status=status.HTTP_400_BAD_REQUEST)

        answers_data = request.data  # Ожидаем список ответов
        for answer_data in answers_data:
            answer_data['survey'] = survey_id
            answer_data['user'] = request.user.id
            serializer = self.get_serializer(data=answer_data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
        return Response({"message": "Ответы сохранены"}, status=status.HTTP_201_CREATED)


class SurveyList(generics.ListAPIView):
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer
    permission_classes = [IsAuthenticated]  # Требуем авторизацию

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        user_serializer = UserSerializer(request.user)  # Сериализуем текущего пользователя
        return Response({
            'surveys': serializer.data,
            'user': user_serializer.data
        })

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

class SurveyCreate(generics.CreateAPIView):
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class SurveyDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer
    permission_classes = [IsAuthenticated]

    def put(self, request, *args, **kwargs):
        if self.get_object().author != request.user:
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        return super().put(request, *args, **kwargs)

class SurveyEdit(generics.RetrieveUpdateAPIView):
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        serializer.save(author=self.request.user)

@api_view(['POST'])
def add_questions(request, survey_id):
    survey = get_object_or_404(Survey, pk=survey_id)
    if survey.author != request.user:
        return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
    
    for q_data in request.data:
        question = Question.objects.create(
            survey=survey,
            text=q_data['text'],
            question_type=q_data['question_type']
        )
        for choice_text in q_data.get('choices', []):
            if choice_text:
                Choice.objects.create(question=question, text=choice_text)
    return Response({"detail": "Questions added"}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def profile_view(request, username):
    user = get_object_or_404(User, username=username)
    surveys = Survey.objects.filter(questions__answers__user=user).distinct()
    return Response({
        "user": {
            "username": user.username,
            "full_name": user.get_full_name(),
            "date_joined": user.date_joined,
            "is_staff": user.is_staff
        },
        "surveys": SurveySerializer(surveys, many=True).data
    })

@api_view(['POST'])
def submit_answers(request, survey_id):
    survey = get_object_or_404(Survey, pk=survey_id)
    if not survey.is_active:
        return Response({"detail": "Survey is not active"}, status=status.HTTP_400_BAD_REQUEST)
    
    for answer_data in request.data:
        question = get_object_or_404(Question, pk=answer_data['question'], survey=survey)
        if question.question_type == 'radio':
            choice = get_object_or_404(Choice, pk=answer_data['choice'], question=question)
            Answer.objects.create(question=question, choice=choice, user=request.user)
        elif question.question_type == 'checkbox':
            for choice_id in answer_data['choices']:
                choice = get_object_or_404(Choice, pk=choice_id, question=question)
                Answer.objects.create(question=question, choice=choice, user=request.user)
        elif question.question_type == 'text':
            Answer.objects.create(question=question, text_answer=answer_data['text_answer'], user=request.user)
        elif question.question_type == 'rating':
            Answer.objects.create(question=question, rating_answer=answer_data['rating_answer'], user=request.user)
        elif question.question_type == 'yesno':
            Answer.objects.create(question=question, yesno_answer=answer_data['yesno_answer'], user=request.user)
        elif question.question_type == 'ranking':
            Answer.objects.create(question=question, ranking_answer=answer_data['ranking_answer'], user=request.user)
    return Response({"detail": "Answers submitted"}, status=status.HTTP_201_CREATED)

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