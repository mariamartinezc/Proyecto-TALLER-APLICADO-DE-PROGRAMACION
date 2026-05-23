import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from '../supabaseClient'; 

// ================================
// ICONOS LEAFLET
// ================================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

// ================================
// FUNCIÓN DISTANCIA
// ================================
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ================================
// MOVER MAPA AUTOMÁTICAMENTE
// ================================
function CambiarVistaMapa({ centro }) {
  const mapa = useMap();
  useEffect(() => {
    mapa.setView(centro, 12);
  }, [centro, mapa]);
  return null;
}

// ================================
// COMPONENTE PRINCIPAL
// ================================
function MapaSedes() {
  const [ubicacionUsuario, setUbicacionUsuario] = useState([-33.4489, -70.6693]);
  const [sedesCercanas, setSedesCercanas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorUbicacion, setErrorUbicacion] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setErrorUbicacion("Tu navegador no soporta geolocalización.");
      setCargando(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latUsuario = position.coords.latitude;
        const lngUsuario = position.coords.longitude;
        setUbicacionUsuario([latUsuario, lngUsuario]);

        try {
          const { data, error } = await supabase
            .from('carreras')
            .select(`
              nombre,
              matricula_referencial,
              arancel_anual,
              carreras_sedes (
                sedes ( nombre, latitud, longitud )
              )
            `);

          if (error) throw error;

          const todasLasSedes = [];

          data.forEach((carrera) => {
            carrera.carreras_sedes?.forEach((vinculo) => {
              const sede = vinculo.sedes;
              if (sede && sede.latitud && sede.longitud) {
                const latSede = parseFloat(sede.latitud);
                const lngSede = parseFloat(sede.longitud);

                if (!isNaN(latSede) && !isNaN(lngSede)) {
                  const distancia = calcularDistancia(latUsuario, lngUsuario, latSede, lngSede);
                  todasLasSedes.push({
                    sede: sede.nombre,
                    carrera: carrera.nombre,
                    matricula: carrera.matricula_referencial || 0,
                    arancel: carrera.arancel_anual || 0,
                    lat: latSede,
                    lng: lngSede,
                    distancia
                  });
                }
              }
            });
          });

          todasLasSedes.sort((a, b) => a.distancia - b.distancia);
          setSedesCercanas(todasLasSedes.slice(0, 5));
        } catch (err) {
          console.error("Error en mapa con Supabase:", err.message);
        } finally {
          setCargando(false);
        }
      },
      (error) => {
        console.log(error);
        setErrorUbicacion("No se pudo obtener tu ubicación.");
        setCargando(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  if (cargando) {
    return (
      <div className="mapa-container">
        <h2 className="titulo-mapa">Obteniendo ubicación y sedes...</h2>
      </div>
    );
  }

  if (errorUbicacion) {
    return (
      <div className="mapa-container">
        <h2 className="titulo-mapa">{errorUbicacion}</h2>
      </div>
    );
  }

  return (
    <div className="mapa-container">
      <h2 className="titulo-mapa">Sedes más cercanas a ti</h2>
      <MapContainer center={ubicacionUsuario} zoom={12} className="leaflet-container">
        <CambiarVistaMapa centro={ubicacionUsuario} />
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        <Marker position={ubicacionUsuario}>
          <Popup>
            <div>
              <h3 className="popup-titulo">Tu ubicación actual</h3>
              <p className="popup-texto">Lat: {ubicacionUsuario[0].toFixed(5)}</p>
              <p className="popup-texto">Lng: {ubicacionUsuario[1].toFixed(5)}</p>
            </div>
          </Popup>
        </Marker>

        {sedesCercanas.map((sede, index) => (
          <Marker key={index} position={[sede.lat, sede.lng]}>
            <Popup>
              <div>
                <h3 className="popup-titulo">{sede.sede}</h3>
                <p className="popup-texto"><strong>Carrera:</strong> {sede.carrera}</p>
                <p className="popup-texto"><strong>Matrícula:</strong> ${parseInt(sede.matricula).toLocaleString('es-CL')}</p>
                <p className="popup-texto"><strong>Arancel:</strong> ${parseInt(sede.arancel).toLocaleString('es-CL')}</p>
                <p className="popup-texto"><strong>Distancia:</strong> {sede.distancia.toFixed(2)} km</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapaSedes;