import React, { useState } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom'; // Добавляем Link
import axios from 'axios';

function Register({ setToken, setUser }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://127.0.0.1:8000/api/register/', { username, email, password })
      .then(response => {
        setToken(response.data.token);
        setUser({ username: response.data.username, id: response.data.user_id });
        localStorage.setItem('token', response.data.token);
        navigate('/');
      })
      .catch(err => {
        setError(err.response?.data?.username || err.response?.data?.email || 'Ошибка регистрации');
      });
  };

  return (
    <Card className="p-4 mx-auto" style={{ maxWidth: '400px' }}>
      <h1 className="text-center mb-4">Регистрация</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Имя пользователя</Form.Label>
          <Form.Control
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Электронная почта</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Пароль</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>
        <Button type="submit" variant="primary" className="w-100 btn-custom">
          Зарегистрироваться
        </Button>
      </Form>
      <p className="mt-3 text-center">
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </Card>
  );
}

export default Register;