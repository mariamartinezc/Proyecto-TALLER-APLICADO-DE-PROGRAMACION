// src/vistas/Dashboard.js
import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import { supabase } from '../supabaseClient';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    usuarios: [],
    carreras: [],
    sedes: [],
    carrerasSedes: []
  });
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [usuariosResult, carrerasResult, sedesResult, carrerasSedesResult] = await Promise.all([
        supabase.from('usuarios').select('*'),
        supabase.from('carreras').select('*'),
        supabase.from('sedes').select('*'),
        supabase.from('carreras_sedes').select('*')
      ]);

      if (usuariosResult.error) throw usuariosResult.error;
      if (carrerasResult.error) throw carrerasResult.error;
      if (sedesResult.error) throw sedesResult.error;
      if (carrerasSedesResult.error) throw carrerasSedesResult.error;

      console.log('Datos cargados:', {
        usuarios: usuariosResult.data?.length || 0,
        carreras: carrerasResult.data?.length || 0,
        sedes: sedesResult.data?.length || 0,
        carrerasSedes: carrerasSedesResult.data?.length || 0
      });

      setData({
        usuarios: usuariosResult.data || [],
        carreras: carrerasResult.data || [],
        sedes: sedesResult.data || [],
        carrerasSedes: carrerasSedesResult.data || []
      });

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setError(`Error al cargar datos: ${error.message}`);
      setLoading(false);
    }
  };

  // ============================================================
  // CÁLCULOS
  // ============================================================
  const totalUsuarios = data.usuarios.length;
  const totalEstudiantes = data.usuarios.filter(u => u.tipo_usuario === 'Estudiante').length;
  const totalSedes = data.sedes.length;
  const totalCarreras = data.carreras.length;

  // Distribución por género
  const generos = data.usuarios.reduce((acc, u) => {
    const g = u.genero || 'No especifica';
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  // Capacidad por sede
  const sedesCapacidad = data.sedes.map(sede => {
    const capacidad = data.carrerasSedes
      .filter(cs => cs.sede_id === sede.id)
      .reduce((acc, cs) => acc + (Number(cs.cupos) || 0), 0);

    return {
      nombre: sede.nombre || `Sede ${sede.id}`,
      capacidad: capacidad,
      region: sede.region || 'No especificada',
      comuna: sede.comuna || ''
    };
  }).filter(s => s.capacidad > 0);

  const capacidadTotal = sedesCapacidad.reduce((acc, s) => acc + s.capacidad, 0);

  // Carreras más populares
  const carrerasPopulares = data.carrerasSedes.reduce((acc, cs) => {
    const carrera = data.carreras.find(c => c.id === cs.carrera_id);
    if (carrera) {
      acc[carrera.nombre] = (acc[carrera.nombre] || 0) + 1;
    }
    return acc;
  }, {});

  // Tipos de usuario
  const tiposUsuario = data.usuarios.reduce((acc, u) => {
    const tipo = u.tipo_usuario || 'Estudiante';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  // PALETA DE COLORES (basada en tu estilo)
  const chartColors = [
    '#61dafb', // Celeste principal
    '#4fa8c7', // Celeste oscuro
    '#8de4ff', // Celeste claro
    '#51CF66', // Verde
    '#FF6B6B', // Rojo
    '#FFA94D', // Naranja
    '#FFD93D', // Amarillo
    '#9775FA', // Morado
    '#FCC419', // Dorado
    '#20C997'  // Turquesa
  ];

  // ============================================================
  // RENDERIZADO
  // ============================================================

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="loading-container">
          <div className="spinner">
            <i className="fa fa-spinner fa-spin"></i>
          </div>
          <p style={{ marginTop: '20px', fontSize: '18px', fontWeight: '600', color: '#fff' }}>
            Cargando dashboard...
          </p>
          <div className="loading-progress">
            <div className="loading-progress-bar"></div>
          </div>
          <small style={{ marginTop: '10px', color: '#a0aec0' }}>Conectando con Supabase</small>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrapper">
        <div className="alert-danger">
          <h4><i className="fa fa-exclamation-triangle"></i> Error</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchData}>
            <i className="fa fa-refresh"></i> Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      {/* ===== TÍTULO PRINCIPAL ===== */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #1f2329 0%, #282c34 100%)',
        border: '1px solid rgba(97, 218, 251, 0.1)'
      }}>
        <div className="card-header" style={{ borderBottom: '1px solid rgba(97, 218, 251, 0.1)' }}>
          <h3 className="card-title">
            <i className="fa fa-dashboard" style={{ color: '#61dafb' }}></i>
            Dashboard Académico DUOC UC
          </h3>
          <div>
            <span className="badge badge-info">
              <i className="fa fa-refresh"></i> Datos en tiempo real
            </span>
            <button 
              className="btn btn-sm" 
              onClick={fetchData}
              style={{
                background: 'rgba(122, 35, 54, 0.1)',
                color: '#1a090b',
                marginLeft: '10px',
                borderRadius: '8px',
                padding: '5px 12px',
                border: '1px solid rgba(97, 218, 251, 0.2)',
                cursor: 'pointer'
              }}
            >
              <i className="fa fa-sync-alt"></i>
            </button>
          </div>
        </div>
        <div className="card-body" style={{ padding: '15px 24px !important' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#a0aec0' }}>
              <i className="fa fa-graduation-cap" style={{ color: '#61dafb' }}></i> Bienvenido al panel de control académico
            </span>
            <span style={{ fontSize: '13px', color: '#718096' }}>
              Última actualización: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* ===== KPIS ===== */}
      <div className="info-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px', 
        marginBottom: '20px' 
      }}>
        <div className="info-box">
          <div className="info-box-icon">
            <i className="fa fa-graduation-cap"></i>
          </div>
          <div className="info-box-content">
            <div className="info-box-text">Total Estudiantes</div>
            <div className="info-box-number">{totalEstudiantes}</div>
          </div>
        </div>

        <div className="info-box">
          <div className="info-box-icon">
            <i className="fa fa-building"></i>
          </div>
          <div className="info-box-content">
            <div className="info-box-text">Total Sedes</div>
            <div className="info-box-number">{totalSedes}</div>
          </div>
        </div>

        <div className="info-box">
          <div className="info-box-icon">
            <i className="fa fa-book"></i>
          </div>
          <div className="info-box-content">
            <div className="info-box-text">Total Carreras</div>
            <div className="info-box-number">{totalCarreras}</div>
          </div>
        </div>

        <div className="info-box">
          <div className="info-box-icon">
            <i className="fa fa-cubes"></i>
          </div>
          <div className="info-box-content">
            <div className="info-box-text">Capacidad Total</div>
            <div className="info-box-number">{capacidadTotal.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* ===== GRÁFICOS PRINCIPALES ===== */}
      <div className="chart-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px', 
        marginBottom: '20px' 
      }}>
        {/* Gráfico de Género */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fa fa-venus-mars"></i> Distribución por Género
            </h3>
            <span className="badge badge-info">{Object.keys(generos).length} categorías</span>
          </div>
          <div className="card-body" style={{ height: '340px' }}>
            {Object.keys(generos).length > 0 && totalUsuarios > 0 ? (
              <PieChart data={generos} total={totalUsuarios} colors={chartColors} />
            ) : (
              <div style={{ textAlign: 'center', marginTop: '50px', color: '#718096' }}>
                <i className="fa fa-info-circle" style={{ fontSize: '48px', opacity: 0.3 }}></i>
                <p style={{ marginTop: '15px' }}>No hay datos de género disponibles</p>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de Capacidad por Sede */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fa fa-cubes"></i> Capacidad por Sede
            </h3>
            <span className="badge badge-success">{sedesCapacidad.length} sedes</span>
          </div>
          <div className="card-body" style={{ height: '340px' }}>
            {sedesCapacidad.length > 0 ? (
              <DoughnutChart data={sedesCapacidad} colors={chartColors} />
            ) : (
              <div style={{ textAlign: 'center', marginTop: '50px', color: '#718096' }}>
                <i className="fa fa-info-circle" style={{ fontSize: '48px', opacity: 0.3 }}></i>
                <p style={{ marginTop: '15px' }}>No hay sedes con cupos asignados</p>
                <small style={{ color: '#718096' }}>Verifica que existan registros en carreras_sedes</small>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== GRÁFICOS SECUNDARIOS ===== */}
      <div className="chart-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px', 
        marginBottom: '20px' 
      }}>
        {/* Carreras por Sede */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fa fa-bar-chart"></i> Carreras por Sede
            </h3>
            <span className="badge badge-warning">Top 10</span>
          </div>
          <div className="card-body" style={{ height: '300px' }}>
            {Object.keys(carrerasPopulares).length > 0 ? (
              <BarChart data={carrerasPopulares} colors={chartColors} />
            ) : (
              <div style={{ textAlign: 'center', marginTop: '50px', color: '#718096' }}>
                <i className="fa fa-info-circle" style={{ fontSize: '48px', opacity: 0.3 }}></i>
                <p style={{ marginTop: '15px' }}>No hay carreras asignadas a sedes</p>
              </div>
            )}
          </div>
        </div>

        {/* Tipos de Usuario */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fa fa-users"></i> Distribución por Tipo de Usuario
            </h3>
          </div>
          <div className="card-body" style={{ height: '300px' }}>
            {Object.keys(tiposUsuario).length > 0 ? (
              <PieChart data={tiposUsuario} total={totalUsuarios} colors={chartColors} />
            ) : (
              <div style={{ textAlign: 'center', marginTop: '50px', color: '#718096' }}>
                <i className="fa fa-info-circle" style={{ fontSize: '48px', opacity: 0.3 }}></i>
                <p style={{ marginTop: '15px' }}>No hay datos de tipos de usuario</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== TABLA DE SEDES ===== */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <i className="fa fa-table"></i> Detalle de Sedes y Capacidad
          </h3>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <i className="fa fa-arrow-up"></i> Volver arriba
          </button>
        </div>
        <div className="card-body" style={{ padding: '0' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th><i className="fa fa-building"></i> Sede</th>
                  <th><i className="fa fa-map-marker"></i> Región</th>
                  <th><i className="fa fa-location-arrow"></i> Comuna</th>
                  <th><i className="fa fa-cubes"></i> Capacidad</th>
                  <th><i className="fa fa-percent"></i> % del Total</th>
                  <th><i className="fa fa-tag"></i> Estado</th>
                </tr>
              </thead>
              <tbody>
                {sedesCapacidad.length > 0 ? (
                  sedesCapacidad
                    .sort((a, b) => b.capacidad - a.capacidad)
                    .map((sede, index) => (
                      <tr key={sede.nombre}>
                        <td>
                          <strong>{sede.nombre}</strong>
                          {index === 0 && (
                            <span className="badge badge-success" style={{ marginLeft: '10px' }}>
                              <i className="fa fa-star"></i> Mayor
                            </span>
                          )}
                        </td>
                        <td>{sede.region}</td>
                        <td>{sede.comuna || 'N/A'}</td>
                        <td><strong>{sede.capacidad.toLocaleString()}</strong></td>
                        <td>
                          <div className="progress">
                            <div 
                              className={`progress-bar ${sede.capacidad > (capacidadTotal / sedesCapacidad.length) ? 'bg-success' : 'bg-warning'}`}
                              style={{ width: `${(sede.capacidad / capacidadTotal * 100)}%` }}
                            ></div>
                          </div>
                          <small>{(sede.capacidad / capacidadTotal * 100).toFixed(1)}%</small>
                        </td>
                        <td>
                          {sede.capacidad > (capacidadTotal / sedesCapacidad.length) ? (
                            <span className="badge badge-success">
                              <i className="fa fa-check-circle"></i> Alta demanda
                            </span>
                          ) : (
                            <span className="badge badge-warning">
                              <i className="fa fa-clock"></i> Media demanda
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                      <i className="fa fa-inbox" style={{ fontSize: '32px', display: 'block', marginBottom: '10px', opacity: 0.3 }}></i>
                      No hay datos de sedes con capacidad asignada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== BOTÓN DEBUG ===== */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button 
          className="btn btn-outline-secondary btn-sm"
          onClick={() => setShowDebug(!showDebug)}
        >
          <i className="fa fa-bug"></i> {showDebug ? 'Ocultar' : 'Mostrar'} información de depuración
        </button>
      </div>

      {/* ===== PANEL DEBUG ===== */}
      {showDebug && (
        <div className="debug-card">
          <div className="debug-grid">
            <div>
              <small><strong>👥 Usuarios:</strong> {data.usuarios.length}</small>
            </div>
            <div>
              <small><strong>📚 Carreras:</strong> {data.carreras.length}</small>
            </div>
            <div>
              <small><strong>🏢 Sedes:</strong> {data.sedes.length}</small>
            </div>
            <div>
              <small><strong>🔗 Relaciones:</strong> {data.carrerasSedes.length}</small>
            </div>
          </div>
          <hr style={{ borderColor: 'rgba(97, 218, 251, 0.1)', margin: '15px 0' }} />
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => {
              console.log('📊 Datos completos:', data);
              console.log('📈 Cálculos:', { generos, sedesCapacidad, carrerasPopulares, tiposUsuario });
              alert('Datos enviados a la consola (F12)');
            }}
          >
            <i className="fa fa-terminal"></i> Ver datos en consola
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================
// COMPONENTES DE GRÁFICOS
// ============================================================

// ===== PIE CHART (Para género y tipos de usuario) =====
const PieChart = ({ data, total, colors }) => {
  const labels = Object.keys(data);
  const values = Object.values(data);

  const chartData = {
    labels: labels,
    datasets: [{
      data: values,
      backgroundColor: labels.map((_, i) => colors[i % colors.length]),
      borderWidth: 2,
      borderColor: '#1f2329',
      hoverOffset: 15
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 13, weight: 'bold' },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          color: '#a0aec0'
        }
      },
      tooltip: {
        backgroundColor: '#1f2329',
        titleFont: { size: 14, weight: 'bold', color: '#fff' },
        bodyFont: { size: 13, color: '#a0aec0' },
        padding: 15,
        cornerRadius: 12,
        callbacks: {
          label: function(context) {
            const value = context.parsed;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      duration: 2000
    }
  };

  return <Pie data={chartData} options={options} />;
};

// ===== DOUGHNUT CHART (Para capacidad por sede) =====
const DoughnutChart = ({ data, colors }) => {
  const topItems = data.slice(0, 6);
  const others = data.slice(6);
  const othersTotal = others.reduce((acc, s) => acc + s.capacidad, 0);

  const labels = [...topItems.map(s => s.nombre)];
  const values = [...topItems.map(s => s.capacidad)];

  if (othersTotal > 0) {
    labels.push('Otras sedes');
    values.push(othersTotal);
  }

  const chartData = {
    labels: labels,
    datasets: [{
      data: values,
      backgroundColor: labels.map((_, i) => colors[i % colors.length]),
      borderWidth: 2,
      borderColor: '#1f2329',
      hoverOffset: 15
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 12 },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          color: '#a0aec0'
        }
      },
      tooltip: {
        backgroundColor: '#1f2329',
        titleFont: { size: 14, weight: 'bold', color: '#fff' },
        bodyFont: { size: 13, color: '#a0aec0' },
        padding: 15,
        cornerRadius: 12,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      duration: 2000
    }
  };

  return <Doughnut data={chartData} options={options} />;
};

// ===== BAR CHART (Para carreras por sede) =====
const BarChart = ({ data, colors }) => {
  const sorted = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const chartData = {
    labels: sorted.map(([nombre]) => nombre.length > 20 ? nombre.substring(0, 20) + '...' : nombre),
    datasets: [{
      label: 'Número de sedes',
      data: sorted.map(([, count]) => count),
      backgroundColor: sorted.map((_, i) => colors[i % colors.length]),
      borderColor: 'rgba(31, 35, 41, 0.8)',
      borderWidth: 2,
      borderRadius: 6,
      hoverBackgroundColor: sorted.map((_, i) => {
        const color = colors[i % colors.length];
        return color + 'cc';
      })
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2329',
        titleFont: { size: 14, weight: 'bold', color: '#fff' },
        bodyFont: { size: 13, color: '#a0aec0' },
        padding: 15,
        cornerRadius: 12,
        callbacks: {
          label: function(context) {
            return `📚 ${context.parsed.y} sede(s)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
          stepSize: 1, 
          font: { size: 12, weight: 'bold' },
          color: '#718096'
        },
        grid: { color: 'rgba(97, 218, 251, 0.05)' }
      },
      x: {
        grid: { display: false },
        ticks: { 
          font: { size: 11 },
          maxRotation: 45,
          color: '#718096'
        }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart'
    }
  };

  return <Bar data={chartData} options={options} />;
};

export default Dashboard;