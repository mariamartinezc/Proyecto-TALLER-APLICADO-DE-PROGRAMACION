import React from 'react';

// 1. IMPORTACIONES DE ESTILOS ¡Esto es lo que recupera tu diseño (Imagen 2)!
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; // Si tu archivo de estilos principal se llama distinto (ej. index.css), cámbialo aquí.

// 2. Herramientas de navegación
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// 3. Componentes y Vistas
import NavbarPrincipal from './componentes/NavbarPrincipal';
import Home from './vistas/Home'; 
import TestVocacional from './vistas/TestVocacional';
import Mapa from './vistas/Mapa';

function App() {
  return (
    <Router>
      {/* Mantenemos un div limpio para que tus estilos actúen con normalidad */}
      <div className="App bg-light" style={{ minHeight: '100vh' }}>
        
        {/* El Navbar siempre visible arriba */}
        <NavbarPrincipal />
        
        {/* Aquí es donde las páginas se intercambian al hacer clic */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/test" element={<TestVocacional />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/comparador" element={
            <div className="container mt-5 text-center">
              <h2>Sección Comparador (Próximamente)</h2>
            </div>
          } />
        </Routes>
        
      </div>
    </Router>
  );
}

export default App;