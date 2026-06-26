import React, { useState, useEffect } from 'react';

// Estilos
import 'admin-lte/dist/css/adminlte.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import './App.css';

// Router
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Supabase
import { supabase } from './supabaseClient';

// Componentes
import NavbarPrincipal from './componentes/NavbarPrincipal';
import Footer from './componentes/Footer';

// Vistas
import Home from './vistas/Home';
import TestVocacional from './vistas/TestVocacional';
import Mapa from './vistas/Mapa';
import ExplorarCarreras from './vistas/ExplorarCarreras';
import Dashboard from './vistas/Dashboard';
import Perfil from './vistas/Perfil';
import Login from './vistas/Login';

function App() {

  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSesion(session);
      setCargando(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesion(session);
    });

    return () => subscription.unsubscribe();

  }, []);

  if (cargando) {
    return (
      <div
        className="d-flex justify-content-center align-items-center bg-light"
        style={{ minHeight: '100vh' }}
      >
        <h4 className="text-secondary fw-normal">
          Verificando sesión...
        </h4>
      </div>
    );
  }

  return (
    <Router>

      <div
        className="d-flex flex-column bg-light"
        style={{ minHeight: '100vh' }}
      >

        {/* Navbar */}
        {sesion && <NavbarPrincipal />}

        {/* Contenido principal */}
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
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/perfil" element={<Perfil />} />

                <Route
                  path="/login"
                  element={<Navigate to="/home" replace />}
                />

                <Route
                  path="*"
                  element={<Navigate to="/home" replace />}
                />
              </>

            )}

          </Routes>

        </div>

        {/* Footer */}
        {sesion && <Footer />}

      </div>

    </Router>
  );
}

export default App;