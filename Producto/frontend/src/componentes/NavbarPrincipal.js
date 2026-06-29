import React from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
// NUEVO: Agregamos FaGift a las importaciones para el botón de beneficios
import { FaHome, FaExchangeAlt, FaFileAlt, FaMapMarkedAlt, FaSignOutAlt, FaUserCircle, FaChartBar, FaGift } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '../assets/logo-s.png';

function NavbarPrincipal() {
    const navigate = useNavigate();

    const manejarCerrarSesion = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            navigate('/login');
        } catch (error) {
            console.error('Error al cerrar sesión:', error.message);
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

                    {/* ENLACES IZQUIERDOS */}
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
                        <Nav.Link href="#dashboard" className="d-flex align-items-center gap-2">
                            <FaChartBar /> Dashboard
                        </Nav.Link>
                        
                        {/* NUEVO: Enlace directo al catálogo de Beneficios */}
                        <Nav.Link href="#beneficios" className="d-flex align-items-center gap-2">
                            <FaGift /> Beneficios
                        </Nav.Link>
                    </Nav>

                    {/* SECCIÓN DERECHA: PERFIL Y BOTÓN DE SALIR */}
                    <Nav className="ms-auto mt-3 mt-lg-0 d-flex align-items-center gap-3">

                        <Nav.Link href="#perfil" className="d-flex align-items-center gap-2 text-light" style={{ transition: '0.3s' }}>
                            <FaUserCircle size={24} />
                            <span className="fw-semibold">Mi Perfil</span>
                        </Nav.Link>

                        <Button
                            variant="outline-danger"
                            onClick={manejarCerrarSesion}
                            className="d-flex align-items-center gap-2"
                            style={{ borderRadius: '10px' }}
                        >
                            <FaSignOutAlt /> Cerrar Sesión
                        </Button>
                    </Nav>

                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavbarPrincipal;