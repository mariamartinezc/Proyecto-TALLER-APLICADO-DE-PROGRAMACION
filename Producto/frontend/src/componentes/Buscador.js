import React from 'react';
import { Row, Col, Form, Container } from 'react-bootstrap';
import '../vistas/Buscador.css';

const Buscador = ({ filtros, setFiltros, opciones }) => {
  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Container fluid className="px-4 mt-4">
      <Row className="g-2 mb-3 justify-content-center">
        {['region', 'institucion', 'sede', 'carrera'].map((campo) => (
          <Col key={campo} xs={6} md={2}>
            <Form.Select name={campo} className="filtro-select" onChange={manejarCambio}>
              <option value="Todas">{campo.charAt(0).toUpperCase() + campo.slice(1)}</option>
              {opciones[campo + (campo === 'carrera' ? 's' : campo === 'institucion' ? 'es' : 's')]?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Form.Select>
          </Col>
        ))}
      </Row>

      <div className="panel-busqueda p-4 rounded shadow-sm border border-secondary mx-auto" style={{ maxWidth: '1100px' }}>
        <Row className="align-items-center">
          <Col md={9}>
            <Form.Control 
              name="palabraClave"
              placeholder="palabra clave" 
              className="rounded-pill mb-3 py-2 border-dark"
              onChange={manejarCambio}
            />
            <div className="d-flex align-items-center gap-3">
              <Form.Label className="small fw-bold mb-0">Arancel máximo:</Form.Label>
              <Form.Range 
                min={0} max={10000000} step={100000} 
                name="arancelMax"
                value={filtros.arancelMax}
                onChange={manejarCambio}
                className="flex-grow-1"
              />
              <span className="fw-bold text-success">
                ${new Intl.NumberFormat('es-CL').format(filtros.arancelMax)}
              </span>
            </div>
          </Col>
          <Col md={3} className="text-end">
            <div className="btn-buscar-verde">BUSCAR</div>
          </Col>
        </Row>
      </div>
    </Container>
  );
};

export default Buscador;