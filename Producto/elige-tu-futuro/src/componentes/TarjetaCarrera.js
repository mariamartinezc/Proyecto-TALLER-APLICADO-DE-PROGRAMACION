import React from 'react';
import { Table } from 'react-bootstrap';
import './TablaCarreras.css';

const TablaCarreras = ({ carreras, filtroSede }) => {
  const fmt = (v) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(v || 0);

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
                  {/* CELDA COMBINADA: NOMBRE + BOTONES ABAJO */}
                  <td className="col-nombre-carrera text-center">
                    <div className="fw-bold mb-2" style={{ color: '#2c3e50' }}>
                      {carrera.nombre_carrera}
                    </div>
                    <div className="d-flex justify-content-center gap-2">
                      <button className="btn btn-sm btn-tabla-ver">Ver</button>
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
                </tr>
              ))
            ))
          ) : (
            <tr><td colSpan="6" className="text-center py-5 text-muted">No hay resultados.</td></tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default TablaCarreras;