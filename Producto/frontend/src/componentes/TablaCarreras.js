import React, { useState } from 'react';
import { Table, Modal, Button, Row, Col } from 'react-bootstrap';
import '../vistas/TablaCarreras.css';

const TablaCarreras = ({ carreras, filtroSede }) => {
  // Estados para controlar el Modal de la Ficha Técnica
  const [showModal, setShowModal] = useState(false);
  const [fichaData, setFichaData] = useState(null);

  // formateador de dinero CLP
  const fmt = (v) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(v || 0);

  // Funciones para limpiar los datos estadísticos que vienen de Supabase
  const formatoIngreso = (valor) => {
    if (!valor || valor === "No disponible") return "No registrada";
    if (typeof valor === 'string' && valor.includes('$')) return valor;
    const num = parseInt(valor.toString().replace(/[^0-9]/g, ''));
    return isNaN(num) ? valor : fmt(num);
  };

  const formatoPorcentaje = (valor) => {
    if (!valor) return "No registrada";
    if (typeof valor === 'string' && valor.includes('%')) return valor;
    const num = parseFloat(valor);
    if (isNaN(num)) return valor;
    if (num > 0 && num <= 1) return `${(num * 100).toFixed(1)}%`;
    return `${num.toFixed(1)}%`;
  };

  // Función para activar el Modal al hacer click en "Ver"
  const handleAbrirFicha = (carrera, sede, mensual, anual) => {
    setFichaData({
      ...carrera,
      sedeSeleccionada: sede,
      mensualCalculado: mensual,
      anualCalculado: anual
    });
    setShowModal(true);
  };

  return (
    <>
      <div className="tabla-container shadow-sm">
        <Table hover striped bordered className="align-middle mb-0">
          <thead className="tabla-header">
            <tr className="text-center">
              <th>Carrera e Interacción</th>
              <th>Institución</th>
              <th>Sede</th>
              <th>Matrícula</th>
              <th>Arancel Mensual</th>
              <th>Arancel Anual</th>
              <th>Duración</th>
              <th>Ingreso Prom. al 4° Año</th>
              <th>Empleabilidad al 1° año</th>
              <th>Empleabilidad al 2° año</th>
            </tr>
          </thead>
          <tbody>
            {carreras.length > 0 ? (
              carreras.map((carrera, i) => (
                carrera.sedes?.filter(s => {
                  if (!s || !s.sede) return false;
                  return filtroSede === "Todas" || s.sede.toUpperCase() === filtroSede.toUpperCase();
                }).map((sede, idx) => {
                  
                  //(mensual * 12)
                  const arancelMensual = parseInt(sede.arancel || 0);
                  const arancelAnual = arancelMensual * 12;

                  return (
                    <tr key={`${i}-${idx}`}>
                      {/* CELDA CON NOMBRE Y BOTONES*/}
                      <td className="col-nombre-carrera text-center">
                        <div className="fw-bold mb-3" style={{ color: '#2c3e50', fontSize: '1.1rem' }}>
                          {carrera.nombre_carrera}
                        </div>
                        <div className="d-flex justify-content-center gap-2">
                          <button 
                            className="btn btn-sm btn-tabla-ver"
                            onClick={() => handleAbrirFicha(carrera, sede, arancelMensual, arancelAnual)}
                          >
                            Ver
                          </button>
                          <button className="btn btn-sm btn-tabla-agregar">Ag</button>
                        </div>
                      </td>

                      <td className="text-center">{carrera.institucion}</td>
                      <td className="text-center text-uppercase">{sede.sede}</td>
                      <td className="text-center">{fmt(sede.matricula)}</td>
                      <td className="text-center">{fmt(arancelMensual)}</td>
                      <td className="text-center fw-bold text-success">{fmt(arancelAnual)}</td>
                      
                      {/* CELDA DE DURACIÓN */}
                      <td className="text-center">
                        <span className="badge bg-info text-dark">
                          {carrera.duracion || "No disponible"}
                        </span>
                      </td>

                      {/* Datos estadísticos de Supabase con la nueva columna incorporada */}
                      <td className="text-center text-secondary">{formatoIngreso(carrera.ingresoCuartoAno)}</td>
                      <td className="text-center fw-medium">{formatoPorcentaje(carrera.empleabilidad1erAno)}</td>
                      <td className="text-center fw-medium text-muted">{formatoPorcentaje(carrera.empleabilidad2doAno)}</td>
                    </tr>
                  );
                })
              ))
            ) : (
              <tr>
                {/* Ajustado el colSpan a 10 para cubrir la nueva columna */}
                <td colSpan="10" className="text-center py-5 text-muted">
                  No se encontraron resultados.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* MODAL DE LA FICHA TÉCNICA (Se abre al pulsar 'Ver')  */}
      {fichaData && (
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
          <Modal.Header closeButton className="border-0 bg-light">
            <Modal.Title className="fw-bold" style={{ color: '#2c3e50' }}>
              Ficha Completa de la Carrera
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="px-4 pb-2">
            
            {/* Encabezado */}
            <div className="mb-4">
              <span className="badge bg-secondary mb-2 me-2 text-uppercase">{fichaData.institucion}</span>
              <span className="badge bg-dark mb-2 text-uppercase">Escuela: {fichaData.escuela}</span>
              <h3 className="fw-bold text-primary mt-1" style={{ color: '#00bdf2' }}>
                {fichaData.nombre_carrera}
              </h3>
              <p className="text-muted mb-0">
                Sede: <strong className="text-uppercase text-dark">{fichaData.sedeSeleccionada.sede}</strong>
              </p>
            </div>

            {/* Acerca de la carrera */}
            <div className="mb-4 p-3 rounded bg-light border-start border-4 border-info">
              <h6 className="fw-bold text-dark mb-2">Acerca de la carrera</h6>
              <p className="text-secondary mb-0" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                {fichaData.descripcion}
              </p>
            </div>

            <Row className="g-4 mb-4">
              {/* Detalles del Programa */}
              <Col md={12}>
                <div className="p-3 rounded border bg-light">
                  <h6 className="fw-bold mb-3 border-bottom pb-2" style={{ color: '#2c3e50' }}>
                    Detalles del Programa
                  </h6>
                  <Row>
                    <Col sm={6}>
                      <div className="mb-2">
                        <span className="text-secondary d-block" style={{ fontSize: '0.85rem' }}>Título Otorgado:</span>
                        <span className="fw-medium text-dark">{fichaData.titulo}</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-secondary d-block" style={{ fontSize: '0.85rem' }}>Modalidad:</span>
                        <span className="fw-medium text-dark">{fichaData.modalidad}</span>
                      </div>
                    </Col>
                    <Col sm={6}>
                      <div className="mb-2">
                        <span className="text-secondary d-block" style={{ fontSize: '0.85rem' }}>Jornada:</span>
                        <span className="fw-medium text-dark">{fichaData.jornada}</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-secondary d-block" style={{ fontSize: '0.85rem' }}>Duración:</span>
                        <span className="badge bg-info text-dark">{fichaData.duracion}</span>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Col>

              {/* Bloque Financiero */}
              <Col md={6}>
                <div className="p-3 rounded border bg-white shadow-sm h-100">
                  <h6 className="fw-bold mb-3 border-bottom pb-2" style={{ color: '#2c3e50' }}>
                    Información Financiera
                  </h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-secondary">Matrícula:</span>
                    <span className="fw-medium text-dark">{fmt(fichaData.sedeSeleccionada.matricula)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-secondary">Arancel Mensual:</span>
                    <span className="fw-medium text-dark">{fmt(fichaData.mensualCalculado)}</span>
                  </div>
                  <div className="d-flex justify-content-between mt-3 pt-2 border-top">
                    <span className="fw-bold text-dark">Arancel Anual:</span>
                    <span className="fw-bold text-success">{fmt(fichaData.anualCalculado)}</span>
                  </div>
                </div>
              </Col>

              {/* Bloque Proyección */}
              <Col md={6}>
                <div className="p-3 rounded border bg-white shadow-sm h-100">
                  <h6 className="fw-bold mb-3 border-bottom pb-2" style={{ color: '#2c3e50' }}>
                    Proyección laboral
                  </h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-secondary">Ingreso 4° Año:</span>
                    <span className="fw-medium text-dark">{formatoIngreso(fichaData.ingresoCuartoAno)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-secondary">Empleabilidad 1° Año:</span>
                    <span className="fw-bold text-dark">{formatoPorcentaje(fichaData.empleabilidad1erAno)}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-secondary">Empleabilidad 2° Año:</span>
                    <span className="fw-bold text-dark">{formatoPorcentaje(fichaData.empleabilidad2doAno)}</span>
                  </div>
                </div>
              </Col>
            </Row>

            {/* BOTONES DE LA FICHA CONECTADOS A LAS COLUMNAS */}
            <div className="d-flex flex-column flex-sm-row gap-3 pt-3 border-top">
              {fichaData.urlMalla ? (
                <a 
                  href={fichaData.urlMalla} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-outline-primary flex-fill fw-semibold text-center"
                >
                  Ver Malla Curricular
                </a>
              ) : (
                <button className="btn btn-outline-secondary flex-fill" disabled>
                  Malla No Disponible
                </button>
              )}

              {fichaData.urlOficial ? (
                <a 
                  href={fichaData.urlOficial} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-dark flex-fill fw-semibold text-center"
                >
                  Visitar Sitio Oficial
                </a>
              ) : (
                <button className="btn btn-secondary flex-fill" disabled>
                  Web No Disponible
                </button>
              )}
            </div>

          </Modal.Body>
          <Modal.Footer className="border-0 bg-light mt-2">
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
              Cerrar
            </Button>
            <Button style={{ backgroundColor: '#729676', border: 'none' }}>
              Agregar a Comparador
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
};

export default TablaCarreras;