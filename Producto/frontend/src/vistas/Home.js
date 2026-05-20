import React, { useState } from 'react';
import NavbarPrincipal from '../componentes/NavbarPrincipal';
import Buscador from '../componentes/Buscador';
import TablaCarreras from '../componentes/TablaCarreras';
import SeccionBienvenida from '../componentes/SeccionBienvenida';
import datosScraping from '../datos.json';

function Home() {
  const [filtros, setFiltros] = useState({
    palabraClave: "",
    arancelMax: 10000000,
    region: "Todas",
    institucion: "Todas",
    sede: "Todas",
    escuela: "Todas",
    carrera: "Todas"
  });

  const instituciones = [...new Set(datosScraping.map(d => d.institucion).filter(Boolean))];
  const escuelas = [...new Set(datosScraping.map(d => d.escuela || "General"))];
  const carrerasNombres = [...new Set(datosScraping.map(d => d.nombre_carrera).filter(Boolean))];
  const regiones = ["Metropolitana", "Valparaíso", "Biobío"];
  const sedesUnicas = [...new Set(datosScraping.flatMap(d => d.sedes ? d.sedes.map(s => s.sede) : []).filter(Boolean).map(s => s.toUpperCase()))];

  const carrerasFiltradas = datosScraping.filter(item => {
    if (!item) return false;
    const cumpleTexto = (item.nombre_carrera || "").toLowerCase().includes(filtros.palabraClave.toLowerCase());
    const cumpleInst = filtros.institucion === "Todas" || item.institucion === filtros.institucion;
    const cumpleSede = filtros.sede === "Todas" || (item.sedes && item.sedes.some(s => s.sede && s.sede.toUpperCase() === filtros.sede.toUpperCase()));
    const cumpleArancel = item.sedes && item.sedes.some(s => parseInt(s.arancel || 0) <= filtros.arancelMax);
    const cumpleCarrera = filtros.carrera === "Todas" || item.nombre_carrera === filtros.carrera;
    const cumpleEscuela = filtros.escuela === "Todas" || (item.escuela || "General") === filtros.escuela;

    return cumpleTexto && cumpleInst && cumpleSede && cumpleArancel && cumpleCarrera && cumpleEscuela;
  });

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <NavbarPrincipal alBuscar={(v) => setFiltros(f => ({...f, palabraClave: v}))} />
      
      <SeccionBienvenida />

      <Buscador 
        filtros={filtros} 
        setFiltros={setFiltros} 
        opciones={{ regiones, instituciones, sedes: sedesUnicas, escuelas, carreras: carrerasNombres }}
      />

      <div className="container-fluid px-5 mt-5 pb-5">
        <h4 className="text-secondary fw-bold mb-3 border-bottom pb-2">Comparativa de Carreras</h4>
        <TablaCarreras carreras={carrerasFiltradas} filtroSede={filtros.sede} />
      </div>
    </div>
  );
}

export default Home;