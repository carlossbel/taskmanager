// src/pages/Dashboard/components/ViewSelector.jsx
import React from 'react';
import { Button } from 'antd';

const ViewSelector = ({ currentView, setCurrentView, groups }) => {
  // Asegurarse de que groups sea un array
  const safeGroups = Array.isArray(groups) ? groups : [];
  
  // Filtrar elementos no válidos
  const validGroups = safeGroups.filter(group => group && typeof group === 'object' && group._id);
  
  return (
    <div style={{ marginBottom: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button 
        type={currentView === 'all' ? 'primary' : 'default'} 
        onClick={() => setCurrentView('all')}
      >
        Todas las Tareas
      </Button>
      <Button 
        type={currentView === 'personal' ? 'primary' : 'default'} 
        onClick={() => setCurrentView('personal')}
      >
        Tareas Personales
      </Button>
      {validGroups.map(group => (
        <Button 
          key={group._id}
          type={currentView === group._id ? 'primary' : 'default'} 
          onClick={() => setCurrentView(group._id)}
        >
          {group.name || 'Grupo sin nombre'}
        </Button>
      ))}
    </div>
  );
};

export default ViewSelector;