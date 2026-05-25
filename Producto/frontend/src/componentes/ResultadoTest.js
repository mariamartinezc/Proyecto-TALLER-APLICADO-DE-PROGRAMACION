import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaClock, FaUniversity, FaBriefcase, FaExternalLinkAlt, FaRedo } from 'react-icons/fa';

const ResultadoTest = ({ recomendaciones, alReiniciar }) => {
  const [fichaSeleccionada, setFichaSeleccionada] = useState(null);

  return (
    <div className="contenedor-principal">
      <div className="contenido-test">
        <h2 className="titulo-seccion" style={{ color: '#002d72', textAlign: 'center' }}>
          ¡Resultados Listos!
        </h2>
        <p style={{ color: '#4a5568', textAlign: 'center', marginBottom: '30px' }}>
          Estas son las carreras que mejor calzan contigo:
        </p>

        <div className="lista-resultados">
          {recomendaciones.map((c, i) => (
            <div key={i} className="item-resultado-card">
              <div className="resumen-carrera d-flex justify-content-between align-items-center">
                <div>
                  <h3>{c.nombre_carrera}</h3>
                  <p className="text-muted mb-0">{c.sede}</p>
                </div>
                <button 
                  className="btn-ficha d-flex align-items-center gap-2 btn btn-outline-primary"
                  onClick={() => setFichaSeleccionada(fichaSeleccionada === i ? null : i)}
                >
                  {fichaSeleccionada === i ? (
                    <> <FaEyeSlash /> Cerrar Ficha </>
                  ) : (
                    <> <FaEye /> Ver Ficha </>
                  )}
                </button>
              </div>

              {/* Ficha Detallada */}
              {fichaSeleccionada === i && (
                <div className="ficha-detalle-animada mt-3 p-3 bg-light rounded">
                  <hr />
                  <p className="d-flex align-items-center gap-2">
                    <FaClock className="text-primary" /> <strong>Duración:</strong> {c.duracion}
                  </p>
                  <p className="d-flex align-items-center gap-2">
                    <FaUniversity className="text-primary" /> <strong>Institución:</strong> {c.institucion}
                  </p>
                  <p className="d-flex align-items-center gap-2 mb-1">
                    <FaBriefcase className="text-primary" /> <strong>Campo Laboral:</strong>
                  </p>
                  <p className="texto-campo ms-4 text-secondary">{c.campo_laboral}</p>
                  
                  <div className="mt-3">
                    <a href={c.url_fuente} target="_blank" rel="noreferrer" className="link-duoc d-inline-flex align-items-center gap-2 btn btn-sm btn-link ps-0">
                      Ir al sitio oficial de la carrera <FaExternalLinkAlt size={12} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-4">
          <button className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-bold" onClick={alReiniciar}>
            <FaRedo /> Repetir el Test Vocacional
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultadoTest;