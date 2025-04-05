import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [surveys, setSurveys] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (token) {
      fetchSurveys(token);
    }
  }, [token]);

  const fetchSurveys = (authToken) => {
    axios.get('http://127.0.0.1:8000/api/surveys/', {
      headers: { Authorization: `Token ${authToken}` }
    })
      .then(response => setSurveys(response.data))
      .catch(error => console.error('Ошибка получения опросов:', error));
  };

  const handleRegister = () => {
    axios.post('http://127.0.0.1:8000/api/register/', { username, password })
      .then(response => {
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
        alert('Регистрация успешна!');
      })
      .catch(error => console.error('Ошибка регистрации:', error));
  };

  const handleLogin = () => {
    axios.post('http://127.0.0.1:8000/api/login/', { username, password })
      .then(response => {
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
        fetchSurveys(response.data.token);
      })
      .catch(error => console.error('Ошибка логина:', error));
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setSurveys([]);
  };

  return (
    <div className="App">
      {!token ? (
        <div>
          <h1>Авторизация</h1>
          <input
            type="text"
            placeholder="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleRegister}>Регистрация</button>
          <button onClick={handleLogin}>Войти</button>
        </div>
      ) : (
        <div>
          <h1>Список опросов</h1>
          <button onClick={handleLogout}>Выйти</button>
          <ul>
            {surveys.map(survey => (
              <li key={survey.id}>
                {survey.title} {survey.is_active ? '(Активен)' : '(Неактивен)'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;