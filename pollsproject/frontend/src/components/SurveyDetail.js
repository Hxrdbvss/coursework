import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';

function SurveyDetail({ token }) {
  const [survey, setSurvey] = useState(null);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const { id } = useParams();

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/api/surveys/${id}/`, {
      headers: { Authorization: `Token ${token}` }
    })
      .then(response => {
        console.log("Survey data:", response.data); // Логируем данные
        setSurvey(response.data);
        const initialAnswers = {};
        response.data.questions.forEach(q => {
          initialAnswers[q.id] = q.question_type === 'text' ? '' : null;
        });
        setAnswers(initialAnswers);
      })
      .catch(err => {
        console.error("Error loading survey:", err.message);
        setError('Не удалось загрузить опрос: ' + (err.response?.data?.detail || 'Сервер недоступен'));
      });
  }, [id, token]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const answersData = Object.keys(answers).map(questionId => ({
      question: questionId,
      choice: survey.questions.find(q => q.id === parseInt(questionId)).question_type !== 'text' ? answers[questionId] : null,
      text_answer: survey.questions.find(q => q.id === parseInt(questionId)).question_type === 'text' ? answers[questionId] : null
    }));
    axios.post(`http://127.0.0.1:8000/api/surveys/${id}/submit/`, answersData, {
      headers: { Authorization: `Token ${token}` }
    })
      .then(response => {
        console.log("Answers submitted:", response.data);
        alert("Ответы успешно отправлены!");
      })
      .catch(err => {
        console.error("Error submitting answers:", err.response?.data);
        setError('Ошибка при отправке ответов: ' + (err.response?.data?.detail || 'Сервер недоступен'));
      });
  };

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!survey) return <div>Загрузка...</div>;

  return (
    <div className="container mt-4">
      <h1>{survey.title}</h1>
      <Form onSubmit={handleSubmit}>
        {survey.questions && survey.questions.length > 0 ? (
          survey.questions.map((question) => (
            <div key={question.id} className="mb-4">
              <h3>{question.text}</h3>
              {question.question_type === 'radio' && question.choices && question.choices.length > 0 ? (
                question.choices.map((choice) => (
                  <Form.Check
                    key={choice.id}
                    type="radio"
                    label={choice.text}
                    name={`question-${question.id}`}
                    value={choice.id}
                    checked={answers[question.id] === choice.id}
                    onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
                  />
                ))
              ) : question.question_type === 'text' ? (
                <Form.Control
                  type="text"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                />
              ) : (
                <p>Тип вопроса не поддерживается</p>
              )}
            </div>
          ))
        ) : (
          <p>Вопросы отсутствуют</p>
        )}
        <Button type="submit" variant="primary" className="mt-3">Отправить ответы</Button>
        <Link to="/" className="btn btn-secondary mt-3 ms-2">Назад</Link>
      </Form>
    </div>
  );
}

export default SurveyDetail;