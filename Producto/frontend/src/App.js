// src/App.js
import React, { useEffect, useState } from 'react';

// 1. IMPORTACIONES DE ESTILOS
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; 

// 2. Herramientas de navegación
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// 3. Conexión de Supabase y Vista de Login
import { supabase } from "./supabaseClient"; 
import Login from "./vistas/Login";

// 4. Componentes y Vistas del Sistema
import NavbarPrincipal from './componentes/NavbarPrincipal';
import Home from './vistas/Home'; 
import TestVocacional from './vistas/TestVocacional';
import Mapa from './vistas/Mapa';
import ExplorarCarreras from './vistas/ExplorarCarreras'; 

function App() {
  const [sesion, setSesion] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    // Verificar si ya existe una sesión activa guardada en el navegador
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSesion(session);
      setCargandoSesion(false);
    }).catch((err) => {
      console.error("Error al obtener la sesión:", err);
      setCargandoSesion(false);
    });

    // Escuchar cambios de autenticación en tiempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, session) => {
      setSesion(session);
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Función para cerrar la sesión de forma segura
  const manejarCierreSesion = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSesion(null);
    } catch (error) {
      console.error("Error al cerrar sesión:", error.message);
    }
  };

  // Pantalla de carga mientras se valida la sesión
  if (cargandoSesion) {
    return (
      <div className="d-flex justify-content-center align-items-center bg-light" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-success mb-3" role="status"></div>
          <h5>Validando credenciales de acceso...</h5>
        </div>
      </div>
    );
  }

  // Si no hay sesión iniciada, forzar la vista del Login Multietapa
  if (!sesion) {
    return <Login alConfirmarIngreso={(usuario) => console.log("Usuario autenticado:", usuario)} />;
  }

  // Si el usuario está autenticado, renderizar la aplicación completa
  return (
    <Router>
      <div className="App bg-light" style={{ minHeight: '100vh' }}>
        
        {/* Pasamos la sesión y la función de cierre de forma explícita */}
        <NavbarPrincipal sesion={sesion} alCerrarSesion={manejarCierreSesion} />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/test" element={<TestVocacional />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/comparador" element={<ExplorarCarreras />} />
        </Routes>
        
      </div>
    </Router>
  );
}

export default App;