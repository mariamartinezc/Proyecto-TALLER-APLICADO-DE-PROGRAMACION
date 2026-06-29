import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const Beneficios = () => {
  const [beneficios, setBeneficios] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados de los filtros
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSel, setCategoriaSel] = useState('Todos');
  const [soloIp, setSoloIp] = useState(false);
  const [rshUsuario, setRshUsuario] = useState(100);

  useEffect(() => {
    const traerBeneficios = async () => {
      try {
        setCargando(true);
        const { data, error } = await supabase.from('beneficios').select('*');
        if (error) throw error;
        setBeneficios(data || []);
        setFiltrados(data || []);
      } catch (err) {
        console.error('Error al cargar beneficios:', err.message);
      } finally {
        setCargando(false);
      }
    };
    traerBeneficios();
  }, []);

  // Lógica de filtrado en tiempo real
  useEffect(() => {
    let resultado = beneficios.filter((b) => {
      const coincideTexto = b.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                            b.tipo.toLowerCase().includes(busqueda.toLowerCase());
      const coincideCategoria = categoriaSel === 'Todos' || b.categoria === categoriaSel;
      const coincideIp = !soloIp || b.aplica_ip === true;
      const coincideRsh = rshUsuario >= b.rsh_maximo;

      return coincideTexto && coincideCategoria && coincideIp && coincideRsh;
    });
    setFiltrados(resultado);
  }, [busqueda, categoriaSel, soloIp, rshUsuario, beneficios]);

  if (cargando) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <span className="ms-2 text-secondary">Cargando catálogo de beneficios...</span>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ minHeight: '80vh' }}>
      {/* TÍTULO */}
      <div className="text-center mb-5">
        <h1 className="fw-bold text-dark">Becas y Financiamiento Superior</h1>
        <p className="text-muted">Encuentra los beneficios estatales e internos disponibles para tu perfil en Chile</p>
      </div>

      {/* PANEL DE FILTROS */}
      <div className="card shadow-sm border-0 p-4 mb-4 bg-white rounded-3">
        <div className="row g-3 align-items-center">
          {/* Buscador */}
          <div className="col-md-4">
            <label className="form-label fw-bold text-secondary">Buscar por nombre o entidad</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ej: Gratuidad, Junaeb..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          {/* Categoría */}
          <div className="col-md-3">
            <label className="form-label fw-bold text-secondary">Categoría</label>
            <select className="form-select" value={categoriaSel} onChange={(e) => setCategoriaSel(e.target.value)}>
              <option value="Todos">Todas las categorías</option>
              <option value="Arancel">Arancel</option>
              <option value="Mantención">Mantención</option>
              <option value="Crédito / Copago">Créditos</option>
            </select>
          </div>
          {/* RSH Slider */}
          <div className="col-md-3">
            <label className="form-label fw-bold text-secondary">Mi Tramo RSH: {rshUsuario}%</label>
            <input 
              type="range" 
              className="form-range" 
              min="40" max="100" step="10"
              value={rshUsuario}
              onChange={(e) => setRshUsuario(Number(e.target.value))}
            />
          </div>
          {/* Check IP */}
          <div className="col-md-2 text-md-center pt-4">
            <div className="form-check form-switch d-inline-block">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="checkIp" 
                checked={soloIp} 
                onChange={(e) => setSoloIp(e.target.checked)}
              />
              <label className="form-check-label fw-bold text-secondary" htmlFor="checkIp">Aplica IP</label>
            </div>
          </div>
        </div>
      </div>

      {/* LISTADO DE TARJETAS */}
      <div className="row">
        {filtrados.length > 0 ? (
          filtrados.map((b) => (
            <div className="col-md-6 col-lg-4 mb-4" key={b.nombre}>
              <div className="card h-100 shadow-sm border-0 rounded-3 card-hover" style={{ transition: 'all 0.2s' }}>
                <div className="card-body d-flex flex-column">
                  {/* BADGES SUPERIORES */}
                  <div className="d-flex justify-content-between mb-2">
                    <span className="badge bg-primary rounded-pill px-3 py-1.5">{b.categoria}</span>
                    <span className="badge bg-light text-dark border rounded-pill px-2">RSH: ≤ {b.rsh_maximo}%</span>
                  </div>

                  <h5 className="card-title fw-bold text-dark mt-2 mb-1">{b.nombre}</h5>
                  <p className="text-success small fw-semibold mb-3">{b.tipo}</p>
                  
                  <p className="card-text text-secondary small flex-grow-1">
                    <strong>Cobertura:</strong> {b.cobertura}
                  </p>
                  
                  <hr className="text-muted opacity-25" />
                  
                  <p className="card-text text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                    <strong>Requisitos clave:</strong> {b.requisitos}
                  </p>

                  {/* INDICADORES VISUALES EXTRA */}
                  <div className="mt-3 pt-2 d-flex gap-2 border-top border-light">
                    {b.aplica_ip && <span className="badge bg-success-subtle text-success border border-success-subtle">Valido en Duoc UC</span>}
                    {!b.exige_paes && <span className="badge bg-info-subtle text-info border border-info-subtle">Sin PAES</span>}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-5">
            <h5 className="text-secondary">No se encontraron beneficios con los filtros seleccionados.</h5>
            <p className="text-muted small">Prueba subiendo el porcentaje de tu RSH o cambiando los criterios de búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Beneficios;