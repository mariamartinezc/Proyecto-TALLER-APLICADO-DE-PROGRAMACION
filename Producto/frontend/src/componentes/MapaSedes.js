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

import datos from "../datos.json";


// ================================
// ICONOS LEAFLET
// ================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({

  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"

});


// ================================
// FUNCIÓN DISTANCIA
// ================================

function calcularDistancia(lat1, lon1, lat2, lon2) {

  const R = 6371;

  const dLat =
    (lat2 - lat1) * Math.PI / 180;

  const dLon =
    (lon2 - lon1) * Math.PI / 180;

  const a =

    Math.sin(dLat / 2) *
    Math.sin(dLat / 2) +

    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *

    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

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

  // Santiago por defecto
  const [ubicacionUsuario, setUbicacionUsuario] =
    useState([-33.4489, -70.6693]);

  // Sedes cercanas
  const [sedesCercanas, setSedesCercanas] =
    useState([]);

  // Estado carga
  const [cargando, setCargando] =
    useState(true);

  // Error ubicación
  const [errorUbicacion, setErrorUbicacion] =
    useState("");



  useEffect(() => {

    // Verificar soporte
    if (!navigator.geolocation) {

      setErrorUbicacion(
        "Tu navegador no soporta geolocalización."
      );

      setCargando(false);

      return;

    }


    // ================================
    // OBTENER UBICACIÓN
    // ================================

    navigator.geolocation.getCurrentPosition(

      // SUCCESS
      (position) => {

        const latUsuario =
          position.coords.latitude;

        const lngUsuario =
          position.coords.longitude;

        console.log(
          "Ubicación usuario:",
          latUsuario,
          lngUsuario
        );

        // Guardar ubicación real
        setUbicacionUsuario([
          latUsuario,
          lngUsuario
        ]);

        const todasLasSedes = [];



        // ================================
        // RECORRER JSON
        // ================================

        datos.forEach((carrera) => {

          carrera.sedes.forEach((sede) => {

            // Validar coordenadas
            if (
              sede.lat &&
              sede.lng &&
              !isNaN(sede.lat) &&
              !isNaN(sede.lng)
            ) {

              // Distancia
              const distancia =
                calcularDistancia(
                  latUsuario,
                  lngUsuario,
                  sede.lat,
                  sede.lng
                );

              todasLasSedes.push({

                ...sede,

                carrera:
                  carrera.nombre_carrera,

                distancia

              });

            }

          });

        });



        // ================================
        // ORDENAR POR DISTANCIA
        // ================================

        todasLasSedes.sort(
          (a, b) =>
            a.distancia - b.distancia
        );



        // TOP 5
        setSedesCercanas(
          todasLasSedes.slice(0, 5)
        );

        setCargando(false);

      },



      // ERROR
      (error) => {

        console.log(error);

        setErrorUbicacion(
          "No se pudo obtener tu ubicación."
        );

        setCargando(false);

      },



      // OPCIONES GPS
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }

    );

  }, []);



  // ================================
  // CARGANDO
  // ================================

  if (cargando) {

    return (

      <div className="mapa-container">

        <h2 className="titulo-mapa">

          Obteniendo ubicación...

        </h2>

      </div>

    );

  }



  // ================================
  // ERROR
  // ================================

  if (errorUbicacion) {

    return (

      <div className="mapa-container">

        <h2 className="titulo-mapa">

          {errorUbicacion}

        </h2>

      </div>

    );

  }



  // ================================
  // RENDER
  // ================================

  return (

    <div className="mapa-container">

      <h2 className="titulo-mapa">

        Sedes más cercanas a ti

      </h2>



      <MapContainer

        center={ubicacionUsuario}

        zoom={12}

        className="leaflet-container"

      >

        {/* Actualizar vista */}
        <CambiarVistaMapa
          centro={ubicacionUsuario}
        />



        {/* MAPA */}
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />



        {/* ================================
            USUARIO
        ================================= */}

        <Marker position={ubicacionUsuario}>

          <Popup>

            <div>

              <h3 className="popup-titulo">

                Tu ubicación actual

              </h3>

              <p className="popup-texto">

                Lat:
                {" "}
                {ubicacionUsuario[0].toFixed(5)}

              </p>

              <p className="popup-texto">

                Lng:
                {" "}
                {ubicacionUsuario[1].toFixed(5)}

              </p>

            </div>

          </Popup>

        </Marker>



        {/* ================================
            SEDES
        ================================= */}

        {sedesCercanas.map((sede, index) => (

          <Marker

            key={index}

            position={[
              sede.lat,
              sede.lng
            ]}

          >

            <Popup>

              <div>

                <h3 className="popup-titulo">

                  {sede.sede}

                </h3>

                <p className="popup-texto">

                  <strong>
                    Carrera:
                  </strong>

                  {" "}

                  {sede.carrera}

                </p>

                <p className="popup-texto">

                  <strong>
                    Matrícula:
                  </strong>

                  {" "}

                  ${sede.matricula}

                </p>

                <p className="popup-texto">

                  <strong>
                    Arancel:
                  </strong>

                  {" "}

                  ${sede.arancel}

                </p>

                <p className="popup-texto">

                  <strong>
                    Distancia:
                  </strong>

                  {" "}

                  {sede.distancia.toFixed(2)} km

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