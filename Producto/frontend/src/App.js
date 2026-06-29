import React, { useState, useEffect } from 'react';

// 1. IMPORTACIONES DE ESTILOS
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; 

// 2. Herramientas de navegación
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 3. Importar Supabase para gestionar la sesión
import { supabase } from './supabaseClient'; 

// 4. Componentes y Vistas
import NavbarPrincipal from './componentes/NavbarPrincipal';
import Footer from './componentes/Footer'; 

import Home from './vistas/Home'; 
import TestVocacional from './vistas/TestVocacional';
import Mapa from './vistas/Mapa';
import ExplorarCarreras from './vistas/ExplorarCarreras';
import Login from './vistas/Login'; 
import Perfil from './vistas/Perfil'; 
import Dashboard from './vistas/Dashboard'; 
import Beneficios from './vistas/Beneficios'; // <-- NUEVO: Importamos la vista de becas

function App() {
  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSesion(session);
      setCargando(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesion(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (cargando) {
    return (
      <div className="d-flex justify-content-center align-items-center bg-light" style={{ minHeight: '100vh' }}>
        <h4 className="text-secondary fw-normal">Verificando sesión...</h4>
      </div>
    );
  }

  return (
    <Router>
      <div className="d-flex flex-column bg-light" style={{ minHeight: '100vh' }}>
        
        {/* El Navbar SOLO se muestra si el usuario inició sesión */}
        {sesion && <NavbarPrincipal />}
        
        {/* Contenido Principal con crecimiento flexible */}
        <div className="flex-grow-1">
          <Routes>
            {!sesion ? (
              <>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/test" element={<TestVocacional />} />
                <Route path="/mapa" element={<Mapa />} />
                <Route path="/comparador" element={<ExplorarCarreras />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* NUEVO: Agregamos la ruta protegida para el catálogo de becas */}
                <Route path="/beneficios" element={<Beneficios />} />
                
                <Route path="/login" element={<Navigate to="/home" replace />} />
                <Route path="*" element={<Navigate to="/home" replace />} />
              </>
            )}
          </Routes>
        </div>

        {/* El Footer SOLO se muestra si el usuario inició sesión */}
        {sesion && <Footer />}
        
      </div>
    </Router>
  );
}

export default App;