import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
// FUNCIÓN DISTANCIA (Haversine)
// ================================
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ================================
// CONTROLADOR DINÁMICO DE VISTA
// ================================
function CambiarVistaMapa({ centro, zoom }) {
  const mapa = useMap();
  useEffect(() => {
    if (centro) {
      mapa.setView(centro, zoom);
    }
  }, [centro, zoom, mapa]);
  return null;
}

// ================================
// COMPONENTE PRINCIPAL
// ================================
function MapaSedes({ carreras }) {
  // Estado inicial nulo para saber si ya tenemos la ubicación real del usuario
  const [ubicacionUsuario, setUbicacionUsuario] = useState(null);
  const [sedesCercanas, setSedesCercanas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorUbicacion, setErrorUbicacion] = useState("");

  // Configuraciones de rango ajustables
  const RADIO_MAXIMO_KM = 25; // Radio extendido para regiones donde las distancias son mayores
  const ZOOM_MAPA = 11;       // Nivel de zoom adecuado para abarcar el radio

  useEffect(() => {
    if (!carreras || carreras.length === 0) return;

    if (!navigator.geolocation) {
      setErrorUbicacion("Tu navegador no soporta geolocalización.");
      setCargando(false);
      return;
    }

    // OBTENER UBICACIÓN EN TIEMPO REAL
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latUsuario = position.coords.latitude;
        const lngUsuario = position.coords.longitude;

        console.log("Ubicación detectada en región:", latUsuario, lngUsuario);
        setUbicacionUsuario([latUsuario, lngUsuario]);
        
        const todasLasSedes = [];

        carreras.forEach((carrera) => {
          if (!carrera.sedes) return;
          carrera.sedes.forEach((sede) => {
            const latSede = parseFloat(sede.lat || sede.latitud);
            const lngSede = parseFloat(sede.lng || sede.longitud);

            if (latSede && lngSede && !isNaN(latSede) && !isNaN(lngSede)) {
              const distancia = calcularDistancia(
                latUsuario,
                lngUsuario,
                latSede,
                lngSede
              );

              // Filtra sedes dentro del radio sin importar en qué región de Chile estén
              if (distancia <= RADIO_MAXIMO_KM) {
                todasLasSedes.push({
                  ...sede,
                  lat: latSede,
                  lng: lngSede,
                  carrera: carrera.nombre_carrera,
                  institucion: carrera.institucion || "No especificada",
                  distancia
                });
              }
            }
          });
        });

        // Ordenar por cercanía absoluta
        todasLasSedes.sort((a, b) => a.distancia - b.distancia);
        setSedesCercanas(todasLasSedes);
        setCargando(false);
      },
      (error) => {
        console.error("Error de geolocalización:", error);
        setErrorUbicacion(
          "Por favor, permite el acceso a tu ubicación para mostrar las sedes de tu región."
        );
        setCargando(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // 15 segundos de tolerancia para GPS de teléfonos en regiones
        maximumAge: 0
      }
    );
  }, [carreras]);

  // Pantallas de transición necesarias para asegurar que el mapa no se monte a ciegas en Santiago
  if (cargando) {
    return (
      <div className="mapa-container text-center py-4">
        <h2 className="titulo-mapa">Detectando tu ubicación geográfica...</h2>
        <div className="spinner-border text-success mt-2"></div>
      </div>
    );
  }

  if (errorUbicacion || !ubicacionUsuario) {
    return (
      <div className="mapa-container p-4 text-center">
        <h2 className="titulo-mapa text-danger">{errorUbicacion || "Ubicación no disponible"}</h2>
      </div>
    );
  }

  return (
    <div className="mapa-container">
      <h2 className="titulo-mapa mb-3">Sedes en tu zona (Radio: {RADIO_MAXIMO_KM} km)</h2>

      {/* El mapa ahora nace centrado directamente en las coordenadas reales obtenidas */}
      <MapContainer center={ubicacionUsuario} zoom={ZOOM_MAPA} className="leaflet-container">
        <CambiarVistaMapa centro={ubicacionUsuario} zoom={ZOOM_MAPA} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* LÍMITE VISUAL DEL RADIO EN TU REGIÓN */}
        <Circle
          center={ubicacionUsuario}
          radius={RADIO_MAXIMO_KM * 1000}
          pathOptions={{
            color: '#320afd',
            fillColor: '#4bb33b',
            fillOpacity: 0.12,
            weight: 1.5
          }}
        />

        {/* MARCADOR USUARIO */}
        <Marker position={ubicacionUsuario}>
          <Popup>
            <div className="text-center">
              <strong>Tu Posición</strong>
            </div>
          </Popup>
        </Marker>

        {/* MARCADORES DE LAS SEDES REGIONALES */}
        {sedesCercanas.map((sede, index) => (
          <Marker key={index} position={[sede.lat, sede.lng]}>
            <Popup>
              <div>
                <h3 className="popup-titulo" style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#00ff26' }}>
                  {sede.sede}
                </h3>
                <p className="popup-texto" style={{ margin: '0 0 4px 0', color: '#0368d4' }}>
                  <strong>Institución:</strong> {sede.institucion}
                </p>
               
                <p className="popup-texto" style={{ margin: 0, fontWeight: 'bold', color: '#c03e27' }}>
                  <strong>Distancia:</strong> {sede.distancia.toFixed(2)} km
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapaSedes;