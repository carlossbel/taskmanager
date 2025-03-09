// src/components/GroupCard/GroupCard.jsx
import React from "react";
import { Card, Button, Avatar, Tooltip } from "antd";
import { TeamOutlined, PlusOutlined, EyeOutlined, EditOutlined } from "@ant-design/icons";
import AuthService from "../../services/authService";

const GroupCard = ({ group, onCreateGroupTask, onViewGroupTasks, onEditGroup }) => {
  // Verificación exhaustiva: si group no es un objeto válido, no renderizamos nada
  if (!group || typeof group !== 'object') {
    return null;
  }

  const currentUser = AuthService.getCurrentUser();
  
  // Verificación segura para el owner
  const isOwner = group && 
                 group.ownerId && 
                 currentUser && 
                 currentUser.userId && 
                 String(group.ownerId) === String(currentUser.userId);

  // Preparar acciones para el componente Card de manera segura
  const cardActions = [];
  
  // Acción para ver tareas (siempre disponible si hay un grupo válido con ID)
  if (group && group._id) {
    cardActions.push(
      <Button 
        key="view"
        type="text" 
        icon={<EyeOutlined />} 
        onClick={() => onViewGroupTasks(group._id)}
      >
        Ver Tareas
      </Button>
    );
  }
  
  // Acciones disponibles solo para el dueño del grupo
  if (isOwner && typeof onCreateGroupTask === 'function') {
    cardActions.push(
      <Button 
        key="add"
        type="text" 
        icon={<PlusOutlined />} 
        onClick={() => onCreateGroupTask(group._id)}
      >
        Nueva Tarea
      </Button>
    );
  }
  
  if (isOwner && typeof onEditGroup === 'function') {
    cardActions.push(
      <Button 
        key="edit"
        type="text" 
        icon={<EditOutlined />} 
        onClick={() => onEditGroup(group)}
      >
        Editar
      </Button>
    );
  }

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TeamOutlined style={{ marginRight: 8 }} />
          {group.name || 'Grupo sin nombre'}
        </div>
      } 
      style={{ 
        width: 300,
        minWidth: 300,
        marginRight: 16,
        marginBottom: 16,
        borderTop: '4px solid #1890ff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}
      actions={cardActions.length > 0 ? cardActions : undefined}
    >
      <div style={{ marginBottom: 16 }}>
        <p><strong>Miembros:</strong> {Array.isArray(group.user) ? group.user.length : 0}</p>
        
        {Array.isArray(group.user) && group.user.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 8 }}>
            {group.user.slice(0, 5).map((user, index) => {
              if (!user) return null; // Evitar renderizar usuarios nulos/undefined
              
              const username = typeof user === 'string' 
                ? user 
                : user.username || 'Usuario';
                
              return (
                <Tooltip title={username} key={index}>
                  <Avatar size="small">
                    {typeof user === 'string' 
                      ? user.charAt(0).toUpperCase() 
                      : (user.username?.charAt(0).toUpperCase() || 'U')}
                  </Avatar>
                </Tooltip>
              );
            })}
            {group.user.length > 5 && (
              <Tooltip title={`${group.user.length - 5} más`}>
                <Avatar size="small">+{group.user.length - 5}</Avatar>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default GroupCard;