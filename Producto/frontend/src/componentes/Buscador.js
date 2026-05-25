import React from 'react';
import { Row, Col, Form, Container } from 'react-bootstrap';
import { FaSearch, FaMapMarkerAlt, FaUniversity, FaBuilding, FaGraduationCap } from 'react-icons/fa';
import '../vistas/Buscador.css';

const Buscador = ({ filtros, setFiltros, opciones }) => {
  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  // Mapeamos los campos con sus respectivos iconos de react-icons
  const camposConfig = [
    { nombre: 'region', etiqueta: 'Región', icono: <FaMapMarkerAlt className="me-1 text-secondary" /> },
    { nombre: 'institucion', etiqueta: 'Institución', icono: <FaUniversity className="me-1 text-secondary" /> },
    { nombre: 'sede', etiqueta: 'Sede', icono: <FaBuilding className="me-1 text-secondary" /> },
    { nombre: 'carrera', etiqueta: 'Carrera', icono: <FaGraduationCap className="me-1 text-secondary" /> }
  ];

  return (
    <Container fluid className="px-4 mt-4">
      <Row className="g-2 mb-3 justify-content-center">
        {camposConfig.map((item) => (
          <Col key={item.nombre} xs={6} md={2}>
            <div className="d-flex align-items-center bg-white border rounded px-2">
              {item.icono}
              <Form.Select 
                name={item.nombre} 
                className="filtro-select border-0 ps-1" 
                onChange={manejarCambio}
                style={{ shadow: 'none', outline: 'none' }}
              >
                <option value="Todas">{item.etiqueta}</option>
                {opciones[item.nombre + (item.nombre === 'carrera' ? 's' : item.nombre === 'institucion' ? 'es' : 's')]?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Form.Select>
            </div>
          </Col>
        ))}
      </Row>

      <div className="panel-busqueda p-4 rounded shadow-sm border border-secondary mx-auto" style={{ maxWidth: '1100px' }}>
        <Row className="align-items-center">
          <Col md={9}>
            <Form.Control 
              name="palabraClave"
              placeholder="Escribe una palabra clave..." 
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
            <button className="btn btn-success rounded-pill px-4 py-2 fw-bold d-inline-flex align-items-center gap-2">
              <FaSearch /> BUSCAR
            </button>
          </Col>
        </Row>
      </div>
    </Container>
  );
};

export default Buscador;