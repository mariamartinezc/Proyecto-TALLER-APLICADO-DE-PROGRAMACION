import React, { useState, useEffect } from 'react';
import { obtenerCarrerasMapeadas } from '../services/carrerasService'; 
import { FaTrashAlt, FaMapMarkerAlt } from 'react-icons/fa';

const formatearMoneda = (valor) => {
  if (!valor || valor === "0" || valor === 0) return "—";
  return new Intl.NumberFormat('es-CL', { 
    style: 'currency', 
    currency: 'CLP', 
    maximumFractionDigits: 0 
  }).format(valor);
};

export default function ExplorarCarreras() {
  const [todasLasCarreras, setTodasLasCarreras] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [carrera1, setCarrera1] = useState(null);
  const [carrera2, setCarrera2] = useState(null);
  const [carrera3, setCarrera3] = useState(null);

  useEffect(() => {
    const cargarCatalogo = async () => {
      try {
        const datosMapeados = await obtenerCarrerasMapeadas();
        setTodasLasCarreras(datosMapeados || []);
      } catch (err) {
        console.error("Error al cargar datos:", err);
      } finally {
        setCargando(false);
      }
    };
    cargarCatalogo();
  }, []);

  const manejarSeleccion = (numero, id) => {
    const carrera = todasLasCarreras.find(c => String(c.id) === String(id)) || null;
    if (numero === 1) setCarrera1(carrera);
    if (numero === 2) setCarrera2(carrera);
    if (numero === 3) setCarrera3(carrera);
  };

  const columnas = [carrera1, carrera2, carrera3];

  if (cargando) return <div className="text-center py-5"><div className="spinner-border text-success"></div></div>;

  return (
    <div className="container my-5 px-4" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h2 className="text-center mb-5 fw-bold" style={{ color: '#2d4a41', letterSpacing: '1px' }}>
        Comparador por carreras
      </h2>

      {/* --- SECCIÓN DE SELECCIÓN MANUAL --- */}
      <div className="p-4 mb-5 shadow-sm" style={{ backgroundColor: '#e2ece9', borderRadius: '15px', border: '1px solid #c5d6d0' }}>
        <div className="row g-4">
          {[1, 2, 3].map((num) => {
            const carreraActiva = num === 1 ? carrera1 : num === 2 ? carrera2 : carrera3;
            return (
              <div key={num} className="col-md-4">
                <div className="bg-white p-4 rounded-4 shadow-sm border-0 h-100 text-center">
                  <h6 className="fw-bold mb-3" style={{ color: '#4a635a' }}>Carrera {num}</h6>
                  <select 
                    className="form-select border-2 mb-3 text-center"
                    style={{ borderRadius: '10px', borderColor: '#e2ece9' }}
                    value={carreraActiva?.id || ""}
                    onChange={(e) => manejarSeleccion(num, e.target.value)}
                  >
                    <option value="">Seleccionar carrera</option>
                    {todasLasCarreras.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre_carrera}</option>
                    ))}
                  </select>
                  <button 
                    className="btn btn-sm px-4 d-flex align-items-center justify-content-center mx-auto"
                    style={{ backgroundColor: '#4a635a', color: 'white', borderRadius: '8px' }}
                    onClick={() => manejarSeleccion(num, null)}
                  >
                    <FaTrashAlt className="me-2" style={{ fontSize: '0.85rem' }} /> Limpiar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- TABLA DE COMPARACIÓN --- */}
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden mb-5">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: '#2d4a41', color: 'white' }}>
              <tr className="text-uppercase" style={{ fontSize: '0.85rem', letterSpacing: '1px' }}>
                <th className="p-4 border-0">Características</th>
                <th className="p-4 border-0 text-center">carrera 1</th>
                <th className="p-4 border-0 text-center">carrera 2</th>
                <th className="p-4 border-0 text-center">carrera 3</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr>
                <td className="p-4 fw-bold bg-light text-muted" style={{ width: '22%' }}>Nombre carrera</td>
                {columnas.map((col, i) => (
                  <td key={i} className="p-4 text-center fw-bold" style={{ color: '#2d4a41', width: '26%' }}>
                    {col ? col.nombre_carrera : <span className="text-light-emphasis fw-normal italic">Selecciona carrera...</span>}
                  </td>
                ))}
              </tr>
              <tr style={{ backgroundColor: '#f9fbfb' }}>
                <td className="p-4 fw-bold bg-light text-muted">Arancel Mensual</td>
                {columnas.map((col, i) => {
                  const aranceles = col?.sedes?.map(s => parseInt(s.arancel)).filter(a => a > 0) || [];
                  const mensual = aranceles.length > 0 ? aranceles.reduce((a, b) => a + b, 0) / aranceles.length : 0;
                  return (
                    <td key={i} className="p-4 text-center text-dark">
                      {col ? formatearMoneda(mensual) : "—"}
                    </td>
                  );
                })}
              </tr>
              <tr style={{ backgroundColor: '#f1f7f5' }}>
                <td className="p-4 fw-bold" style={{ color: '#198754', backgroundColor: '#eef6f2' }}>Arancel Anual</td>
                {columnas.map((col, i) => {
                  const aranceles = col?.sedes?.map(s => parseInt(s.arancel)).filter(a => a > 0) || [];
                  const anual = (aranceles.length > 0 ? aranceles.reduce((a, b) => a + b, 0) / aranceles.length : 0) * 12;
                  return (
                    <td key={i} className="p-4 text-center fw-bold" style={{ color: '#198754', fontSize: '1.1rem' }}>
                      {col ? `${formatearMoneda(anual)} /anual` : "—"}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-4 fw-bold bg-light text-muted">Matrícula</td>
                {columnas.map((col, i) => {
                  const mats = col?.sedes?.map(s => parseInt(s.matricula)).filter(m => m > 0) || [];
                  const matricula = mats.length > 0 ? mats[0] : 0;
                  return (
                    <td key={i} className="p-4 text-center">
                      {col ? formatearMoneda(matricula) : "—"}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-4 fw-bold bg-light text-muted">Sedes</td>
                {columnas.map((col, i) => (
                  <td key={i} className="p-4 text-center">
                    {col?.sedes?.map((s, idx) => (
                      <span key={idx} className="badge bg-white text-dark border p-2 m-1">
                        <FaMapMarkerAlt className="text-danger me-1" /> {s.sede}
                      </span>
                    )) || "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 fw-bold bg-light text-muted border-bottom-0">Duración</td>
                {columnas.map((col, i) => (
                  <td key={i} className="p-4 text-center border-bottom-0">
                    {col ? <span className="badge p-2" style={{ backgroundColor: '#2d4a41' }}>{col.duracion}</span> : "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}