import React, { useState } from 'react';
import { Form, Button, Card, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function SurveyCreate({ token }) {
  const [title, setTitle] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState([{ text: '', question_type: 'radio', choices: [''] }]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const addQuestion = () => {
    setQuestions([...questions, { text: '', question_type: 'radio', choices: [''] }]);
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

    for (const q of questions) {
      if (['radio', 'checkbox', 'ranking'].includes(q.question_type)) {
        const validChoices = q.choices.filter(c => c.trim() !== '');
        console.log(`Question ${q.text || 'без названия'} (${q.question_type}): validChoices =`, validChoices);
        if (validChoices.length === 0) {
          setError(`Для вопроса "${q.text || 'без названия'}" типа "${q.question_type}" требуется хотя бы один непустой вариант ответа.`);
          return;
        }
      }
    }

    const surveyData = {
      title: title.replace(/^"|"$/g, ''),
      is_active: isActive,
      questions: questions.map(q => {
        const questionData = {
          text: q.text,
          question_type: q.question_type,
          choices: q.question_type === 'text' || q.question_type === 'rating' || q.question_type === 'yesno' ? [] : q.choices.filter(c => c.trim() !== '')
        };
        console.log(`Processed question ${q.text || 'без названия'}:`, questionData);
        return questionData;
      })
    };
    console.log("Sending survey data:", surveyData);

    axios.post('http://127.0.0.1:8000/api/surveys/create/', surveyData, {
      headers: { Authorization: `Token ${token}` }
    })
      .then(response => {
        console.log("Survey created:", response.data);
        navigate('/');
      })
      .catch(err => {
        console.error("Error creating survey:", err.response?.data);
        setError('Ошибка при создании опроса: ' + JSON.stringify(err.response?.data || 'Сервер недоступен'));
      });
  };

  return (
    <Card className="p-4">
      <h1>Создать новый опрос</h1>
      {error && <div className="alert alert-danger">{error}</div>}
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

        {questions.map((question, qIndex) => (
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
                    value={question.question_type}
                    onChange={(e) => handleQuestionChange(qIndex, 'question_type', e.target.value)}
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
            {(question.question_type === 'radio' || question.question_type === 'checkbox' || question.question_type === 'ranking') && (
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
        ))}

        <Button variant="outline-success" onClick={addQuestion} className="mb-3">
          Добавить вопрос
        </Button>
        <div className="d-flex gap-2">
          <Button type="submit" variant="primary" className="btn-custom">
            <i className="bi bi-save"></i> Сохранить опрос
          </Button>
          <Button as="a" href="/" variant="secondary" className="btn-custom">
            <i className="bi bi-arrow-left"></i> Назад
          </Button>
        </div>
      </Form>
    </Card>
  );
}

export default SurveyCreate;