import React from 'react';

const TarjetaPregunta = ({ pregunta, alResponder }) => {
  const opciones = [
    { texto: "No me gusta nada", puntos: 1, clase: "opcion-1" },
    { texto: "Me interesa poco", puntos: 2, clase: "opcion-2" },
    { texto: "Me es indiferente", puntos: 3, clase: "opcion-3" },
    { texto: "Me gusta bastante", puntos: 4, clase: "opcion-4" },
    { texto: "¡Me encanta!", puntos: 5, clase: "opcion-5" }
  ];

  return (
    <div className="tarjeta-pregunta">
      <h2 className="pregunta-texto">{pregunta.texto}</h2>
      <div className="lista-opciones">
        {opciones.map((opc, index) => (
          <button 
            key={index} 
            className={`btn-opcion ${opc.clase}`}
            onClick={() => alResponder(opc.puntos, pregunta.categoria)}
          >
            {opc.texto}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TarjetaPregunta;