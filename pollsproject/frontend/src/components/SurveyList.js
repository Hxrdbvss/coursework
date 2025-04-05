import React, { useState, useEffect } from 'react';
import { ListGroup, Button, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function SurveyList({ token, user, handleLogout }) {
  const [surveys, setSurveys] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/surveys/', {
      headers: { Authorization: `Token ${token}` }
    }).then(response => setSurveys(response.data));
  }, [token]);

  const handleDelete = () => {
    axios.delete(`http://127.0.0.1:8000/api/surveys/${surveyToDelete.id}/`, {
      headers: { Authorization: `Token ${token}` }
    }).then(() => {
      setSurveys(surveys.filter(s => s.id !== surveyToDelete.id));
      setShowDeleteModal(false);
    });
  };

  return (
    <>
      <h1>Список опросов</h1>
      <Button variant="danger" onClick={handleLogout} className="mb-3 btn-custom">
        Выйти
      </Button>
      <ListGroup>
        {surveys.map(survey => (
          <ListGroup.Item key={survey.id} className="d-flex justify-content-between align-items-center">
            <Link to={`/survey/${survey.id}`}>{survey.title}</Link>
            <div>
              <Button
                variant="primary"
                size="sm"
                as={Link}
                to={`/edit/${survey.id}`}
                className="me-2 btn-custom"
              >
                <i className="bi bi-pencil"></i> Редактировать
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setSurveyToDelete(survey);
                  setShowDeleteModal(true);
                }}
                className="btn-custom"
              >
                <i className="bi bi-trash"></i> Удалить
              </Button>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
      <Button as={Link} to="/create" variant="success" className="mt-3 btn-custom">
        <i className="bi bi-plus"></i> Создать опрос
      </Button>
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Удалить опрос</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Вы уверены, что хотите удалить опрос "{surveyToDelete?.title}"?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Отмена
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Да, удалить
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default SurveyList;