import React, { useState } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

function Login({ setToken, setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const handleSubmit = e => {
    e.preventDefault();
    console.log('Sending:', { username, password });
    axios
      .post(
        'http://127.0.0.1:8000/api/login/',
        { username, password },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
      .then(response => {
        setToken(response.data.token);
        setUser({ username: response.data.username, id: response.data.user_id });
        localStorage.setItem('token', response.data.token);
        navigate(from, { replace: true });
      })
      .catch(err => {
        console.error('Error response:', err.response);
        setError(err.response?.data?.non_field_errors || 'Ошибка входа');
      });
  };

  return (
    <Card className="p-4 mx-auto" style={{ maxWidth: '400px' }}>
      <h1 className="text-center mb-4">Вход</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Имя пользователя</Form.Label>
          <Form.Control
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Пароль</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </Form.Group>
        <Button type="submit" variant="primary" className="w-100 btn-custom">
          Войти
        </Button>
      </Form>
      <p className="mt-3 text-center">
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </Card>
  );
}

export default Login;