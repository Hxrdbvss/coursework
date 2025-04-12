from django.urls import path, include
from . import views

app_name = 'polls'

urlpatterns = [
    path('', views.index, name='index'),
    path('surveys/<int:survey_id>/', views.detail, name='detail'),
    path('create/', views.create_survey, name='create_survey'),
    path('surveys/<int:survey_id>/edit/', views.edit, name='edit'),
    path('surveys/<int:survey_id>/add_questions/', views.add_questions, name='add_questions'),
    path('register/', views.register, name='register'),
    path('profile/<str:username>/', views.profile, name='profile'),
    path('api/surveys/', views.SurveyList.as_view(), name='survey_list_api'),
    path('api/register/', views.RegisterView.as_view(), name='register_api'),
    path('api/login/', views.LoginView.as_view(), name='login_api'),
    path('api/surveys/create/', views.SurveyCreate.as_view(), name='survey_create_api'),
    path('api/surveys/<int:pk>/', views.SurveyDetail.as_view(), name='survey_detail_api'),
    path('api/surveys/<int:pk>/edit/', views.SurveyEdit.as_view(), name='survey_edit_api'),
    path('api/profile/<str:username>/', views.ProfileView.as_view(), name='profile_api'),
    path('api/profile/edit/', views.ProfileEditView.as_view(), name='profile_edit_api'),
    path('api/profile/delete/', views.ProfileDeleteView.as_view(), name='profile_delete_api'),
    path('api/surveys/<int:survey_id>/questions/', views.add_questions, name='add_questions_api'),
    path('api/surveys/<int:survey_id>/answers/', views.SubmitAnswers.as_view(), name='submit_answers_api'),
]