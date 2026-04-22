import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
// Importa tu logo aquí. Si está en la carpeta assets:
import logo from '../assets/logo1.png';

function NavbarPrincipal() {
    return (
        <Navbar expand="lg" bg="dark" data-bs-theme="dark" className="sticky-top shadow">
            <Container>
                {/* Agregamos d-flex y align-items-center para que el logo y el texto no queden chuecos */}
                <Navbar.Brand href="#home" className="fw-bold d-flex align-items-center">
                    <img
                        src={logo}
                        width="60"  /* Antes era 35 */
                        height="60" /* Antes era 35 */
                        className="d-inline-block align-top me-3" // Aumenté el margen a me-3
                        alt="Logo Elige tu Futuro"
                        style={{ borderRadius: '15px', objectFit: 'contain' }}
                    />
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link href="#home">Inicio</Nav.Link>
                        <Nav.Link href="#comparador">Comparador</Nav.Link>
                        <Nav.Link href="#mapa">Mapa</Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavbarPrincipal;