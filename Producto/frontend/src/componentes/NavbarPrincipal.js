import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { FaHome, FaExchangeAlt, FaFileAlt, FaMapMarkedAlt } from 'react-icons/fa';
import logo from '../assets/logo-s.png';

function NavbarPrincipal() {
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
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavbarPrincipal;