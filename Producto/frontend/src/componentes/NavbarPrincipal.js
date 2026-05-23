import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import logo from '../assets/logo1.png';

function NavbarPrincipal() {
  return (
    <Navbar expand="lg" bg="dark" data-bs-theme="dark" className="sticky-top shadow">
      <Container>
        <Navbar.Brand href="#home" className="fw-bold d-flex align-items-center">
          <img
            src={logo}
            width="60"
            height="60"
            className="d-inline-block align-top me-3"
            alt="Logo Elige tu Futuro"
            style={{ borderRadius: '15px', objectFit: 'contain' }}
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="#home">Inicio</Nav.Link>
            <Nav.Link href="#comparador">Comparador</Nav.Link>
            <Nav.Link href=''>Test Vocacional</Nav.Link>
            <Nav.Link href="">Mapa</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavbarPrincipal;