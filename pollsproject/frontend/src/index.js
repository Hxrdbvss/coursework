import React from 'react';
import { createRoot } from 'react-dom/client'; // Используем createRoot
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container); // Создаём корень
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);