from django.urls import path, include
from django.contrib.auth import views as auth_views
from . import views

app_name = 'polls'  

urlpatterns = [
    path('', views.index, name='index'),  
    path('<int:survey_id>/', views.detail, name='detail'),  
    path('<int:survey_id>/add-questions/', views.add_questions, name='add_questions'), 
    path('<int:survey_id>/edit/', views.edit, name='edit'), 
    path('create/', views.create_survey, name='create_survey'),  
    path('auth/', include('django.contrib.auth.urls')),
    path('register/', views.register, name='register'),
    path('profile/<str:username>/', views.profile, name='profile'),  
    path('api/surveys/', views.SurveyList.as_view(), name='survey_list_api'),
    path('api/surveys/create/', views.SurveyCreate.as_view(), name='survey_create_api'),
    path('api/surveys/<int:pk>/', views.SurveyDetail.as_view(), name='survey_detail_api'),
    path('api/surveys/<int:survey_id>/questions/', views.add_questions, name='add_questions_api'),
    path('api/register/', views.RegisterView.as_view(), name='api_register'),
    path('api/login/', views.LoginView.as_view(), name='api_login'),
    path('api/profile/<str:username>/', views.profile_view, name='profile_api'),
    path('api/surveys/<int:survey_id>/answers/', views.submit_answers, name='submit_answers_api'),
    path('api/surveys/<int:survey_id>/submit/', views.SubmitAnswers.as_view(), name='submit_answers'),
]