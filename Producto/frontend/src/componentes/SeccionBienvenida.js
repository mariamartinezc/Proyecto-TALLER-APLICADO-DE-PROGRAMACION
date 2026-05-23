import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

function SeccionBienvenida() {
  return (
    <Container fluid className="py-5" style={{ backgroundColor: '#f8f9fa' }}>
      <Row className="justify-content-center text-center">
        <Col md={8}>
          <h2 className="fw-bold mb-3" style={{ color: '#002f6c' }}>
            Encuentra tu Carrera Ideal
          </h2>
          <p className="text-secondary fs-5">
            Compara aranceles, descubre las sedes más cercanas y realiza nuestro test vocacional para encontrar tu camino perfecto.
          </p>
        </Col>
      </Row>
    </Container>
  );
}

export default SeccionBienvenida;