import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';

function SurveyDetail({ token }) {
  const [survey, setSurvey] = useState(null);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/api/surveys/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        console.log("Survey data:", response.data);
        setSurvey(response.data);
        const initialAnswers = {};
        response.data.questions.forEach((q) => {
          if (q.question_type === 'checkbox') initialAnswers[q.id] = [];
          else if (q.question_type === 'text') initialAnswers[q.id] = '';
          else if (q.question_type === 'rating') initialAnswers[q.id] = 1;
          else if (q.question_type === 'yesno') initialAnswers[q.id] = null;
          else if (q.question_type === 'ranking') initialAnswers[q.id] = q.choices.map((c) => c.id);
          else initialAnswers[q.id] = null; // radio
        });
        setAnswers(initialAnswers);
      })
      .catch((err) => {
        console.error("Error loading survey:", err.response?.data);
        setError('Не удалось загрузить опрос: ' + (err.response?.data?.detail || 'Сервер недоступен'));
      });
  }, [id, token]);

  const handleAnswerChange = (questionId, value, type) => {
    setAnswers((prev) => {
      if (type === 'checkbox') {
        const currentChoices = prev[questionId] || [];
        if (currentChoices.includes(value)) {
          return { ...prev, [questionId]: currentChoices.filter((c) => c !== value) };
        } else {
          return { ...prev, [questionId]: [...currentChoices, value] };
        }
      }
      return { ...prev, [questionId]: value };
    });
  };

  const handleRankingChange = (questionId, choiceId, direction) => {
    setAnswers((prev) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const answersData = [];
    Object.keys(answers).forEach((questionId) => {
        const question = survey.questions.find((q) => q.id === parseInt(questionId));
        if (!question) {
            console.error(`Question ${questionId} not found in survey ${survey.id}`);
            return;
        }
        console.log(`Processing question ${questionId}, type: ${question.question_type}`);
        const baseAnswer = { question: parseInt(questionId), survey: survey.id };
        if (question.question_type === 'radio' && answers[questionId]) {
            answersData.push({ ...baseAnswer, choice: parseInt(answers[questionId]) });
        } else if (question.question_type === 'checkbox' && answers[questionId]?.length > 0) {
            answersData.push(...answers[questionId].map(choiceId => ({ ...baseAnswer, choice: parseInt(choiceId) })));
        } else if (question.question_type === 'text' && answers[questionId]) {
            answersData.push({ ...baseAnswer, text_answer: answers[questionId] });
        } else if (question.question_type === 'rating' && answers[questionId]) {
            answersData.push({ ...baseAnswer, rating_answer: parseInt(answers[questionId]) });
        } else if (question.question_type === 'yesno' && answers[questionId] !== null) {
            answersData.push({ ...baseAnswer, yesno_answer: answers[questionId] });
        } else if (question.question_type === 'ranking' && answers[questionId]) {
            answersData.push({ ...baseAnswer, ranking_answer: answers[questionId] });
        }
    });

    if (answersData.length === 0) {
        console.error('No answers to submit');
        return;
    }

    console.log('Sending answers:', JSON.stringify(answersData, null, 2));
    try {
        const response = await axios.post(
            `http://127.0.0.1:8000/api/surveys/${survey.id}/submit/`,
            answersData,
            {
                headers: {
                    'Authorization': `Token ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log('Answers submitted:', response.data);
    } catch (error) {
        console.error('Error submitting answers:', error.response?.data || error.message);
    }
};
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!survey) return <div>Загрузка...</div>;
  if (submitted) return <Alert variant="success">Ответы успешно отправлены! <Link to="/">Вернуться к списку</Link></Alert>;

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
                    const choice = question.choices.find((c) => c.id === choiceId);
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