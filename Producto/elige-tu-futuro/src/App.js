import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import React from 'react';
import Home from './vistas/Home';

function App() {
  return (
    <div className="App">
      {/* Llamamos a la vista principal */}
      <Home />
    </div>
  );
}

export default App;
