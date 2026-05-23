import React, { useState } from 'react';

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
              <div className="resumen-carrera">
                <div>
                  <h3>{c.nombre_carrera}</h3>
                  <p>{c.sede}</p>
                </div>
                <button 
                  className="btn-ficha"
                  onClick={() => setFichaSeleccionada(fichaSeleccionada === i ? null : i)}
                >
                  {fichaSeleccionada === i ? 'Cerrar Ficha' : 'Ver Ficha'}
                </button>
              </div>

              {fichaSeleccionada === i && (
                <div className="ficha-detalle-animada">
                  <hr />
                  <p><strong>Duración:</strong> {c.duracion}</p>
                  <p><strong>Institución:</strong> {c.institucion}</p>
                  <p><strong>Campo Laboral:</strong></p>
                  <p className="texto-campo">{c.campo_laboral}</p>
                  <a href={c.url_fuente} target="_blank" rel="noreferrer" className="link-duoc">
                    Ir al sitio oficial de la carrera
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        <button className="btn-reiniciar-test" onClick={alReiniciar}>
          Repetir el Test Vocacional
        </button>
      </div>
    </div>
  );
};

export default ResultadoTest;