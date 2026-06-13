import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col, Spinner, Button } from 'react-bootstrap';

const Perfil = () => {
  const [userData, setUserData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const obtenerPerfil = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        if (user) {
          setUserData({
            email: user.email,
            ...user.user_metadata
          });
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error al obtener el perfil:', error.message);
      } finally {
        setCargando(false);
      }
    };

    obtenerPerfil();
  }, [navigate]);

  if (cargando) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  if (!userData) {
    return <div className="text-center mt-5">No se pudo cargar la información del perfil.</div>;
  }

  return (
    <Container className="py-5" style={{ maxWidth: '800px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark">Mi Perfil</h2>
        <Button variant="outline-secondary" onClick={() => navigate('/home')}>
          Volver al Inicio
        </Button>
      </div>

      {/* TARJETA PRINCIPAL (Encabezado) */}
      <Card className="shadow-sm mb-4 border-0">
        <Card.Body className="d-flex align-items-center bg-light rounded">
          <div className="bg-success text-white rounded-circle d-flex justify-content-center align-items-center me-4" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
            {userData.nombres ? userData.nombres.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="fw-bold mb-1">{userData.nombre_completo || 'Usuario'}</h3>
            <p className="text-muted mb-0">
              <span className="badge bg-secondary me-2">{userData.rol || 'Estudiante'}</span>
              {userData.email}
            </p>
          </div>
        </Card.Body>
      </Card>

      <Row>
        {/* COLUMNA IZQUIERDA: DATOS PERSONALES */}
        <Col md={6} className="mb-4">
          <Card className="shadow-sm h-100 border-0">
            <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="fw-bold text-success">Datos Personales</h5>
            </Card.Header>
            <Card.Body>
              <ul className="list-group list-group-flush">
                <li className="list-group-item px-0">
                  <small className="text-muted d-block">Nombres</small>
                  <span className="fw-medium">{userData.nombres || 'No registrado'}</span>
                </li>
                <li className="list-group-item px-0">
                  <small className="text-muted d-block">Apellidos</small>
                  <span className="fw-medium">{userData.apellidos || 'No registrado'}</span>
                </li>
                {/* CAMBIOS: Se visualizan los nuevos parámetros de fecha y edad fija */}
                <li className="list-group-item px-0">
                  <small className="text-muted d-block">Fecha de Nacimiento</small>
                  <span className="fw-medium">{userData.fecha_nacimiento || 'No registrado'}</span>
                </li>
                <li className="list-group-item px-0">
                  <small className="text-muted d-block">Edad al registrarse</small>
                  <span className="fw-medium">{userData.edad_registro ? `${userData.edad_registro} años` : 'No registrado'}</span>
                </li>
                <li className="list-group-item px-0">
                  <small className="text-muted d-block">Género</small>
                  <span className="fw-medium">{userData.genero || 'No registrado'}</span>
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>

        {/* COLUMNA DERECHA: DATOS ACADÉMICOS */}
        <Col md={6} className="mb-4">
          <Card className="shadow-sm h-100 border-0">
            <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="fw-bold text-success">Datos Académicos</h5>
            </Card.Header>
            <Card.Body>
              <ul className="list-group list-group-flush">
                <li className="list-group-item px-0">
                  <small className="text-muted d-block">Región</small>
                  <span className="fw-medium">{userData.region || 'No registrado'}</span>
                </li>
                <li className="list-group-item px-0">
                  <small className="text-muted d-block">Establecimiento</small>
                  <span className="fw-medium">{userData.establecimiento || 'No registrado'}</span>
                </li>
                <li className="list-group-item px-0">
                  <small className="text-muted d-block">Puntaje PAES</small>
                  <span className="fw-medium">{userData.puntaje_paes || 'No especificado'}</span>
                </li>
                <li className="list-group-item px-0">
                  <small className="text-muted d-block">Ranking de notas</small>
                  <span className="fw-medium">{userData.ranking_notas || 'No especificado'}</span>
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Perfil;