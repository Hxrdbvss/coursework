from django.urls import path
from . import views

app_name = 'polls'
urlpatterns = [
    path('', views.index, name='index'),
    path('<int:survey_id>/', views.detail, name='detail'),
    path('create/', views.create_survey, name='create_survey'),
    path('<int:survey_id>/add-questions/', views.add_questions, name='add_questions'),
    path('<int:survey_id>/edit/', views.edit, name='edit'),
]