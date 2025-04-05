import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Button } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function Profile({ token }) {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [surveys, setSurveys] = useState([]);

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/api/profile/${username}/`, {
      headers: { Authorization: `Token ${token}` }
    }).then(response => {
      setProfile(response.data.user);
      setSurveys(response.data.surveys);
    });
  }, [username, token]);

  if (!profile) return <p>Загрузка...</p>;

  return (
    <Card className="p-4">
      <h1 className="text-center mb-5">Страница пользователя {profile.username}</h1>
      <ListGroup horizontal className="justify-content-center mb-3">
        <ListGroup.Item className="text-muted">
          Имя: {profile.full_name || 'не указано'}
        </ListGroup.Item>
        <ListGroup.Item className="text-muted">
          Регистрация: {new Date(profile.date_joined).toLocaleDateString()}
        </ListGroup.Item>
        <ListGroup.Item className="text-muted">
          Роль: {profile.is_staff ? 'Админ' : 'Пользователь'}
        </ListGroup.Item>
      </ListGroup>
      <h3 className="text-center mb-5">Опросы, в которых участвовал пользователь</h3>
      {surveys.length > 0 ? (
        surveys.map(survey => (
          <Card key={survey.id} className="mb-3">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <Card.Title>{survey.title}</Card.Title>
              <Button as="a" href={`/survey/${survey.id}`} variant="primary" className="btn-custom">
                Просмотреть
              </Button>
            </Card.Body>
          </Card>
        ))
      ) : (
        <p className="text-center">Пользователь пока не участвовал в опросах.</p>
      )}
    </Card>
  );
}

export default Profile;