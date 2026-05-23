import React, { useState, useEffect } from 'react';
import NavbarPrincipal from '../componentes/NavbarPrincipal';
import Buscador from '../componentes/Buscador';
import TablaCarreras from '../componentes/TablaCarreras';
import SeccionBienvenida from '../componentes/SeccionBienvenida';
import { supabase } from '../supabaseClient'; 

// Función para limpiar y asegurar que las URLs sean enlaces válidos y clickeables
const formatearURL = (url) => {
  if (!url || typeof url !== 'string' || url.trim() === '' || url.trim().toLowerCase() === 'no disponible') {
    return null; 
  }
  let urlLimpia = url.trim();
  if (!urlLimpia.startsWith('http://') && !urlLimpia.startsWith('https://')) {
    return `https://${urlLimpia}`;
  }
  return urlLimpia;
};

function Home() {
  const [datosScraping, setDatosScraping] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [filtros, setFiltros] = useState({
    palabraClave: "",
    arancelMax: 10000000,
    region: "Todas",
    institucion: "Todas",
    sede: "Todas",
    escuela: "Todas",
    carrera: "Todas"
  });

  useEffect(() => {
    async function obtenerDatosSupabase() {
      try {
        const { data, error } = await supabase
          .from('carreras')
          .select(`
            *,
            carreras_sedes (
              sedes (
                nombre, latitud, longitud
              )
            )
          `);

        if (error) throw error;

        if (data) {
          const mapeados = data.map(carreraDB => ({
            id: carreraDB.id,
            nombre_carrera: carreraDB.nombre || "",
            institucion: carreraDB.institucion || "Duoc UC", 
            escuela: carreraDB.escuela || "General",
            duracion: carreraDB.duracion_semestre ? `${carreraDB.duracion_semestre} Semestres` : "No disponible",
            descripcion: carreraDB.descripcion || "No hay una descripción detallada disponible para este programa.",
            
            ingresoCuartoAno: carreraDB.ingreso_4ano || carreraDB.ingreso_promedio || null,
            empleabilidad1erAno: carreraDB.empleabilidad_1er_anio || null, 
            empleabilidad2doAno: carreraDB.empleabilidad_2do_anio || null,

            // =========================================================================
            // AQUÍ PUSIMOS TUS NOMBRES EXACTOS DE SUPABASE
            // =========================================================================
            urlOficial: formatearURL(carreraDB.url_duoc),
            urlMalla: formatearURL(carreraDB.malla_pdf_url),
            
            titulo: carreraDB.titulo || carreraDB.titulo_otorgado || "No especificado",
            jornada: carreraDB.jornada || "Diurna / Vespertina",
            modalidad: carreraDB.modalidad || "Presencial",

            sedes: carreraDB.carreras_sedes?.map(vinculo => {
              const montoArancelBD = parseInt(carreraDB.arancel_anual || 0);
              return {
                sede: vinculo.sedes?.nombre || "",
                matricula: carreraDB.matricula_referencial || 0,
                arancelMensual: montoArancelBD 
              };
            }).filter(s => s.sede) || []
          }));

          setDatosScraping(mapeados);
        }
      } catch (err) {
        console.error("Error cargando Supabase en Home:", err.message);
      } finally {
        setCargando(false);
      }
    }

    obtenerDatosSupabase();
  }, []);

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
    const cumpleArancel = item.sedes && item.sedes.some(s => (parseInt(s.arancelMensual || 0) * 12) <= filtros.arancelMax);
    const cumpleCarrera = filtros.carrera === "Todas" || item.nombre_carrera === filtros.carrera;
    const cumpleEscuela = filtros.escuela === "Todas" || (item.escuela || "General") === filtros.escuela;

    return cumpleTexto && cumpleInst && cumpleSede && cumpleArancel && cumpleCarrera && cumpleEscuela;
  });

  if (cargando) {
    return (
      <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h5 className="text-secondary fw-normal">Sincronizando información de carreras...</h5>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <NavbarPrincipal alBuscar={(v) => setFiltros(f => ({...f, palabraClave: v}))} />
      <SeccionBienvenida />
      <Buscador 
        filtros={filtros} 
        setFiltros={setFiltros} 
        opciones={{ regiones, instituciones, sedes: sedesUnicas, escuelas, carreras: carrerasNombres }}
      />
      <div className="container-fluid px-5 mt-4 pb-5">
        <h5 className="text-dark fw-bold mb-3 border-bottom pb-2">Comparativa de Carreras</h5>
        <TablaCarreras carreras={carrerasFiltradas} filtroSede={filtros.sede} />
      </div>
    </div>
  );
}

export default Home;