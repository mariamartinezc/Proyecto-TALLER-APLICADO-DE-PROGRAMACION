import React, { useState, useEffect } from "react";
import MapaSedes from "../componentes/MapaSedes";
import { obtenerCarrerasMapeadas } from "../services/carrerasService";

function Mapa() {
  const [carreras, setCarreras] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerCarrerasMapeadas()
      .then(data => setCarreras(data))
      .catch(err => console.error("Error en mapa:", err.message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Mapa de Sedes Duoc UC</h1>
      {cargando ? (
        <h3 className="text-muted">Conectando con el servicio de mapas...</h3>
      ) : (
        <MapaSedes carreras={carreras} />
      )}
    </div>
  );
}

export default Mapa;