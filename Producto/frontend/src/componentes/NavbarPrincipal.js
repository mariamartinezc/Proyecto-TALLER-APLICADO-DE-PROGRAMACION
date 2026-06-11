import React from 'react';
import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap';
import { FaHome, FaExchangeAlt, FaFileAlt, FaMapMarkedAlt } from 'react-icons/fa';
import logo from '../assets/logo-s.png';

function NavbarPrincipal({ sesion, alCerrarSesion }) {
    
    const manejarSalida = async () => {
        if (alCerrarSesion) {
            await alCerrarSesion();
            // Al usar HashRouter (href="#home"), al cerrar sesión 
            // volvemos automáticamente al estado de login limpio.
            window.location.hash = "home"; 
        }
    };

    return (
        <Navbar expand="lg" bg="dark" data-bs-theme="dark" className="sticky-top shadow">
            <Container>
                <Navbar.Brand href="#home" className="fw-bold d-flex align-items-center">
                    <img
                        src={logo}
                        width="160"
                        height="140"
                        className="d-inline-block align-top me-3"
                        alt="Logo Elige tu Futuro"
                        style={{ borderRadius: '15px', objectFit: 'contain' }}
                    />
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    {/* Enlaces de navegación originales */}
                    <Nav className="me-auto gap-2">
                        <Nav.Link href="#home" className="d-flex align-items-center gap-2">
                            <FaHome /> Inicio
                        </Nav.Link>
                        <Nav.Link href="#comparador" className="d-flex align-items-center gap-2">
                            <FaExchangeAlt /> Comparador
                        </Nav.Link>
                        <Nav.Link href="#test" className="d-flex align-items-center gap-2">
                            <FaFileAlt /> Test Vocacional
                        </Nav.Link>
                        <Nav.Link href="#mapa" className="d-flex align-items-center gap-2">
                            <FaMapMarkedAlt /> Mapa
                        </Nav.Link>
                    </Nav>

                    {/* SECCIÓN DEL ICONO DE USUARIO (Muestra si la sesión existe) */}
                    {sesion && sesion.user && (
                        <Nav className="ms-auto align-items-center">
                            <NavDropdown
                                title={
                                    // SVG que calza idéntico con tu avatar circular gris de la foto
                                    <svg 
                                        className="bg-secondary rounded-circle text-white d-inline-block"
                                        style={{ width: "35px", height: "35px", padding: "5px" }}
                                        viewBox="0 0 16 16" 
                                        fill="currentColor"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                                        <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
                                    </svg>
                                }
                                id="nav-usuario-dropdown"
                                align="end"
                            >
                                {/* Información del Correo del Alumno */}
                                <div className="px-3 py-2 border-bottom text-muted small" style={{ minWidth: "180px" }}>
                                    Conectado como:<br />
                                    <strong className="text-dark d-block text-truncate">
                                        {sesion.user.email}
                                    </strong>
                                </div>
                                
                                {/* Opción para salir del sistema */}
                                <NavDropdown.Item 
                                    onClick={manejarSalida} 
                                    className="text-danger fw-bold pt-2 text-center"
                                >
                                    Cerrar Sesión
                                </NavDropdown.Item>
                            </NavDropdown>
                        </Nav>
                    )}
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavbarPrincipal;