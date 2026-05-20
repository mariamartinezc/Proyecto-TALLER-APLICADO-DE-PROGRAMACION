import React from 'react';

const BarraDeProgreso = ({ porcentaje }) => {
  return (
    <div style={{ width: '100%', backgroundColor: '#d1d5db', height: '10px', borderRadius: '5px', margin: '20px 0' }}>
      <div 
        style={{ 
          width: `${porcentaje}%`, 
          backgroundColor: '#3182ce', 
          height: '100%', 
          borderRadius: '5px', 
          transition: 'width 0.4s ease-in-out' 
        }}
      ></div>
    </div>
  );
};

export default BarraDeProgreso;