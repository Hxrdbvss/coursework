import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { Form, Button, Row, Col } from 'react-bootstrap';

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
        console.log("Survey data:", response.data);
        setSurvey(response.data);
        const initialAnswers = {};
        response.data.questions.forEach(q => {
          if (q.question_type === 'checkbox') initialAnswers[q.id] = [];
          else if (q.question_type === 'text') initialAnswers[q.id] = '';
          else if (q.question_type === 'rating') initialAnswers[q.id] = 1;
          else if (q.question_type === 'yesno') initialAnswers[q.id] = null;
          else if (q.question_type === 'ranking') initialAnswers[q.id] = q.choices.map(c => c.id);
          else initialAnswers[q.id] = null; // radio
        });
        setAnswers(initialAnswers);
      })
      .catch(err => {
        console.error("Error loading survey:", err.response?.data);
        setError('Не удалось загрузить опрос: ' + (err.response?.data?.detail || 'Сервер недоступен'));
      });
  }, [id, token]);

  const handleAnswerChange = (questionId, value, type) => {
    setAnswers(prev => {
      if (type === 'checkbox') {
        const currentChoices = prev[questionId] || [];
        if (currentChoices.includes(value)) {
          return { ...prev, [questionId]: currentChoices.filter(c => c !== value) };
        } else {
          return { ...prev, [questionId]: [...currentChoices, value] };
        }
      }
      return { ...prev, [questionId]: value };
    });
  };

  const handleRankingChange = (questionId, choiceId, direction) => {
    setAnswers(prev => {
      const ranking = [...prev[questionId]];
      const index = ranking.indexOf(choiceId);
      if (direction === 'up' && index > 0) {
        [ranking[index - 1], ranking[index]] = [ranking[index], ranking[index - 1]];
      } else if (direction === 'down' && index < ranking.length - 1) {
        [ranking[index], ranking[index + 1]] = [ranking[index + 1], ranking[index]];
      }
      return { ...prev, [questionId]: ranking };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const answersData = Object.keys(answers).map(questionId => {
      const question = survey.questions.find(q => q.id === parseInt(questionId));
      return {
        question: questionId,
        choice: question.question_type === 'radio' ? answers[questionId] : null,
        text_answer: question.question_type === 'text' ? answers[questionId] : null,
        choices: question.question_type === 'checkbox' ? answers[questionId] : null,
        rating_answer: question.question_type === 'rating' ? answers[questionId] : null,
        yesno_answer: question.question_type === 'yesno' ? answers[questionId] : null,
        ranking_answer: question.question_type === 'ranking' ? answers[questionId] : null
      };
    });
    console.log("Submitting answers:", answersData);
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
              {/* Radio */}
              {question.question_type === 'radio' && question.choices && question.choices.length > 0 && (
                question.choices.map((choice) => (
                  <Form.Check
                    key={choice.id}
                    type="radio"
                    label={choice.text}
                    name={`question-${question.id}`}
                    value={choice.id}
                    checked={answers[question.id] === choice.id}
                    onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value), 'radio')}
                  />
                ))
              )}
              {/* Checkbox */}
              {question.question_type === 'checkbox' && question.choices && question.choices.length > 0 && (
                question.choices.map((choice) => (
                  <Form.Check
                    key={choice.id}
                    type="checkbox"
                    label={choice.text}
                    value={choice.id}
                    checked={answers[question.id]?.includes(choice.id)}
                    onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value), 'checkbox')}
                  />
                ))
              )}
              {/* Text */}
              {question.question_type === 'text' && (
                <Form.Control
                  type="text"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value, 'text')}
                />
              )}
              {/* Rating */}
              {question.question_type === 'rating' && (
                <Form.Select
                  value={answers[question.id]}
                  onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value), 'rating')}
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </Form.Select>
              )}
              {/* Yes/No */}
              {question.question_type === 'yesno' && (
                <div>
                  <Form.Check
                    type="radio"
                    label="Да"
                    name={`question-${question.id}`}
                    value="true"
                    checked={answers[question.id] === true}
                    onChange={() => handleAnswerChange(question.id, true, 'yesno')}
                  />
                  <Form.Check
                    type="radio"
                    label="Нет"
                    name={`question-${question.id}`}
                    value="false"
                    checked={answers[question.id] === false}
                    onChange={() => handleAnswerChange(question.id, false, 'yesno')}
                  />
                </div>
              )}
              {/* Ranking */}
              {question.question_type === 'ranking' && question.choices && question.choices.length > 0 && (
                <div>
                  {answers[question.id]?.map((choiceId, index) => {
                    const choice = question.choices.find(c => c.id === choiceId);
                    return (
                      <Row key={choice.id} className="mb-2">
                        <Col>{choice.text}</Col>
                        <Col xs="auto">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleRankingChange(question.id, choice.id, 'up')}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleRankingChange(question.id, choice.id, 'down')}
                            disabled={index === answers[question.id].length - 1}
                          >
                            ↓
                          </Button>
                        </Col>
                      </Row>
                    );
                  })}
                </div>
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