import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Container } from 'react-bootstrap';
import SurveyList from './components/SurveyList';
import SurveyDetail from './components/SurveyDetail';
import SurveyCreate from './components/SurveyCreate';
import SurveyEdit from './components/SurveyEdit';
import AddQuestions from './components/AddQuestions';
import Profile from './components/Profile';
import Register from './components/Register';
import Login from './components/Login';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      axios.get('http://127.0.0.1:8000/api/surveys/', {
        headers: { Authorization: `Token ${token}` }
      })
        .then(response => {
          setUser(response.data.user);
        })
        .catch(err => {
          console.error('Token invalid:', err.response?.status);
          setToken(null);
          localStorage.removeItem('token');
        });
    }
  }, [token]);

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <Container className="mt-4">
        <Routes>
          <Route path="/register" element={<Register setToken={setToken} setUser={setUser} />} />
          <Route path="/login" element={<Login setToken={setToken} setUser={setUser} />} />
          <Route
            path="/"
            element={
              token ? (
                <SurveyList token={token} user={user} handleLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="/survey/:id" element={<SurveyDetail token={token} />} />
          <Route path="/create" element={<SurveyCreate token={token} />} />
          <Route path="/edit/:id" element={<SurveyEdit token={token} />} />
          <Route path="/add-questions/:id" element={<AddQuestions token={token} />} />
          <Route path="/profile/:username" element={<Profile token={token} />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;