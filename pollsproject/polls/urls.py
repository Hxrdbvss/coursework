from django.urls import path
from . import views

app_name = 'polls'
urlpatterns = [
    path('', views.index, name='index'),  # /polls/
    path('<int:survey_id>/', views.detail, name='detail'),  # /polls/<survey_id>/
    path('<int:survey_id>/add-questions/', views.add_questions, name='add_questions'),  # /polls/<survey_id>/add-questions/
    path('<int:survey_id>/edit/', views.edit, name='edit'),  # /polls/<survey_id>/edit/
]