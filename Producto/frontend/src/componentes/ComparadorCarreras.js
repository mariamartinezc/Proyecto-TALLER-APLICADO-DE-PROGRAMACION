import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'tu-clave-anonima';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const formatearMoneda = (valor) => {
  if (!valor || valor === "0" || valor === 0) return "No especificado";
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(valor);
};

export default function ComparadorCarrerasDesdeSupabase({ idsCarrerasSeleccionadas, alCerrar }) {
  const [carreras, setCarreras] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarCarreras = async () => {
      if (!idsCarrerasSeleccionadas || idsCarrerasSeleccionadas.length === 0) {
        setCarreras([]);
        return;
      }

      setCargando(true);
      setError(null);

      try {
        const idsFiltrados = idsCarrerasSeleccionadas.slice(0, 3);
        const { data, error: supabaseError } = await supabase
          .from('carreras')
          .select('*')
          .in('id', idsFiltrados);

        if (supabaseError) throw supabaseError;
        setCarreras(data || []);
      } catch (err) {
        console.error("Error obteniendo datos desde Supabase:", err);
        setError("No se pudieron cargar los datos para la comparación.");
      } finally {
        setCargando(false);
      }
    };

    cargarCarreras();
  }, [idsCarrerasSeleccionadas]);

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-md border border-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mb-3"></div>
        <p className="text-gray-500 text-sm font-medium">Consultando datos en Supabase...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 text-center">
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  if (carreras.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-500 font-medium">Selecciona hasta 3 carreras para comenzar la comparación.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Comparador de Carreras</h2>
          <p className="text-xs text-slate-400 mt-0.5">Datos obtenidos en vivo desde Supabase ({carreras.length} seleccionadas)</p>
        </div>
        {alCerrar && (
          <button 
            onClick={alCerrar}
            className="text-slate-400 hover:text-white text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            Limpiar Selección
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-200">
              <th className="w-1/4 p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-slate-100/50">
                Características
              </th>
              {carreras.map((carrera, index) => (
                <th key={carrera.id || index} className="w-1/4 p-4 text-left border-l border-gray-200 align-top">
                  <span className="inline-block text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full mb-1">
                    Opción {index + 1}
                  </span>
                  <h3 className="font-bold text-gray-900 text-base line-clamp-2 leading-snug">
                    {carrera.nombre_carrera}
                  </h3>
                  <p className="text-xs text-blue-600 font-medium mt-1">{carrera.institucion || 'Duoc UC'}</p>
                </th>
              ))}
              {carreras.length < 3 && Array.from({ length: 3 - carreras.length }).map((_, i) => (
                <th key={`empty-th-${i}`} className="w-1/4 p-4 border-l border-gray-100 bg-gray-50/50"></th>
              ))}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-200 text-sm">
            <tr>
              <td className="p-4 font-semibold text-gray-700 bg-slate-50/50">Duración</td>
              {carreras.map((carrera) => (
                <td key={carrera.id} className="p-4 border-l border-gray-200 text-gray-900 font-medium">
                  {carrera.duracion}
                </td>
              ))}
              {carreras.length < 3 && Array.from({ length: 3 - carreras.length }).map((_, i) => (
                <td key={`empty-dur-${i}`} className="p-4 border-l border-gray-100 bg-gray-50/30"></td>
              ))}
            </tr>

            <tr>
              <td className="p-4 font-semibold text-gray-700 bg-slate-50/50">Malla Curricular</td>
              {carreras.map((carrera) => (
                <td key={carrera.id} className="p-4 border-l border-gray-200">
                  {carrera.malla_pdf ? (
                    <a href={carrera.malla_pdf} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors">
                      📄 Descargar PDF
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No disponible</span>
                  )}
                </td>
              ))}
              {carreras.length < 3 && Array.from({ length: 3 - carreras.length }).map((_, i) => (
                <td key={`empty-malla-${i}`} className="p-4 border-l border-gray-100 bg-gray-50/30"></td>
              ))}
            </tr>

            <tr className="bg-slate-100/70 font-bold text-xs text-slate-700 uppercase tracking-wider">
              <td colSpan="4" className="p-2 pl-4">Sedes, Costos y Ubicación</td>
            </tr>

            <tr>
              <td className="p-4 font-semibold text-gray-700 bg-slate-50/50">Sedes Disponibles</td>
              {carreras.map((carrera) => (
                <td key={carrera.id} className="p-4 border-l border-gray-200 align-top">
                  {carrera.sedes && carrera.sedes.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-1">
                      {carrera.sedes.map((s, idx) => (
                        <span key={idx} title={`Región: ${s.region}`} className="text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {s.sede}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Sin sedes registradas</span>
                  )}
                </td>
              ))}
              {carreras.length < 3 && Array.from({ length: 3 - carreras.length }).map((_, i) => (
                <td key={`empty-sedes-${i}`} className="p-4 border-l border-gray-100 bg-gray-50/30"></td>
              ))}
            </tr>

            <tr>
              <td className="p-4 font-semibold text-gray-700 bg-slate-50/50">Arancel Promedio</td>
              {carreras.map((carrera) => {
                const aranceles = carrera.sedes?.map(s => parseInt(s.arancel)).filter(a => a > 0) || [];
                const promedio = aranceles.length > 0 ? aranceles.reduce((a, b) => a + b, 0) / aranceles.length : 0;
                return (
                  <td key={carrera.id} className="p-4 border-l border-gray-200 font-semibold text-slate-900">
                    {promedio > 0 ? `${formatearMoneda(promedio)} /anual` : 'Consultar'}
                  </td>
                );
              })}
              {carreras.length < 3 && Array.from({ length: 3 - carreras.length }).map((_, i) => (
                <td key={`empty-aran-${i}`} className="p-4 border-l border-gray-100 bg-gray-50/30"></td>
              ))}
            </tr>

            <tr className="bg-slate-100/70 font-bold text-xs text-slate-700 uppercase tracking-wider">
              <td colSpan="4" className="p-2 pl-4">Descripción y Proyección Profesional</td>
            </tr>

            <tr>
              <td className="p-4 font-semibold text-gray-700 bg-slate-50/50 align-top">Perfil de Egreso</td>
              {carreras.map((carrera) => (
                <td key={carrera.id} className="p-4 border-l border-gray-200 text-xs text-gray-600 align-top text-justify">
                  <div className="max-h-64 overflow-y-auto leading-relaxed pr-1 whitespace-pre-line">
                    {carrera.descripcion}
                  </div>
                </td>
              ))}
              {carreras.length < 3 && Array.from({ length: 3 - carreras.length }).map((_, i) => (
                <td key={`empty-desc-${i}`} className="p-4 border-l border-gray-100 bg-gray-50/30"></td>
              ))}
            </tr>

            <tr>
              <td className="p-4 font-semibold text-gray-700 bg-slate-50/50 align-top">Campo Ocupacional</td>
              {carreras.map((carrera) => (
                <td key={carrera.id} className="p-4 border-l border-gray-200 text-xs text-gray-600 align-top text-justify">
                  <div className="max-h-64 overflow-y-auto leading-relaxed pr-1 whitespace-pre-line">
                    {carrera.campo_laboral}
                  </div>
                </td>
              ))}
              {carreras.length < 3 && Array.from({ length: 3 - carreras.length }).map((_, i) => (
                <td key={`empty-campo-${i}`} className="p-4 border-l border-gray-100 bg-gray-50/30"></td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}