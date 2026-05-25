import { supabase } from '../supabaseClient';

/**
 * Descarga todas las carreras de Supabase y las transforma al esquema unificado 
 * que utilizan el Buscador, la Tabla, el Mapa y el Test Vocacional.
 */
export const obtenerCarrerasMapeadas = async () => {
  const { data, error } = await supabase
    .from('carreras')
    .select(`
      *,
      carreras_sedes (
        sedes (
          nombre,
          latitud,
          longitud
        )
      )
    `);

  if (error) throw error;

  return (data || []).map(c => ({
    id: c.id,
    nombre_carrera: c.nombre || "",
    institucion: c.institucion || "Duoc UC",
    escuela: c.escuela || "General",
    duracion: c.duracion_semestre ? `${c.duracion_semestre} Semestres` : "No disponible",
    descripcion: c.descripcion || "No hay descripción disponible actualmente.",
    
    // Estadísticas
    ingresoCuartoAno: c.ingreso_4ano || c.ingreso_promedio || null,
    empleabilidad1erAno: c.empleabilidad_1er_anio || null,
    empleabilidad2doAno: c.empleabilidad_2do_anio || null,
    
    // Links oficiales
    urlOficial: c.url_duoc,
    urlMalla: c.malla_pdf_url,
    
    // Detalles técnicos para la ficha (Modal)
    titulo: c.titulo || "No especificado",
    jornada: c.jornada || "Diurna",
    modalidad: c.modalidad || "Presencial",
    
    // Sedes asociadas mapeadas correctamente
    sedes: c.carreras_sedes?.map(vinculo => ({
      sede: vinculo.sedes?.nombre || "",
      matricula: c.matricula_referencial || 0,
      arancel: c.arancel_anual || 0,
      lat: parseFloat(vinculo.sedes?.latitud),
      lng: parseFloat(vinculo.sedes?.longitud)
    })).filter(s => s.sede) || []
  }));
};