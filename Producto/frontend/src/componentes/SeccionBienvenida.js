import React from 'react';
import { Card, Container } from 'react-bootstrap'; // <-- Quitamos 'Button' de aquí

function SeccionBienvenida() {
  return (
    <Container className="mt-5 text-center px-4">
      <Card className="border-0 shadow-sm" style={{ backgroundColor: '#f4f7f4' }}>
        <Card.Body className="py-5">
          <Card.Title className="fw-bold mb-3" style={{ fontSize: '2.2rem', color: '#333' }}>
            Descubre tu camino profesional
          </Card.Title>
          <Card.Text className="text-muted fs-5 mb-4 mx-auto" style={{ maxWidth: '700px' }}>
            Encuentra la carrera ideal, explora instituciones y proyecta tu futuro 
            con la plataforma de orientación más completa.
          </Card.Text>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default SeccionBienvenida;