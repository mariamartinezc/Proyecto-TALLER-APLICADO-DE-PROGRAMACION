import React, { useState, useEffect } from 'react';

// 1. IMPORTACIONES DE ESTILOS
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; 

// 2. Herramientas de navegación (Agregamos Navigate)
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 3. Importar Supabase para gestionar la sesión
import { supabase } from './supabaseClient'; // Ajusta la ruta si tu archivo se llama distinto

// 4. Componentes y Vistas
import NavbarPrincipal from './componentes/NavbarPrincipal';
import Home from './vistas/Home'; 
import TestVocacional from './vistas/TestVocacional';
import Mapa from './vistas/Mapa';
import ExplorarCarreras from './vistas/ExplorarCarreras';
import Login from './vistas/Login'; 
import Perfil from './vistas/Perfil'; // <-- NUEVO: Importamos el componente de Perfil

function App() {
  // Estados para controlar si el usuario está logueado y si la app está cargando
  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Verificamos si hay un usuario activo al abrir la página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSesion(session);
      setCargando(false);
    });

    // Nos quedamos escuchando si el usuario entra o sale de su cuenta
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesion(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Pantalla de carga mientras verificamos a Supabase
  if (cargando) {
    return (
      <div className="d-flex justify-content-center align-items-center bg-light" style={{ minHeight: '100vh' }}>
        <h4 className="text-secondary fw-normal">Verificando sesión...</h4>
      </div>
    );
  }

  return (
    <Router>
      <div className="App bg-light" style={{ minHeight: '100vh' }}>
        
        {/* El Navbar SOLO se muestra si el usuario inició sesión */}
        {sesion && <NavbarPrincipal />}
        
        <Routes>
          {/* Lógica de la Barrera de Seguridad */}
          {!sesion ? (
            // SI NO HAY SESIÓN: El usuario solo puede ver el Login. 
            // Si intenta ir a otra ruta (*), lo devolvemos a la fuerza al Login.
            <>
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            // SI SÍ HAY SESIÓN: Desbloqueamos todas tus vistas
            <>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/test" element={<TestVocacional />} />
              <Route path="/mapa" element={<Mapa />} />
              <Route path="/comparador" element={<ExplorarCarreras />} />
              
              {/* NUEVO: Agregamos la ruta del perfil */}
              <Route path="/perfil" element={<Perfil />} />
              
              {/* Si intenta ir al login estando ya logueado, lo mandamos al Home */}
              <Route path="/login" element={<Navigate to="/home" replace />} />
            </>
          )}
        </Routes>
        
      </div>
    </Router>
  );
}

export default App;