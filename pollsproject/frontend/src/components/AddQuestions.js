import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function AddQuestions({ token }) {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([{ text: '', type: 'radio', choices: [''] }]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/api/surveys/${id}/`, {
      headers: { Authorization: `Token ${token}` }
    }).then(response => setSurvey(response.data));
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
    const questionData = questions.map(q => ({
      text: q.text,
      question_type: q.type,
      choices: q.type === 'text' || q.type === 'rating' || q.type === 'yesno' ? [] : q.choices.filter(c => c)
    }));
    axios.post(`http://127.0.0.1:8000/api/surveys/${id}/questions/`, questionData, {
      headers: { Authorization: `Token ${token}` }
    }).then(() => navigate('/'));
  };

  if (!survey) return <p>Загрузка...</p>;

  return (
    <Card className="p-4">
      <h1>Добавить вопросы к "{survey.title}"</h1>
      <Form onSubmit={handleSubmit}>
        {questions.map((question, qIndex) => (
          <Card key={qIndex} className="question-box mb-4 p-3">
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Текст вопроса</Form.Label>
                  <Form.Control
                    type="text"
                    value={question.text}
                    onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                    required
                  />
                </Form.Group>
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
            Сохранить вопросы
          </Button>
          <Button as="a" href="/" variant="secondary" className="btn-custom">
            Завершить создание
          </Button>
        </div>
      </Form>
    </Card>
  );
}

export default AddQuestions;