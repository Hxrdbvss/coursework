from django.urls import path, include
from django.contrib.auth import views as auth_views
from . import views

app_name = 'polls'  # Пространство имён для избежания конфликтов

urlpatterns = [
    path('', views.index, name='index'),  # /polls/
    path('<int:survey_id>/', views.detail, name='detail'),  # /polls/<survey_id>/
    path('<int:survey_id>/add-questions/', views.add_questions, name='add_questions'),  # /polls/<survey_id>/add-questions/
    path('<int:survey_id>/edit/', views.edit, name='edit'),  # /polls/<survey_id>/edit/
    path('create/', views.create_survey, name='create_survey'),  # /polls/create/
    path('auth/', include('django.contrib.auth.urls')),  # /polls/auth/...
    path('register/', views.register, name='register'),  # /polls/register/
    path('profile/<str:username>/', views.profile, name='profile'),  # /polls/profile/<username>/
    path('api/surveys/', views.SurveyList.as_view(), name='survey_list_api'),
    path('api/register/', views.RegisterView.as_view(), name='api_register'),
    path('api/login/', views.LoginView.as_view(), name='api_login'),
]