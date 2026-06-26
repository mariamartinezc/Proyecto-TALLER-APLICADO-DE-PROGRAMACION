import React from "react";
import {
  FaHome,
  FaFileAlt,
  FaMapMarkedAlt,
  FaChartBar,
  FaUserCircle,
  FaGraduationCap,
  FaEnvelope,
  FaHeart,
  FaExchangeAlt
} from "react-icons/fa";

function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "#212529", // IGUAL QUE bg-dark de Bootstrap
        color: "#dee2e6",
        borderTop: "1px solid rgba(255,255,255,0.08)"
      }}
    >
      <div className="container py-5">

        <div className="row">

          {/* PROYECTO */}
          <div className="col-md-4 mb-4">

            <h4 className="fw-bold mb-3 text-light">
              <FaGraduationCap className="me-2 text-success" />
              Elige Tu Futuro
            </h4>

            <p style={{ color: "#adb5bd" }}>
              Plataforma de orientación vocacional que permite explorar carreras,
              comparar opciones y visualizar información académica en tiempo real.
            </p>

          </div>

          {/* NAVEGACIÓN */}
          <div className="col-md-4 mb-4 text-center">

            <h5 className="text-light mb-3">Navegación</h5>

            <div className="d-flex flex-column gap-2">

              <a href="#home" className="text-decoration-none text-secondary">
                <FaHome className="me-2" />
                Inicio
              </a>

              <a href="#comparador" className="text-decoration-none text-secondary">
                <FaExchangeAlt className="me-2" />
                Comparador
              </a>

              <a href="#test" className="text-decoration-none text-secondary">
                <FaFileAlt className="me-2" />
                Test Vocacional
              </a>

              <a href="#mapa" className="text-decoration-none text-secondary">
                <FaMapMarkedAlt className="me-2" />
                Mapa
              </a>

              <a href="#dashboard" className="text-decoration-none text-secondary">
                <FaChartBar className="me-2" />
                Dashboard
              </a>

              <a href="#perfil" className="text-decoration-none text-secondary">
                <FaUserCircle className="me-2" />
                Mi Perfil
              </a>

            </div>

          </div>

          {/* CONTACTO */}
          <div className="col-md-4 mb-4">

            <h5 className="text-light mb-3">Contacto</h5>

            <p style={{ color: "#adb5bd" }}>
              <FaEnvelope className="me-2 text-danger" />
              contacto@eligetufuturo.cl
            </p>

            <p style={{ color: "#adb5bd" }}>
              Duoc UC - Ingeniería en Informática
            </p>

          </div>

        </div>

        {/* LINEA */}
        <hr style={{ borderColor: "#343a40" }} />

        {/* COPYRIGHT */}
        <div className="text-center">

          <small style={{ color: "#adb5bd" }}>
            © 2026 Elige Tu Futuro

            <FaHeart className="ms-2 text-danger" />
          </small>

        </div>

      </div>
    </footer>
  );
}

export default Footer;