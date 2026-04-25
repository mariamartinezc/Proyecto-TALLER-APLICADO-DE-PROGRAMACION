import React, { useState } from 'react';
import { Table, Modal, Button, Badge } from 'react-bootstrap';
import '../vistas/TablaCarreras.css';

const TablaCarreras = ({ carreras, filtroSede }) => {
  // Estado para controlar el Modal y la carrera seleccionada
  const [showModal, setShowModal] = useState(false);
  const [carreraSeleccionada, setCarreraSeleccionada] = useState(null);

  const fmt = (v) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(v || 0);

  // Función para abrir la Card/Modal
  const handleVerCarrera = (carrera) => {
    setCarreraSeleccionada(carrera);
    setShowModal(true);
  };

  return (
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
            <th>Ingreso Prom.</th>
            <th>Empleabilidad</th>
          </tr>
        </thead>
        <tbody>
          {carreras.length > 0 ? (
            carreras.map((carrera, i) => (
              carrera.sedes?.filter(s => {
                if (!s || !s.sede) return false;
                return filtroSede === "Todas" || s.sede.toUpperCase() === filtroSede.toUpperCase();
              }).map((sede, idx) => (
                <tr key={`${i}-${idx}`}>
                  <td className="col-nombre-carrera text-center">
                    <div className="fw-bold mb-3" style={{ color: '#2c3e50', fontSize: '1.1rem' }}>
                      {carrera.nombre_carrera}
                    </div>
                    <div className="d-flex justify-content-center gap-2">
                      {/* BOTÓN VER: Al hacer clic, pasamos la carrera completa */}
                      <button 
                        className="btn btn-sm btn-tabla-ver"
                        onClick={() => handleVerCarrera(carrera)}
                      >
                        Ver
                      </button>
                      <button className="btn btn-sm btn-tabla-agregar">Ag</button>
                    </div>
                  </td>
                  <td className="text-center">{carrera.institucion}</td>
                  <td className="text-center">{sede.sede}</td>
                  <td className="text-center">{fmt(sede.matricula)}</td>
                  <td className="text-center">{fmt(sede.arancel)}</td>
                  <td className="text-center fw-bold text-success">
                    {fmt(parseInt(sede.arancel || 0) * 10)}
                  </td>
                  <td className="text-center">
                    <Badge bg="info" text="dark">{carrera.duracion || "No disponible"}</Badge>
                  </td>
                  <td className="text-center text-muted small">Consultando...</td>
                  <td className="text-center text-muted small">Consultando...</td>
                </tr>
              ))
            ))
          ) : (
            <tr><td colSpan="9" className="text-center py-5 text-muted">No se encontraron resultados.</td></tr>
          )}
        </tbody>
      </Table>

      {/* MODAL QUE ACTÚA COMO CARD DE DETALLE */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        {carreraSeleccionada && (
          <>
            <Modal.Header closeButton className="bg-light">
              <Modal.Title>{carreraSeleccionada.nombre_carrera}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="row">
                <div className="col-md-6">
                  <h6 className="text-primary fw-bold">Descripción / Perfil</h6>
                  <p>{carreraSeleccionada.descripcion}</p>
                  <h6 className="text-primary fw-bold">Campo Laboral</h6>
                  <p style={{ fontSize: '0.9rem', textAlign: 'justify' }}>
                    {carreraSeleccionada.campo_laboral}
                  </p>
                </div>
                <div className="col-md-6 border-start">
                  <h6 className="text-primary fw-bold">Detalles Generales</h6>
                  <ul className="list-unstyled">
                    <li><strong>Institución:</strong> {carreraSeleccionada.institucion}</li>
                    <li><strong>Duración:</strong> {carreraSeleccionada.duracion}</li>
                    <li><strong>Malla Curricular:</strong> 
                      <a href={carreraSeleccionada.malla_pdf} target="_blank" rel="noreferrer" className="ms-2 badge bg-danger text-decoration-none">
                        Descargar PDF
                      </a>
                    </li>
                  </ul>
                  <h6 className="mt-4 text-primary fw-bold">Sedes Disponibles</h6>
                  <div className="table-responsive">
                    <table className="table table-sm" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Sede</th>
                          <th>Arancel</th>
                        </tr>
                      </thead>
                      <tbody>
                        {carreraSeleccionada.sedes.map((s, index) => (
                          <tr key={index}>
                            <td>{s.sede}</td>
                            <td>{fmt(s.arancel)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cerrar</Button>
              <Button variant="primary" href={carreraSeleccionada.url_fuente} target="_blank">Ver en Sitio Oficial</Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </div>
  );
};

export default TablaCarreras;