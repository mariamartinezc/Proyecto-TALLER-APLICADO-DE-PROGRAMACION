import React, { useState, useEffect } from 'react';
import Buscador from '../componentes/Buscador';
import TablaCarreras from '../componentes/TablaCarreras';
import SeccionBienvenida from '../componentes/SeccionBienvenida';

// 1. Reemplazamos la importación del JSON local por el cliente de Supabase
import { supabase } from '../supabaseClient'; 

// Función auxiliar para validar y limpiar los links que vienen de la Base de Datos
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
  // 2. Creamos un estado para almacenar los datos que traerá la API y otro para la pantalla de carga
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

  // 3. Efecto para conectarse y buscar los datos en la API de Supabase al cargar el componente
  useEffect(() => {
    async function obtenerDatosSupabase() {
      try {
        // Consultamos la tabla 'carreras' y traemos sus sedes vinculadas
        const { data, error } = await supabase
          .from('carreras')
          .select(`
            *,
            carreras_sedes (
              sedes (
                nombre
              )
            )
          `);

        if (error) throw error;

        if (data) {
          // Mapeamos las columnas de tu BD para que encajen EXACTO con las propiedades que usaba tu JSON original
          const mapeados = data.map(carreraDB => ({
            id: carreraDB.id,
            nombre_carrera: carreraDB.nombre || "",
            institucion: carreraDB.institucion || "Duoc UC", 
            escuela: carreraDB.escuela || "General",
            duracion: carreraDB.duracion_semestre ? `${carreraDB.duracion_semestre} Semestres` : "No disponible",
            descripcion: carreraDB.descripcion || "No hay una descripción detallada disponible.",
            
            // Datos estadísticos y de empleabilidad
            ingresoCuartoAno: carreraDB.ingreso_4ano || carreraDB.ingreso_promedio || null,
            empleabilidad1erAno: carreraDB.empleabilidad_1er_anio || null, 
            empleabilidad2doAno: carreraDB.empleabilidad_2do_anio || null,

            // Tus nuevas columnas de URLs mapeadas y formateadas para los botones de la ficha
            urlOficial: formatearURL(carreraDB.url_duoc),
            urlMalla: formatearURL(carreraDB.malla_pdf_url),
            
            titulo: carreraDB.titulo || "No especificado",
            jornada: carreraDB.jornada || "Diurna / Vespertina",
            modalidad: carreraDB.modalidad || "Presencial",

            // Estructuramos las sedes de la misma forma que venían en tu datos.json
            sedes: carreraDB.carreras_sedes?.map(vinculo => {
              return {
                sede: vinculo.sedes?.nombre || "",
                matricula: carreraDB.matricula_referencial || 0,
                arancel: carreraDB.arancel_anual || 0 // Mapeado a s.arancel para que funcione tu filtro original
              };
            }).filter(s => s.sede) || []
          }));

          setDatosScraping(mapeados);
        }
      } catch (err) {
        console.error("Error cargando datos desde la API de Supabase:", err.message);
      } finally {
        setCargando(false);
      }
    }

    obtenerDatosSupabase();
  }, []);

  // 4. Tu lógica original de opciones de búsqueda (Sigue intacta)
  const instituciones = [...new Set(datosScraping.map(d => d.institucion).filter(Boolean))];
  const escuelas = [...new Set(datosScraping.map(d => d.escuela || "General"))];
  const carrerasNombres = [...new Set(datosScraping.map(d => d.nombre_carrera).filter(Boolean))];
  const regiones = ["Metropolitana", "Valparaíso", "Biobío"];
  const sedesUnicas = [...new Set(datosScraping.flatMap(d => d.sedes ? d.sedes.map(s => s.sede) : []).filter(Boolean).map(s => s.toUpperCase()))];

  // 5. Tu lógica original de filtrado de carreras (Sigue intacta)
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

  // Pantalla de carga preventiva mientras se conecta y descarga la info de la API
  if (cargando) {
    return (
      <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h5 className="text-secondary fw-normal">Conectando con la API de Supabase...</h5>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      
      
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