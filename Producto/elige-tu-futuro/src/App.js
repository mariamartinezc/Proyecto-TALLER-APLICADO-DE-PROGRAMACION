import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';

import './App.css';

import React from 'react';

import Home from './vistas/Home';


function App() {

  return (

    <div className="App">

      {/* Vista principal */}
      <Home />
    </div>

  );

}

export default App;