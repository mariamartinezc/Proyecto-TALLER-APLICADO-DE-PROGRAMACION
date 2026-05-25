// src/componentes/MapaSedes.js
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
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
// FUNCIÓN DISTANCIA
// ================================
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371;
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
// COMPONENTE PRINCIPAL (Recibe 'carreras' por props)
// ================================
function MapaSedes({ carreras }) {
  // Santiago por defecto
  const [ubicacionUsuario, setUbicacionUsuario] = useState([-33.4489, -70.6693]);
  // Sedes cercanas
  const [sedesCercanas, setSedesCercanas] = useState([]);
  // Estado carga
  const [cargando, setCargando] = useState(true);
  // Error ubicación
  const [errorUbicacion, setErrorUbicacion] = useState("");

  useEffect(() => {
    // Si aún no se cargan las carreras desde la vista superior, esperamos
    if (!carreras || carreras.length === 0) return;

    if (!navigator.geolocation) {
      setErrorUbicacion("Tu navegador no soporta geolocalización.");
      setCargando(false);
      return;
    }

    // ================================
    // OBTENER UBICACIÓN
    // ================================
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latUsuario = position.coords.latitude;
        const lngUsuario = position.coords.longitude;

        console.log("Ubicación usuario:", latUsuario, lngUsuario);

        setUbicacionUsuario([latUsuario, lngUsuario]);
        const todasLasSedes = [];

        // ================================
        // RECORRER ARREGLO DINÁMICO DE SUPABASE
        // ================================
        carreras.forEach((carrera) => {
          if (!carrera.sedes) return;
          carrera.sedes.forEach((sede) => {
            // Evaluamos tanto coordenadas mapeadas 'lat/lng' como 'latitud/longitud' por seguridad
            const latSede = parseFloat(sede.lat || sede.latitud);
            const lngSede = parseFloat(sede.lng || sede.longitud);

            if (latSede && lngSede && !isNaN(latSede) && !isNaN(lngSede)) {
              const distancia = calcularDistancia(
                latUsuario,
                lngUsuario,
                latSede,
                lngSede
              );

              todasLasSedes.push({
                ...sede,
                lat: latSede,
                lng: lngSede,
                carrera: carrera.nombre_carrera,
                distancia
              });
            }
          });
        });

        // ================================
        // ORDENAR POR DISTANCIA
        // ================================
        todasLasSedes.sort((a, b) => a.distancia - b.distancia);

        // TOP 5
        setSedesCercanas(todasLasSedes.slice(0, 5));
        setCargando(false);
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
  }, [carreras]); // Reacciona cuando las carreras cambien

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

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* MARCADOR USUARIO */}
        <Marker position={ubicacionUsuario}>
          <Popup>
            <div>
              <h3 className="popup-titulo">Tu ubicación actual</h3>
              <p className="popup-texto">Lat: {ubicacionUsuario[0].toFixed(5)}</p>
              <p className="popup-texto">Lng: {ubicacionUsuario[1].toFixed(5)}</p>
            </div>
          </Popup>
        </Marker>

        {/* MARCADORES SEDES */}
        {sedesCercanas.map((sede, index) => (
          <Marker key={index} position={[sede.lat, sede.lng]}>
            <Popup>
              <div>
                <h3 className="popup-titulo">{sede.sede}</h3>
                <p className="popup-texto"><strong>Carrera:</strong> {sede.carrera}</p>
                <p className="popup-texto"><strong>Matrícula:</strong> ${sede.matricula}</p>
                <p className="popup-texto"><strong>Arancel Anual:</strong> ${sede.arancel}</p>
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