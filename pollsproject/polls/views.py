from django.shortcuts import render, get_object_or_404, redirect
from django.forms import formset_factory
from .models import Survey, Question, Choice, Answer
from .forms import SurveyForm, QuestionFormSet, ChoiceFormSet
from django.contrib.auth.models import User

def index(request):
    surveys = Survey.objects.all()
    if request.method == 'POST' and 'delete_survey' in request.POST:
        survey_id = request.POST.get('survey_id')
        survey = get_object_or_404(Survey, pk=survey_id)
        survey.delete()
        return redirect('polls:index')
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
                # Получаем текст вариантов в порядке ранжирования
                ranked_choices = [answer.question.choices.get(id=choice_id).text for choice_id in answer.ranking_answer]
                answer_data['ranked_choices'] = ranked_choices
            answers_with_ranking.append(answer_data)
    
    context = {
        'survey': survey,
        'user_answers': answers_with_ranking,  # Передаем обновленные данные
    }
    
    if request.method == 'POST' and not user_answers and survey.is_active:
        questions = survey.questions.all()
        for question in questions:
            if question.question_type == 'radio':
                choice_id = request.POST.get(f'question_{question.id}')
                if choice_id:
                    choice = get_object_or_404(Choice, pk=choice_id, question=question)
                    Answer.objects.create(question=question, choice=choice, user=request.user)
                else:
                    context['error_message'] = f'Выберите вариант для "{question.text}"'
                    return render(request, 'polls/detail.html', context)
            elif question.question_type == 'checkbox':
                choice_ids = request.POST.getlist(f'question_{question.id}')
                if choice_ids:
                    for choice_id in choice_ids:
                        choice = get_object_or_404(Choice, pk=choice_id, question=question)
                        Answer.objects.create(question=question, choice=choice, user=request.user)
                else:
                    context['error_message'] = f'Выберите хотя бы один вариант для "{question.text}"'
                    return render(request, 'polls/detail.html', context)
            elif question.question_type == 'text':
                text_answer = request.POST.get(f'question_{question.id}')
                if text_answer and text_answer.strip():
                    Answer.objects.create(question=question, text_answer=text_answer, user=request.user)
                else:
                    context['error_message'] = f'Введите текст для "{question.text}"'
                    return render(request, 'polls/detail.html', context)
            elif question.question_type == 'rating':
                rating = request.POST.get(f'question_{question.id}')
                if rating and rating.isdigit() and 1 <= int(rating) <= 10:
                    Answer.objects.create(question=question, user=request.user, rating_answer=int(rating))
                else:
                    context['error_message'] = f'Выберите оценку от 1 до 10 для "{question.text}"'
                    return render(request, 'polls/detail.html', context)
            elif question.question_type == 'yesno':
                yesno = request.POST.get(f'question_{question.id}')
                if yesno in ['yes', 'no']:
                    Answer.objects.create(question=question, user=request.user, yesno_answer=(yesno == 'yes'))
                else:
                    context['error_message'] = f'Выберите "Да" или "Нет" для "{question.text}"'
                    return render(request, 'polls/detail.html', context)
            elif question.question_type == 'ranking':
                ranking = request.POST.getlist(f'question_{question.id}')
                if ranking and len(ranking) == question.choices.count():
                    Answer.objects.create(
                        question=question,
                        user=request.user,
                        ranking_answer=[int(choice_id) for choice_id in ranking]
                    )
                else:
                    context['error_message'] = f'Расставьте все варианты для "{question.text}"'
                    return render(request, 'polls/detail.html', context)
        
        context['show_thanks'] = True
        return render(request, 'polls/detail.html', context)
    
    return render(request, 'polls/detail.html', context)

def create_survey(request):
    if request.method == 'POST':
        title = request.POST.get('title')
        if not title:
            return render(request, 'polls/create_survey.html', {'error': 'Введите название опроса'})
        
        survey = Survey.objects.create(title=title)
        question_index = 0
        while f'question-{question_index}-text' in request.POST:
            question_text = request.POST.get(f'question-{question_index}-text')
            question_type = request.POST.get(f'question-{question_index}-type')
            if question_text and question_type:
                question = Question.objects.create(
                    survey=survey,
                    text=question_text,
                    question_type=question_type
                )
                # Для типов с вариантами (radio, checkbox, ranking)
                if question_type in ['radio', 'checkbox', 'ranking']:
                    choice_index = 0
                    while f'choice-{question_index}-{choice_index}-text' in request.POST:
                        choice_text = request.POST.get(f'choice-{question_index}-{choice_index}-text')
                        if choice_text:
                            Choice.objects.create(question=question, text=choice_text)
                        choice_index += 1
            question_index += 1
        return redirect('polls:index')
    
    return render(request, 'polls/create_survey.html')

def add_questions(request, survey_id):
    survey = get_object_or_404(Survey, pk=survey_id)
    
    if request.method == 'POST':
        question_formset = QuestionFormSet(request.POST, prefix='questions')
        
        if question_formset.is_valid():
            for question_form in question_formset:
                if question_form.cleaned_data and not question_form.cleaned_data.get('DELETE', False):
                    question = question_form.save(commit=False)
                    question.survey = survey
                    question.save()
                    
                    if question.question_type != 'text':
                        choice_formset = ChoiceFormSet(request.POST, prefix=f'choices-{question_form.prefix}')
                        if choice_formset.is_valid():
                            for choice_form in choice_formset:
                                if choice_form.cleaned_data and not choice_form.cleaned_data.get('DELETE', False):
                                    choice = choice_form.save(commit=False)
                                    choice.question = question
                                    choice.save()
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
            login(request, user)  # Автоматический вход после регистрации
            return redirect('polls:index')
    else:
        form = UserCreationForm()
    return render(request, 'polls/registration_form.html', {'form': form})


def profile(request, username):
    profile = get_object_or_404(User, username=username)
    # Получаем все ответы пользователя
    user_answers = Answer.objects.filter(user=profile).select_related('question__survey')
    # Извлекаем уникальные опросы, в которых пользователь участвовал
    surveys = Survey.objects.filter(questions__answers__user=profile).distinct()
    
    context = {
        'profile': profile,
        'surveys': surveys,
    }
    return render(request, 'polls/profile.html', context)

def edit(request, survey_id):
    survey = get_object_or_404(Survey, pk=survey_id)
    if request.method == 'POST':
        if 'delete_survey' in request.POST:
            survey.delete()
            return redirect('polls:index')

        survey.title = request.POST.get('survey_title', survey.title)
        survey.save()

        existing_questions = {str(q.id): q for q in survey.questions.all()}
        new_questions = {}

        for key in request.POST:
            if key.startswith('question_text_'):
                q_id = key.split('_')[-1]
                if q_id in existing_questions:
                    question = existing_questions[q_id]
                else:
                    question = Question(survey=survey)
                
                question.text = request.POST.get(f'question_text_{q_id}')
                question.question_type = request.POST.get(f'question_type_{q_id}')
                question.save()
                new_questions[q_id] = question

                if question.question_type in ['radio', 'checkbox']:
                    existing_choices = {str(c.id): c for c in question.choices.all()}
                    new_choices = {}
                    choice_texts = request.POST.getlist(f'choice_text_{q_id}')
                    for choice_text in choice_texts:
                        if choice_text and choice_text.strip():
                            choice_id = request.POST.get(f'choice_id_{q_id}_{choice_text}')
                            if choice_id and choice_id in existing_choices:
                                choice = existing_choices[choice_id]
                                choice.text = choice_text
                            else:
                                choice = Choice(question=question, text=choice_text)
                            choice.save()
                            new_choices[str(choice.id)] = choice
                    
                    for cid, choice in existing_choices.items():
                        if cid not in new_choices:
                            choice.delete()

        for qid, question in existing_questions.items():
            if qid not in new_questions:
                question.delete()

        return redirect('polls:index')

    return render(request, 'polls/edit.html', {'survey': survey})