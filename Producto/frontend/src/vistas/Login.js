import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Form } from 'react-bootstrap';

const Login = () => {
  const navigate = useNavigate();

  // Estados generales
  const [esRegistro, setEsRegistro] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Estados para el LOGIN normal
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Estados para el REGISTRO MULTIPASO
  const [paso, setPaso] = useState(1);
  const [mostrarTerminos, setMostrarTerminos] = useState(false);

  // Datos del Registro
  const [formData, setFormData] = useState({
    // Paso 1: Personales
    nombres: '',
    apellidos: '',
    fechaNacimiento: '', // <-- NUEVO
    edadRegistro: '',    // <-- NUEVO (Se calcula automáticamente)
    genero: 'Seleccionar',
    // Paso 2: Académicos
    region: 'Seleccionar',
    establecimiento: 'Seleccionar',
    puntaje: 'Seleccionar',
    ranking: 'Seleccionar',
    // Paso 3: Acceso
    email: '',
    password: '',
    confirmPassword: '',
    rol: 'Estudiante', // Por defecto
    aceptaTerminos: false
  });

  // Función automática para calcular la edad de registro mediante la fecha de nacimiento
  const calcularEdad = (fechaNac) => {
    if (!fechaNac) return '';
    const hoy = new Date();
    const cumpleanos = new Date(fechaNac);
    let edad = hoy.getFullYear() - cumpleanos.getFullYear();
    const mes = hoy.getMonth() - cumpleanos.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < cumpleanos.getDate())) {
      edad--;
    }
    return edad;
  };

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const siguientePaso = () => setPaso(paso + 1);
  
  const cancelarRegistro = () => {
    setEsRegistro(false);
    setPaso(1);
    setError(null);
    setFormData(prev => ({...prev, password: '', confirmPassword: ''}));
  };

  const avanzarPaso1 = (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.nombres.trim() || !formData.apellidos.trim() || !formData.fechaNacimiento) {
      return setError('Por favor, completa todos los campos obligatorios (*) del Paso 1.');
    }
    siguientePaso();
  };

  const avanzarPaso2 = (e) => {
    e.preventDefault();
    setError(null);
    if (formData.region === 'Seleccionar' || formData.establecimiento === 'Seleccionar') {
      return setError('Por favor, selecciona tu Región y Tipo de establecimiento (*).');
    }
    siguientePaso();
  };

  // 1. INICIAR SESIÓN
  const manejarLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const { error: errorLogin } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });
      if (errorLogin) throw errorLogin;
      navigate('/home');
    } catch (err) {
      if (err.message.includes('Invalid login credentials')) {
        setError('Correo o contraseña incorrectos. Verifica tus datos.');
      } else if (err.message.includes('Email not confirmed')) {
        setError('Debes confirmar tu correo electrónico antes de iniciar sesión.');
      } else {
        setError('Ocurrió un error al entrar: ' + err.message);
      }
    } finally {
      setCargando(false);
    }
  };

  // 2. REGISTRARSE (Paso 3 al Paso 4)
  const manejarRegistro = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      return setError('Las contraseñas no coinciden.');
    }
    if (!formData.aceptaTerminos) {
      return setError('Debes aceptar los términos y condiciones.');
    }

    setCargando(true);
    try {
      const { data, error: errorRegistro } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nombre_completo: `${formData.nombres} ${formData.apellidos}`,
            nombres: formData.nombres,
            apellidos: formData.apellidos,
            fecha_nacimiento: formData.fechaNacimiento, // <-- NUEVO base de datos
            edad_registro: formData.edadRegistro,       // <-- NUEVO base de datos
            genero: formData.genero,
            region: formData.region,
            establecimiento: formData.establecimiento,
            puntaje_paes: formData.puntaje !== 'Seleccionar' ? formData.puntaje : 'No especificado',
            ranking_notas: formData.ranking !== 'Seleccionar' ? formData.ranking : 'No especificado',
            rol: formData.rol
          }
        }
      });
      if (errorRegistro) throw errorRegistro;
      
      // PARCHE AUTOMÁTICO: Evita saltos directos al home si la confirmación de correo está off
      if (data?.session) {
        await supabase.auth.signOut();
      }

      // Avanzamos al diseño del Paso 4 de verificación segura
      setPaso(4);
    } catch (err) {
      if (err.message.includes('email rate limit exceeded')) {
        setError('Has excedido el límite de intentos. Por favor, espera una hora para volver a intentarlo o revisa tu bandeja de entrada.');
      } else if (err.message.includes('User already registered')) {
        setError('Este correo electrónico ya tiene una cuenta registrada.');
      } else if (err.message.includes('Password should be at least')) {
        setError('La contraseña es muy débil. Debe tener al menos 6 caracteres.');
      } else {
        setError('Ocurrió un error al registrar: ' + err.message);
      }
    } finally {
      setCargando(false);
    }
  };

  // 3. REENVIAR CORREO DE CONFIRMACIÓN (Paso 4)
  const reenviarCorreo = async () => {
    setCargando(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
      });
      if (error) throw error;
      alert('¡Correo reenviado! Por favor, revisa tu bandeja de entrada (y la carpeta de Spam).');
    } catch (err) {
      setError('Error al reenviar el correo: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  // --- VISTA: INICIAR SESIÓN ---
  if (!esRegistro) {
    return (
      <div className="d-flex justify-content-center align-items-center bg-light" style={{ minHeight: '100vh', padding: '20px' }}>
        <div className="bg-white p-5 rounded shadow" style={{ width: '100%', maxWidth: '400px' }}>
          <h2 className="text-center fw-bold text-dark mb-4">INICIAR SESIÓN</h2>
          
          {error && <div className="alert alert-danger p-2 text-center">{error}</div>}

          <Form onSubmit={manejarLogin}>
            <Form.Group className="mb-3 text-start">
              <Form.Label className="fw-semibold text-dark">Correo electrónico</Form.Label>
              <Form.Control type="email" placeholder="tu@correo.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
            </Form.Group>
            
            <Form.Group className="mb-4 text-start">
              <Form.Label className="fw-semibold text-dark">Contraseña</Form.Label>
              <Form.Control type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
            </Form.Group>

            <Button type="submit" variant="primary" className="w-100 fw-bold py-2 mb-3" disabled={cargando}>
              {cargando ? 'Cargando...' : 'Entrar'}
            </Button>
          </Form>

          <div className="text-center">
            <Button variant="link" className="text-decoration-none" onClick={() => { setEsRegistro(true); setError(null); }}>
              ¿No tienes cuenta? Regístrate aquí
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA: REGISTRO MULTIPASO ---
  return (
    <div className="d-flex justify-content-center align-items-center bg-light" style={{ minHeight: '100vh', padding: '20px' }}>
      <div className="bg-white p-4 p-md-5 rounded shadow" style={{ width: '100%', maxWidth: '500px' }}>
        
        {/* ENCABEZADO PRINCIPAL */}
        <div className="text-center mb-4">
          <h2 className="fw-bold text-dark text-uppercase">CREAR CUENTA GRATUITA</h2>
          <p className="text-dark fs-5" style={{ lineHeight: '1.2' }}>Regístrate para acceder a todas las herramientas de orientación vocacional</p>
        </div>

        {error && <div className="alert alert-danger p-2 text-center">{error}</div>}

        {/* CAJA CON BORDE */}
        <div className="border border-dark border-2 rounded p-4 pb-5 bg-white">
          
          {/* PASO 1: DATOS PERSONALES */}
          {paso === 1 && (
            <Form onSubmit={avanzarPaso1}>
              <h5 className="text-center fw-bold text-uppercase mb-4 text-dark">Datos Personales</h5>
              
              <Form.Group className="mb-3 text-start">
                <Form.Label className="fw-bold text-dark mb-1">Nombres completos *</Form.Label>
                <Form.Control type="text" name="nombres" value={formData.nombres} onChange={handleChange} required />
              </Form.Group>

              <Form.Group className="mb-3 text-start">
                <Form.Label className="fw-bold text-dark mb-1">Apellidos *</Form.Label>
                <Form.Control type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} required />
              </Form.Group>

              <div className="row text-start">
                {/* CAMBIO COMPLETO: Fecha de Nacimiento en lugar de número plano */}
                <Form.Group className="col-6 mb-3">
                  <Form.Label className="fw-bold text-dark mb-1">Fecha de Nacimiento *</Form.Label>
                  <Form.Control 
                    type="date" 
                    name="fechaNacimiento" 
                    value={formData.fechaNacimiento} 
                    max={new Date().toISOString().split("T")[0]} 
                    onChange={(e) => {
                      const fecha = e.target.value;
                      const edadCalculada = calcularEdad(fecha);
                      setFormData({
                        ...formData,
                        fechaNacimiento: fecha,
                        edadRegistro: edadCalculada
                      });
                    }} 
                    required 
                  />
                  {formData.edadRegistro && (
                    <small className="text-success d-block mt-1">
                      Edad calculada: <strong>{formData.edadRegistro} años</strong>
                    </small>
                  )}
                </Form.Group>

                <Form.Group className="col-6 mb-3">
                  <Form.Label className="fw-bold text-dark mb-1">Género</Form.Label>
                  <Form.Select name="genero" value={formData.genero} onChange={handleChange} required>
                    <option value="Seleccionar" disabled>Seleccionar</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="d-flex justify-content-between mt-4">
                <Button variant="secondary" onClick={cancelarRegistro}>Cancelar</Button>
                <Button variant="primary" type="submit">Siguiente</Button>
              </div>
            </Form>
          )}

          {/* PASO 2: DATOS ACADÉMICOS */}
          {paso === 2 && (
            <Form onSubmit={avanzarPaso2}>
              <h5 className="text-center fw-bold text-uppercase mb-4 text-dark">Datos Académicos</h5>

              <Form.Group className="mb-3 text-start">
                <Form.Label className="fw-bold text-dark mb-1">Región de origen *</Form.Label>
                <Form.Select name="region" value={formData.region} onChange={handleChange} required>
                  <option value="Seleccionar" disabled>Seleccionar</option>
                  <option value="Arica y Parinacota">Arica y Parinacota</option>
                  <option value="Tarapacá">Tarapacá</option>
                  <option value="Antofagasta">Antofagasta</option>
                  <option value="Atacama">Atacama</option>
                  <option value="Coquimbo">Coquimbo</option>
                  <option value="Valparaíso">Valparaíso</option>
                  <option value="Metropolitana">Metropolitana de Santiago</option>
                  <option value="O'Higgins">Libertador Gral. Bernardo O'Higgins</option>
                  <option value="Maule">Maule</option>
                  <option value="Ñuble">Ñuble</option>
                  <option value="Biobío">Biobío</option>
                  <option value="La Araucanía">La Araucanía</option>
                  <option value="Los Ríos">Los Ríos</option>
                  <option value="Los Lagos">Los Lagos</option>
                  <option value="Aysén">Aysén del Gral. Carlos Ibáñez del Campo</option>
                  <option value="Magallanes">Magallanes y de la Antártica Chilena</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3 text-start">
                <Form.Label className="fw-bold text-dark mb-1">Tipo de establecimiento *</Form.Label>
                <Form.Select name="establecimiento" value={formData.establecimiento} onChange={handleChange} required>
                  <option value="Seleccionar" disabled>Seleccionar</option>
                  <option value="Municipal">Municipal</option>
                  <option value="Subvencionado">Particular Subvencionado</option>
                  <option value="Privado">Particular Pagado</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3 text-start">
                <Form.Label className="fw-bold text-dark mb-1">Último puntaje PAES (opcional)</Form.Label>
                <Form.Select name="puntaje" value={formData.puntaje} onChange={handleChange}>
                  <option value="Seleccionar">Seleccionar</option>
                  <option value="Menos de 500">Menos de 500</option>
                  <option value="Entre 500 y 700">Entre 500 y 700</option>
                  <option value="Más de 700">Más de 700</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3 text-start">
                <Form.Label className="fw-bold text-dark mb-1">Ranking de notas (%) (opcional)</Form.Label>
                <Form.Select name="ranking" value={formData.ranking} onChange={handleChange}>
                  <option value="Seleccionar">Seleccionar</option>
                  <option value="Top 10%">Top 10%</option>
                  <option value="Top 20%">Top 20%</option>
                  <option value="Otro">Otro</option>
                </Form.Select>
              </Form.Group>

              <div className="d-flex justify-content-between mt-4">
                <Button variant="secondary" onClick={() => setPaso(1)}>Atrás</Button>
                <Button variant="primary" type="submit">Siguiente</Button>
              </div>
            </Form>
          )}

          {/* PASO 3: DATOS DE ACCESO */}
          {paso === 3 && (
            <Form onSubmit={manejarRegistro}>
              <h5 className="text-center fw-bold text-uppercase mb-4 text-dark">Datos de Acceso</h5>

              <Form.Group className="mb-3 text-start">
                <Form.Label className="fw-bold text-dark mb-1">Correo electrónico *</Form.Label>
                <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
              </Form.Group>

              <Form.Group className="mb-3 text-start">
                <Form.Label className="fw-bold text-dark mb-1">Contraseña *</Form.Label>
                <Form.Control type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required minLength={6} />
              </Form.Group>

              <Form.Group className="mb-3 text-start">
                <Form.Label className="fw-bold text-dark mb-1">Confirmar contraseña *</Form.Label>
                <Form.Control type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required minLength={6} />
              </Form.Group>

              <Form.Group className="mb-3 text-start">
                <Form.Label className="fw-bold text-dark mb-1">¿Cómo te identificas?</Form.Label>
                <div className="text-dark">
                  <Form.Check inline type="radio" label="Estudiante" name="rol" value="Estudiante" checked={formData.rol === 'Estudiante'} onChange={handleChange} />
                  <Form.Check inline type="radio" label="Orientador" name="rol" value="Orientador" checked={formData.rol === 'Orientador'} onChange={handleChange} />
                  <Form.Check inline type="radio" label="Apoderado" name="rol" value="Apoderado" checked={formData.rol === 'Apoderado'} onChange={handleChange} />
                </div>
              </Form.Group>

              <Form.Group className="mb-4 d-flex align-items-center text-start">
                <Form.Check type="checkbox" name="aceptaTerminos" checked={formData.aceptaTerminos} onChange={handleChange} className="me-2" />
                <span className="text-dark">Acepto los <Button variant="link" className="p-0 text-decoration-underline" onClick={() => setMostrarTerminos(true)}>términos y condiciones</Button></span>
              </Form.Group>

              <div className="d-flex justify-content-between mt-4">
                <Button variant="secondary" onClick={() => setPaso(2)}>Atrás</Button>
                <Button variant="primary" type="submit" disabled={cargando}>
                  {cargando ? 'Registrando...' : 'Registrar'}
                </Button>
              </div>
            </Form>
          )}

          {/* PASO 4: CONFIRMACIÓN DE CORREO */}
          {paso === 4 && (
            <div className="text-center text-dark mt-2">
              <h2 className="fw-bold text-uppercase mb-2" style={{ fontSize: '1.8rem' }}>CUENTA CREADA</h2>
              <p className="fs-5 mb-4 text-dark">¡Bienvenido/a a Elige tu Futuro!</p>
              
              <p className="mb-2 fs-5 fw-medium">Hemos enviado un correo de confirmación a:</p>
              
              <div className="d-flex justify-content-center align-items-center mb-4 text-dark fs-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-person me-2" viewBox="0 0 16 16">
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
                </svg>
                <span>{formData.email}</span>
              </div>

              <p className="mb-4 fs-5 mx-auto" style={{ maxWidth: '350px', lineHeight: '1.4' }}>
                <strong>Por favor</strong> revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
              </p>

              <Button 
                variant="light" 
                className="mb-5 fw-semibold px-4 py-2 border border-secondary text-secondary rounded shadow-sm"
                style={{ backgroundColor: '#f0f0f0' }}
                onClick={cancelarRegistro}
              >
                IR A INICIAR SESIÓN
              </Button>

              <div className="mt-2 text-start d-flex flex-column align-items-center">
                <p className="mb-0 fs-5 fw-bold text-dark">¿No recibiste el correo?</p>
                <Button 
                  variant="link" 
                  className="p-0 text-decoration-none fs-5 fw-medium text-primary" 
                  onClick={reenviarCorreo} 
                  disabled={cargando}
                >
                  {cargando ? 'Reenviando...' : 'Reenviar correo de confirmación'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE TÉRMINOS Y CONDICIONES */}
      <Modal show={mostrarTerminos} onHide={() => setMostrarTerminos(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Términos, Condiciones y Privacidad</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-secondary">
          <p><strong>1. Tratamiento de Datos:</strong> Almacenamos tu información académica (colegio, región y puntajes) únicamente para personalizar las recomendaciones de orientación vocacional.</p>
          <p><strong>2. Permiso de Ubicación:</strong> Esta aplicación requiere acceso a tu geolocalización GPS. Usamos estos datos exclusivamente para calcular distancias y rutas hacia las sedes institucionales en tiempo real.</p>
          <p><strong>3. Seguridad:</strong> Tus datos están protegidos en nuestra base de datos cifrada y no serán compartidos con terceros.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setMostrarTerminos(false)}>Cerrar</Button>
          <Button variant="primary" onClick={() => { 
            setFormData({...formData, aceptaTerminos: true}); 
            setMostrarTerminos(false); 
          }}>
            Aceptar Términos
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default Login;