import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function SurveyEdit({ token }) {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/api/surveys/${id}/`, {
      headers: { Authorization: `Token ${token}` }
    })
      .then(response => {
        setTitle(response.data.title);
        setIsActive(response.data.is_active);
        const loadedQuestions = response.data.questions.map(q => ({
          text: q.text,
          type: q.question_type,
          choices: q.choices_display || []
        }));
        setQuestions(loadedQuestions);
      })
      .catch(err => {
        console.error("Error loading survey:", err.response?.data);
        setError('Ошибка загрузки опроса: ' + (err.response?.data?.detail || 'Неизвестная ошибка'));
      });
  }, [id, token]);

  const addQuestion = () => {
    setQuestions([...questions, { text: '', type: 'radio', choices: [''] }]);
  };

  const addChoice = (questionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].choices.push('');
    setQuestions(updatedQuestions);
  };

  const removeChoice = (questionIndex, choiceIndex) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].choices.length > 1) {
      updatedQuestions[questionIndex].choices.splice(choiceIndex, 1);
      setQuestions(updatedQuestions);
    }
  };

  const removeQuestion = (questionIndex) => {
    if (questions.length > 1) {
      const updatedQuestions = [...questions];
      updatedQuestions.splice(questionIndex, 1);
      setQuestions(updatedQuestions);
    } else {
      setError('Нельзя удалить последний вопрос. Опрос должен содержать хотя бы один вопрос.');
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const handleChoiceChange = (questionIndex, choiceIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].choices[choiceIndex] = value;
    setQuestions(updatedQuestions);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      setError("Опрос должен содержать хотя бы один вопрос.");
      return;
    }

    for (const q of questions) {
      if (['radio', 'checkbox', 'ranking'].includes(q.type)) {
        const validChoices = q.choices.filter(c => c.trim() !== '');
        if (validChoices.length === 0) {
          setError(`Для вопроса "${q.text || 'без названия'}" типа "${q.type}" требуется хотя бы один непустой вариант ответа.`);
          return;
        }
      }
    }

    const surveyData = {
      title,
      is_active: isActive,
      questions: questions.map(q => ({
        text: q.text,
        question_type: q.type,
        choices: q.type === 'text' || q.type === 'rating' || q.type === 'yesno' ? [] : q.choices.filter(c => c.trim() !== '')
      }))
    };
    console.log("Sending survey data:", surveyData);

    axios.put(`http://127.0.0.1:8000/api/surveys/${id}/`, surveyData, {
      headers: { 
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        console.log("Survey updated:", response.data);
        navigate('/');
      })
      .catch(err => {
        console.error("Error updating survey:", err.response?.data);
        setError('Ошибка при сохранении: ' + JSON.stringify(err.response?.data || 'Неизвестная ошибка'));
      });
  };

  return (
    <Card className="p-4">
      <h1>Редактировать опрос</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Название опроса</Form.Label>
          <Form.Control
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            label="Активен"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
        </Form.Group>

        {questions.length > 0 ? (
          questions.map((question, qIndex) => (
            <Card key={qIndex} className="question-box mb-4 p-3">
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3 d-flex align-items-center">
                    <Form.Label className="me-3">Вопрос {qIndex + 1}</Form.Label>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeQuestion(qIndex)}
                      disabled={questions.length === 1}
                    >
                      Удалить вопрос
                    </Button>
                  </Form.Group>
                  <Form.Control
                    type="text"
                    value={question.text}
                    onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                    required
                  />
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Тип вопроса</Form.Label>
                    <Form.Select
                      value={question.type}
                      onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                    >
                      <option value="radio">Один выбор</option>
                      <option value="checkbox">Множественный выбор</option>
                      <option value="text">Текстовый ответ</option>
                      <option value="rating">Шкала оценки</option>
                      <option value="yesno">Да/Нет</option>
                      <option value="ranking">Ранжирование</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              {(question.type === 'radio' || question.type === 'checkbox' || question.type === 'ranking') && (
                <div>
                  <Form.Label>Варианты ответа</Form.Label>
                  {question.choices.map((choice, cIndex) => (
                    <div key={cIndex} className="d-flex mb-2">
                      <Form.Control
                        type="text"
                        value={choice}
                        onChange={(e) => handleChoiceChange(qIndex, cIndex, e.target.value)}
                        className="me-2"
                        required
                        placeholder={`Вариант ${cIndex + 1}`}
                      />
                      <Button
                        variant="outline-danger"
                        onClick={() => removeChoice(qIndex, cIndex)}
                        disabled={question.choices.length === 1}
                      >
                        Удалить
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline-primary" onClick={() => addChoice(qIndex)} className="mt-2">
                    Добавить вариант
                  </Button>
                </div>
              )}
            </Card>
          ))
        ) : (
          <p>Вопросы отсутствуют</p>
        )}

        <Button variant="outline-success" onClick={addQuestion} className="mb-3">
          Добавить вопрос
        </Button>
        <div className="d-flex gap-2">
          <Button type="submit" variant="primary" className="btn-custom">
            <i className="bi bi-save"></i> Сохранить изменения
          </Button>
          <Button as="a" href="/" variant="secondary" className="btn-custom">
            <i className="bi bi-arrow-left"></i> Назад
          </Button>
        </div>
      </Form>
    </Card>
  );
}

export default SurveyEdit;