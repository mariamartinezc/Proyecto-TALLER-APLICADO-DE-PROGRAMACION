import { useState } from "react";
import { supabase } from "../supabaseClient";
// 1. Importamos el componente del Modal flotante

import ModalTerminos from "../componentes/ModalTerminos";
function Login({ alConfirmarIngreso }) {
  // Controles de flujo
  const [esRegistro, setEsRegistro] = useState(false);
  const [paso, setPaso] = useState(1); // Controla las pantallas del registro (1 a 4)
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState("");
  
  // Estado para controlar la visibilidad del modal legal flotante
  const [abrirModal, setAbrirModal] = useState(false); 

  // Datos del Formulario Único
  const [datosFormulario, setDatosFormulario] = useState({
    nombres: "",
    apellidos: "",
    edad: "",
    genero: "Masculino",
    region: "Metropolitana",
    tipoEstablecimiento: "Municipal",
    puntajePaes: "",
    rankingNotas: "",
    correo: "",
    contrasena: "",
    confirmarContrasena: "",
    tipoUsuario: "Estudiante",
    aceptaTerminos: false
  });

  // Manejador para actualizar cualquier campo del formulario
  const actualizarCampo = (campo, valor) => {
    setDatosFormulario((previo) => ({
      ...previo,
      [campo]: valor
    }));
  };

  // Solicita la geolocalización nativa al navegador de manera explícita
  const solicitarUbicacionGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (posicion) => {
          console.log("Coordenadas autorizadas con éxito:", posicion.coords.latitude, posicion.coords.longitude);
        },
        (error) => {
          console.warn("El usuario denegó el acceso GPS:", error.message);
        }
      );
    }
  };

  // Maneja el evento cuando interactúan directo con el checkbox
  const manejarCambioCheckbox = (e) => {
    const checked = e.target.checked;
    actualizarCampo("aceptaTerminos", checked);
    if (checked) {
      solicitarUbicacionGPS();
    }
  };

  // --- LÓGICA DE INICIO DE SESIÓN ---
  const manejarInicioSesion = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensajeError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: datosFormulario.correo,
        password: datosFormulario.contrasena,
      });
      if (error) throw error;
      if (data && data.user) alConfirmarIngreso(data.user);
    } catch (error) {
      setMensajeError(error.message || "Credenciales incorrectas.");
    } finally {
      setCargando(false);
    }
  };

  // --- LÓGICA DE REGISTRO MULTIETAPA (SUPABASE) ---
  const manejarRegistroFinal = async (e) => {
    e.preventDefault();
    
    if (datosFormulario.contrasena !== datosFormulario.confirmarContrasena) {
      setMensajeError("Las contraseñas no coinciden.");
      return;
    }
    if (!datosFormulario.aceptaTerminos) {
      setMensajeError("Debes aceptar los términos y condiciones.");
      return;
    }

    setCargando(true);
    setMensajeError("");

    try {
      const { error } = await supabase.auth.signUp({
        email: datosFormulario.correo,
        password: datosFormulario.contrasena,
        options: {
          data: {
            nombres: datosFormulario.nombres,
            apellidos: datosFormulario.apellidos,
            edad: datosFormulario.edad,
            genero: datosFormulario.genero,
            region: datosFormulario.region,
            tipo_establecimiento: datosFormulario.tipoEstablecimiento,
            puntaje_paes: datosFormulario.puntajePaes,
            ranking_notas: datosFormulario.rankingNotas, 
            tipo_usuario: datosFormulario.tipoUsuario
          }
        }
      });

      if (error) throw error;
      setPaso(4);
    } catch (error) {
      setMensajeError(error.message || "Error al intentar registrar el usuario.");
    } finally {
      setCargando(false);
    }
  };

  const volverAlLoginInicial = () => {
    setEsRegistro(false);
    setPaso(1);
    setMensajeError("");
  };

  // --- VISTA: INICIAR SESIÓN NORMAL ---
  if (!esRegistro) {
    return (
      <div className="card shadow-sm" style={{ maxWidth: "450px", margin: "60px auto", padding: "25px", borderRadius: "12px", border: "1px solid #e0e0e0" }}>
        <h2 className="text-center fw-bold" style={{ color: "#2d4a41" }}>INICIAR SESIÓN</h2>
        <p className="text-center text-muted">Ingresa tus credenciales para acceder a la plataforma</p>
        
        {mensajeError && <div className="alert alert-danger py-2">{mensajeError}</div>}

        <form onSubmit={manejarInicioSesion}>
          <div className="mb-3">
            <label className="form-label fw-bold">Correo electrónico *</label>
            <input 
              type="email" 
              required 
              className="form-control" 
              value={datosFormulario.correo}
              onChange={(e) => actualizarCampo("correo", e.target.value)}
              placeholder="ejemplo@correo.cl" 
            />
          </div>
          <div className="mb-4">
            <label className="form-label fw-bold">Contraseña *</label>
            <input 
              type="password" 
              required 
              className="form-control" 
              value={datosFormulario.contrasena}
              onChange={(e) => actualizarCampo("contrasena", e.target.value)}
              placeholder="********" 
            />
          </div>
          <button type="submit" disabled={cargando} className="btn w-100 text-white" style={{ backgroundColor: "#2563eb", fontWeight: "bold" }}>
            {cargando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="text-center mt-3">
          <button onClick={() => setEsRegistro(true)} className="btn btn-link text-decoration-underline p-0" style={{ color: "#10b981" }}>
            ¿No tienes cuenta? Regístrate aquí
          </button>
        </div>
      </div>
    );
  }

  // --- REGISTRO ETAPA 1: DATOS PERSONALES ---
  if (paso === 1) {
    return (
      <div className="card shadow-sm" style={{ maxWidth: "450px", margin: "40px auto", padding: "25px", borderRadius: "12px", backgroundColor: "#f4f7f5" }}>
        <h2 className="text-center fw-bold mb-1">CREAR CUENTA GRATUITA</h2>
        <p className="text-center text-muted small mb-4">Regístrate para acceder a todas las herramientas de orientación vocacional</p>
        
        <div className="p-3 border rounded bg-white">
          <h5 className="fw-bold text-center mb-3">DATOS PERSONALES</h5>
          
          <div className="mb-3">
            <label className="form-label small fw-bold mb-1">Nombres completos *</label>
            <input type="text" required className="form-control" value={datosFormulario.nombres} onChange={(e) => actualizarCampo("nombres", e.target.value)} placeholder="Ej: Agripino Leñador" />
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold mb-1">Apellidos *</label>
            <input type="text" required className="form-control" value={datosFormulario.apellidos} onChange={(e) => actualizarCampo("apellidos", e.target.value)} placeholder="Ej: Ta lando" />
          </div>

          <div className="row">
            <div className="col-6">
              <label className="form-label small fw-bold mb-1">Edad</label>
              <input type="number" className="form-control" value={datosFormulario.edad} onChange={(e) => actualizarCampo("edad", e.target.value)} placeholder="30" />
            </div>
            <div className="col-6">
              <label className="form-label small fw-bold mb-1">Género</label>
              <select className="form-select" value={datosFormulario.genero} onChange={(e) => actualizarCampo("genero", e.target.value)}>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-between mt-4">
            <button onClick={volverAlLoginInicial} className="btn btn-secondary px-4">Cancelar</button>
            <button onClick={() => datosFormulario.nombres && datosFormulario.apellidos ? setPaso(2) : alert("Completa los campos obligatorios")} className="btn btn-primary px-4">Siguiente</button>
          </div>
        </div>
      </div>
    );
  }

  // --- REGISTRO ETAPA 2: DATOS ACADÉMICOS ---
  if (paso === 2) {
    return (
      <div className="card shadow-sm" style={{ maxWidth: "450px", margin: "40px auto", padding: "25px", borderRadius: "12px" }}>
        <h2 className="text-center fw-bold mb-1">CREAR CUENTA GRATUITA</h2>
        <p className="text-center text-muted small mb-4">Regístrate para acceder a todas las herramientas de orientación vocacional</p>
        
        <div className="p-3 border rounded bg-white">
          <h5 className="fw-bold text-center mb-3">DATOS ACADÉMICOS</h5>

          <div className="mb-3">
            <label className="form-label small fw-bold mb-1">Región de origen *</label>
            <select className="form-select" value={datosFormulario.region} onChange={(e) => actualizarCampo("region", e.target.value)}>
              <option value="Metropolitana">Metropolitana</option>
              <option value="Valparaíso">Valparaíso</option>
              <option value="Biobío">Biobío</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold mb-1">Tipo de establecimiento *</label>
            <select className="form-select" value={datosFormulario.tipoEstablecimiento} onChange={(e) => actualizarCampo("tipoEstablecimiento", e.target.value)}>
              <option value="Municipal">Municipal</option>
              <option value="Particular Subvencionado">Particular Subvencionado</option>
              <option value="Particular Pagado">Particular Pagado</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold mb-1">Último puntaje PAES (opcional)</label>
            <select className="form-select" value={datosFormulario.puntajePaes} onChange={(e) => actualizarCampo("puntajePaes", e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="400-500">400 - 500 puntos</option>
              <option value="500-600">500 - 600 puntos</option>
              <option value="600-700">600 - 700 puntos</option>
              <option value="700+">Más de 700 puntos</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold mb-1">Ranking de notas (%) (opcional)</label>
            <select className="form-select" value={datosFormulario.rankingNotas} onChange={(e) => actualizarCampo("rankingNotas", e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="Top 10%">Top 10% de la generación</option>
              <option value="Top 30%">Top 30% de la generación</option>
              <option value="Top 50%">Top 50% de la generación</option>
            </select>
          </div>

          <div className="d-flex justify-content-between mt-4">
            <button onClick={() => setPaso(1)} className="btn btn-secondary px-4">Cancelar</button>
            <button onClick={() => setPaso(3)} className="btn btn-primary px-4">Siguiente</button>
          </div>
        </div>
      </div>
    );
  }

  // --- REGISTRO ETAPA 3: DATOS DE ACCESO ---
  if (paso === 3) {
    return (
      <div className="card shadow-sm" style={{ maxWidth: "450px", margin: "40px auto", padding: "25px", borderRadius: "12px" }}>
        <h2 className="text-center fw-bold mb-1">CREAR CUENTA GRATUITA</h2>
        <p className="text-center text-muted small mb-4">Regístrate para acceder a todas las herramientas de orientación vocacional</p>
        
        <div className="p-3 border rounded bg-white">
          <h5 className="fw-bold text-center mb-3">DATOS DE ACCESO</h5>
          
          {mensajeError && <div className="alert alert-danger py-1 small">{mensajeError}</div>}

          <form onSubmit={manejarRegistroFinal}>
            <div className="mb-3">
              <label className="form-label small fw-bold mb-1">Correo electrónico *</label>
              <input type="email" required className="form-control" value={datosFormulario.correo} onChange={(e) => actualizarCampo("correo", e.target.value)} placeholder="Agripino@gmail.cl" />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold mb-1">Contraseña *</label>
              <input type="password" required className="form-control" value={datosFormulario.contrasena} onChange={(e) => actualizarCampo("contrasena", e.target.value)} placeholder="********" />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold mb-1">Confirmar contraseña *</label>
              <input type="password" required className="form-control" value={datosFormulario.confirmarContrasena} onChange={(e) => actualizarCampo("confirmarContrasena", e.target.value)} placeholder="********" />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold d-block mb-2">¿Cómo te identificas?</label>
              <div className="form-check">
                <input className="form-check-input" type="radio" name="tipoUsuario" id="est" checked={datosFormulario.tipoUsuario === "Estudiante"} onChange={() => actualizarCampo("tipoUsuario", "Estudiante")} />
                <label className="form-check-label small" htmlFor="est">Estudiante</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="radio" name="tipoUsuario" id="ori" checked={datosFormulario.tipoUsuario === "Orientador"} onChange={() => actualizarCampo("tipoUsuario", "Orientador")} />
                <label className="form-check-label small" htmlFor="ori">Orientador</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="radio" name="tipoUsuario" id="apo" checked={datosFormulario.tipoUsuario === "Apoderado"} onChange={() => actualizarCampo("tipoUsuario", "Apoderado")} />
                <label className="form-check-label small" htmlFor="apo">Apoderado</label>
              </div>
              {/* LA OPCIÓN DE ADMIN SE REMOVIÓ DE AQUÍ PARA ASIGNARSE EXCLUSIVAMENTE DESDE EL PANEL DE SUPABASE */}
            </div>

            {/* SECCIÓN INTERACTIVA CON ENLACE AL MODAL */}
            <div className="form-check mb-4 d-flex align-items-center gap-1">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="terminos" 
                checked={datosFormulario.aceptaTerminos} 
                onChange={manejarCambioCheckbox} 
              />
              <label className="form-check-label small" htmlFor="terminos">
                Acepto los{" "}
                <span 
                  className="text-primary text-decoration-underline" 
                  style={{ cursor: "pointer", fontWeight: "500" }}
                  onClick={() => setAbrirModal(true)}
                >
                  términos y condiciones
                </span>
              </label>
            </div>

            <div className="d-flex justify-content-between mt-4">
              <button type="button" onClick={() => setPaso(2)} className="btn btn-secondary px-4">Cancelar</button>
              <button type="submit" disabled={cargando} className="btn btn-primary px-4">
                {cargando ? "Registrando..." : "Registrar"}
              </button>
            </div>
          </form>
        </div>

        {/* MODAL CONECTADO AL ESTADO DE APERTURA */}
        <ModalTerminos 
          mostrar={abrirModal} 
          ordenarCierre={() => setAbrirModal(false)} 
          alAceptar={() => {
            actualizarCampo("aceptaTerminos", true);
            solicitarUbicacionGPS(); // Pide la ubicación si aceptan a través del botón del modal
          }} 
        />
      </div>
    );
  }

  // --- REGISTRO ETAPA 4: CUENTA CREADA ---
  if (paso === 4) {
    return (
      <div className="card shadow-sm text-center" style={{ maxWidth: "450px", margin: "40px auto", padding: "25px", borderRadius: "12px" }}>
        <div className="p-4 border rounded bg-white">
          <h2 className="fw-bold mb-3" style={{ color: "#2d4a41" }}>CUENTA CREADA</h2>
          <h5 className="fw-bold mb-4">¡Bienvenido/a a Elige tu Futuro!</h5>
          
          <div className="my-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-person-check text-secondary mb-2" viewBox="0 0 16 16">
              <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m1.679-4.493-1.335 2.226a.75.75 0 0 1-1.108.158L10.2 12.892a.75.75 0 0 1 .918-1.185l.81.63 1.055-1.758a.75.75 0 0 1 1.326.13aM11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/>
              <path d="M8 2a3 3 0 1 1-6 0 3 3 0 0 1 6 0m4 8c0 1-1 1-1 1H1s0-1 1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C9.516 10.68 8.289 10 7 10s-2.516.68-3.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
            </svg>
            <p className="fw-bold mb-1">{datosFormulario.correo}</p>
          </div>

          <p className="text-muted small px-2">
            Tu cuenta ha sido registrada con éxito en el sistema. Ya puedes iniciar sesión para configurar tu perfil.
          </p>

          <button onClick={volverAlLoginInicial} className="btn btn-outline-secondary w-100 mt-4 fw-bold">
            IR A INICIAR SESIÓN
          </button>
        </div>
      </div>
    );
  }
}

export default Login;