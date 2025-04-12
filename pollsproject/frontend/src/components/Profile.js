import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Button, Form, Modal, Accordion, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Profile({ token }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchProfile = () => {
      axios
        .get(`http://127.0.0.1:8000/api/profile/${username}/`, {
          headers: { Authorization: `Token ${token}` },
        })
        .then((response) => {
          setProfile(response.data.user);
          setSurveys(response.data.surveys);
          setFormData({
            first_name: response.data.user.first_name || '',
            last_name: response.data.user.last_name || '',
            email: response.data.user.email || '',
          });
        })
        .catch((err) => {
          setError(
            'Ошибка загрузки профиля: ' + (err.response?.data?.detail || 'Сервер недоступен')
          );
        });
    };

    fetchProfile();
  }, [username, token]);

  const handleEditSubmit = (e) => {
    e.preventDefault();
    axios
      .put('http://127.0.0.1:8000/api/profile/edit/', formData, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        setProfile({ ...profile, ...response.data });
        setEditMode(false);
        alert('Профиль успешно обновлён!');
      })
      .catch((err) => {
        setError(
          'Ошибка обновления профиля: ' + (err.response?.data?.detail || 'Сервер недоступен')
        );
      });
  };

  const handleDeleteConfirm = () => {
    axios
      .delete('http://127.0.0.1:8000/api/profile/delete/', {
        headers: { Authorization: `Token ${token}` },
      })
      .then(() => {
        localStorage.removeItem('token');
        navigate('/login');
        alert('Профиль успешно удалён');
      })
      .catch((err) => {
        setError(
          'Ошибка удаления профиля: ' + (err.response?.data?.detail || 'Сервер недоступен')
        );
      });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!profile) return <p>Загрузка...</p>;

  return (
    <Card className="p-4">
      <h1 className="text-center mb-4">Профиль пользователя {profile.username}</h1>
      {editMode ? (
        <Form onSubmit={handleEditSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Имя</Form.Label>
            <Form.Control
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Фамилия</Form.Label>
            <Form.Control
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
            />
          </Form.Group>
          <Button type="submit" variant="primary" className="me-2">
            Сохранить
          </Button>
          <Button variant="secondary" onClick={() => setEditMode(false)}>
            Отмена
          </Button>
        </Form>
      ) : (
        <>
          <ListGroup horizontal className="justify-content-center mb-4">
            <ListGroup.Item className="text-muted">
              Имя: {profile.full_name || 'не указано'}
            </ListGroup.Item>
            <ListGroup.Item className="text-muted">
              Email: {profile.email || 'не указано'}
            </ListGroup.Item>
            <ListGroup.Item className="text-muted">
              Регистрация: {new Date(profile.date_joined).toLocaleDateString()}
            </ListGroup.Item>
            <ListGroup.Item className="text-muted">
              Роль: {profile.is_staff ? 'Админ' : 'Пользователь'}
            </ListGroup.Item>
          </ListGroup>
          <div className="text-center mb-4">
            <Button variant="primary" onClick={() => setEditMode(true)} className="me-2">
              Редактировать профиль
            </Button>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
              Удалить профиль
            </Button>
          </div>
        </>
      )}
      <h3 className="text-center mb-4">Пройденные опросы</h3>
      {surveys.length > 0 ? (
        <Accordion>
          {surveys.map((survey) => (
            <Accordion.Item key={survey.id} eventKey={survey.id.toString()}>
              <Accordion.Header>{survey.title}</Accordion.Header>
              <Accordion.Body>
                {survey.answers.length > 0 ? (
                  <ListGroup>
                    {survey.answers.map((answer, index) => (
                      <ListGroup.Item key={index}>
                        <strong>Вопрос:</strong> {answer.question}<br />
                        <strong>Ответ:</strong>{' '}
                        {typeof answer.answer === 'object'
                          ? JSON.stringify(answer.answer)
                          : answer.answer}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <p>Ответы отсутствуют</p>
                )}
                <Button
                  as="a"
                  href={`/survey/${survey.id}`}
                  variant="primary"
                  className="mt-3"
                >
                  Просмотреть опрос
                </Button>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      ) : (
        <p className="text-center">Пользователь пока не участвовал в опросах.</p>
      )}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Подтверждение удаления</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Вы уверены, что хотите удалить свой профиль? Это действие нельзя отменить.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Отмена
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Удалить
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}

export default Profile;