import React from 'react';

const ModalTerminos = ({ mostrar, ordenarCierre, alAceptar }) => {
  // Si la propiedad 'mostrar' es false, no renderiza nada en la pantalla
  if (!mostrar) return null;

  return (
    <div 
      className="modal d-block" 
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.6)', 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 1050 
      }}
    >
      <div className="modal-dialog modal-dialog-scrollable" style={{ top: '10%' }}>
        <div className="modal-content text-dark">
          
          {/* Encabezado */}
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Términos, Condiciones y Privacidad</h5>
            <button type="button" className="btn-close" onClick={ordenarCierre}></button>
          </div>
          
          {/* Cuerpo del texto legal */}
          <div className="modal-body" style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <p><strong>1. Tratamiento de Datos:</strong> Almacenamos tu información académica (colegio, región y puntajes) únicamente para personalizar las recomendaciones de orientación vocacional.</p>
            <p><strong>2. Permiso de Ubicación:</strong> Esta aplicación requiere acceso a tu geolocalización GPS. Usamos estos datos exclusivamente para calcular distancias y rutas hacia las sedes institucionales en tiempo real. No rastreamos tu ubicación en segundo plano ni guardamos tu historial de coordenadas.</p>
            <p><strong>3. Seguridad:</strong> Tus datos están protegidos en nuestra base de datos cifrada y no serán compartidos con terceros.</p>
          </div>
          
          {/* Botones de acción */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={ordenarCierre}>
              Cerrar
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => {
                alAceptar(); // Activa el checkbox en el formulario principal
                ordenarCierre(); // Cierra el modal
              }}
            >
              Aceptar Términos
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ModalTerminos;