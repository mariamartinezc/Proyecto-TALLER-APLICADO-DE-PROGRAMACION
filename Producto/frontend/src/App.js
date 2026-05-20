import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';

import './App.css';

import React from 'react';

import Home from './vistas/Home';
import Mapa from './vistas/Mapa';
import TestVocacional from './vistas/TestVocacional';

function App() {

  return (

    <div className="App">

      {/* Vista principal */}
      <Home />
      <Mapa />
      <TestVocacional />

    </div>

  );

}

export default App;