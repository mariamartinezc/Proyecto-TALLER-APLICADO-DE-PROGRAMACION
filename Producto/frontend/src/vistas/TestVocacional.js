import React, { useState, useEffect } from 'react';
import BarraDeProgreso from '../componentes/BarraDeProgreso';
import ResultadoTest from '../componentes/ResultadoTest';
import './TestVocacional.css';
import { obtenerCarrerasMapeadas } from '../services/carrerasService';
// Importamos los iconos de flechas desde Heroicons
import { HiArrowSmLeft, HiArrowSmRight } from 'react-icons/hi';

const TestVocacional = () => {
  const [paso, setPaso] = useState(0);
  const [seleccion, setSeleccion] = useState(null);
  const [puntajes, setPuntajes] = useState({ informatica: 0, turismo: 0, administracion: 0, diseno: 0 });
  const [finalizado, setFinalizado] = useState(false);
  const [datosDuoc, setDatosDuoc] = useState([]);

  // Consumimos el servicio unificado de Supabase
  useEffect(() => {
    obtenerCarrerasMapeadas()
      .then(data => {
        const adaptadosParaTest = data.map(c => ({
          nombre_carrera: c.nombre_carrera,
          duracion: c.duracion,
          institucion: c.institucion,
          campo_laboral: c.descripcion,
          url_fuente: c.urlOficial || "https://www.duoc.cl"
        }));
        setDatosDuoc(adaptadosParaTest);
      })
      .catch(err => console.error("Error en test:", err.message));
  }, []);

  const preguntas = [
    { texto: "¿Qué materia se te facilita más?", opciones: [{t:"Matemáticas", c:"informatica"}, {t:"Idiomas", c:"turismo"}, {t:"Economía", c:"administracion"}, {t:"Dibujo", c:"diseno"}] },
    { texto: "¿Prefieres trabajar en...?", opciones: [{t:"Computador", c:"informatica"}, {t:"Aire libre", c:"turismo"}, {t:"Oficina", c:"administracion"}, {t:"Taller", c:"diseno"}] },
    { texto: "¿Cómo resuelves problemas?", opciones: [{t:"Con lógica", c:"informatica"}, {t:"Hablando", c:"turismo"}, {t:"Organizando", c:"administracion"}, {t:"Imaginando", c:"diseno"}] },
    { texto: "¿Te gustaría crear aplicaciones?", opciones: [{t:"Mucho", c:"informatica"}, {t:"No me atrae", c:"turismo"}, {t:"Tal vez", c:"administracion"}, {t:"Prefiero diseñarlas", c:"diseno"}] },
    { texto: "¿Te interesa el ecoturismo?", opciones: [{t:"Poco", c:"informatica"}, {t:"Me encanta", c:"turismo"}, {t:"Como negocio", c:"administracion"}, {t:"Para fotos", c:"diseno"}] },
    { texto: "¿Te ves liderando empresas?", opciones: [{t:"No", c:"informatica"}, {t:"En hoteles", c:"turismo"}, {t:"Sí, totalmente", c:"administracion"}, {t:"En agencias", c:"diseno"}] },
    { texto: "¿Te gusta la ciberseguridad?", opciones: [{t:"Sí", c:"informatica"}, {t:"No", c:"turismo"}, {t:"Para finanzas", c:"administracion"}, {t:"No sé", c:"diseno"}] },
    { texto: "¿Te gusta organizar eventos?", opciones: [{t:"No", c:"informatica"}, {t:"Sí, viajes", c:"turismo"}, {t:"Sí, corporativos", c:"administracion"}, {t:"Sí, creativos", c:"diseno"}] },
    { texto: "¿Qué software prefieres?", opciones: [{t:"Visual Studio", c:"informatica"}, {t:"Google Maps", c:"turismo"}, {t:"Excel", c:"administracion"}, {t:"Photoshop", c:"diseno"}] },
    { texto: "¿Cuál es tu prioridad laboral?", opciones: [{t:"Innovación", c:"informatica"}, {t:"Aventura", c:"turismo"}, {t:"Estabilidad", c:"administracion"}, {t:"Estética", c:"diseno"}] }
  ];

  const siguiente = () => {
    if (seleccion === null) return alert("Elige una opción");
    
    const cat = preguntas[paso].opciones[seleccion].c;
    setPuntajes(prev => ({ ...prev, [cat]: prev[cat] + 1 }));

    if (paso + 1 < preguntas.length) {
      setPaso(paso + 1);
      setSeleccion(null);
    } else {
      setFinalizado(true);
    }
  };

  const filtrarResultados = () => {
    const winner = Object.keys(puntajes).reduce((a, b) => puntajes[a] > puntajes[b] ? a : b);
    return datosDuoc
      .filter(c => c.nombre_carrera.toLowerCase().includes(winner.substring(0,4)))
      .slice(0, 3);
  };

  if (finalizado) return <ResultadoTest recomendaciones={filtrarResultados()} alReiniciar={() => window.location.reload()} />;

  return (
    <div className="contenedor-principal">
      <h1 className="titulo-superior">Test Vocación</h1>
      <main className="contenido-test">
        <h2 className="titulo-seccion">Descubre tu Vocación</h2>
        <BarraDeProgreso porcentaje={Math.round((paso / preguntas.length) * 100)} />
        
        <p className="pregunta-texto">{paso + 1}. {preguntas[paso].texto}</p>
        <div className="lista-opciones">
          {preguntas[paso].opciones.map((o, i) => (
            <label key={i} className="opcion-item">
              <input type="checkbox" checked={seleccion === i} onChange={() => setSeleccion(i)} />
              {o.t}
            </label>
          ))}
        </div>
        
        {/* Sección de navegación optimizada con react-icons */}
        <div className="botones-navegacion d-flex justify-content-between mt-4">
          <button 
            className="btn-nav btn-atras btn btn-secondary d-inline-flex align-items-center gap-2" 
            onClick={() => paso > 0 && setPaso(paso - 1)}
            disabled={paso === 0}
          >
            <HiArrowSmLeft size={20} /> Atrás
          </button>
          <button 
            className="btn-nav btn-siguiente btn btn-primary d-inline-flex align-items-center gap-2" 
            onClick={siguiente}
          >
            Siguiente <HiArrowSmRight size={20} />
          </button>
        </div>
      </main>
    </div>
  );
};

export default TestVocacional;