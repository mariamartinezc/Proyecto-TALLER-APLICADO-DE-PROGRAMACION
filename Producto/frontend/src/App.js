import React from 'react';

// 1. IMPORTACIONES DE ESTILOS
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; 

// 2. Herramientas de navegación
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// 3. Componentes y Vistas
import NavbarPrincipal from './componentes/NavbarPrincipal';
import Home from './vistas/Home'; 
import TestVocacional from './vistas/TestVocacional';
import Mapa from './vistas/Mapa';
import ExplorarCarreras from './vistas/ExplorarCarreras'; // Importamos tu vista

function App() {
  return (
    <Router>
      <div className="App bg-light" style={{ minHeight: '100vh' }}>
        
        {/* El Navbar siempre visible arriba */}
        <NavbarPrincipal />
        
        {/* Intercambio de pantallas */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/test" element={<TestVocacional />} />
          <Route path="/mapa" element={<Mapa />} />
          
          {/* HACEMOS QUE LA RUTA MUESTRE TU VISTA DE EXPLORACIÓN Y CATÁLOGO */}
          <Route path="/comparador" element={<ExplorarCarreras />} />
        </Routes>
        
      </div>
    </Router>
  );
}

export default App;