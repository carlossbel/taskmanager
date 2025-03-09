// src/components/TaskCard/TaskCard.jsx
import React from "react";
import { Card, Tag, Typography, Space, Button, Select, message, Tooltip, Avatar } from "antd";
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined, TeamOutlined, ClockCircleOutlined } from "@ant-design/icons";
import moment from "moment";
import TaskService from "../../services/taskService";
import AuthService from "../../services/authService";

const { Text, Paragraph } = Typography;
const { Option } = Select;

const statusColors = {
  "In Progress": { color: "#1890ff", bgColor: "#e6f7ff" },
  "Done": { color: "#52c41a", bgColor: "#f6ffed" },
  "Paused": { color: "#faad14", bgColor: "#fffbe6" },
  "Review": { color: "#722ed1", bgColor: "#f9f0ff" }
};

const statusLabels = {
  "In Progress": "En Progreso",
  "Done": "Hecho",
  "Paused": "Pausado",
  "Review": "Revisión"
};

const TaskCard = ({ task, groups = [], onTaskUpdated, showEditModal }) => {
  // Validar que task sea un objeto válido
  if (!task || typeof task !== 'object') {
    return null;
  }

  const currentUser = AuthService.getCurrentUser();
  
  // Usando validación exhaustiva para evitar errores
  const isOwner = task.userId && currentUser?.userId && 
                  String(task.userId) === String(currentUser.userId);
                  
  const isAssigned = task.assignedTo && Array.isArray(task.assignedTo) && 
                    currentUser?.userId &&
                    task.assignedTo.some(user => 
                      String(typeof user === 'string' ? user : (user?._id || '')) === String(currentUser.userId)
                    );

  const deadlineDate = task.dead_line ? moment(task.dead_line) : null;
  const isOverdue = deadlineDate && 
                   deadlineDate.isBefore(moment()) && 
                   task.status !== "Done";

  // Calcular días restantes o días atrasados
  const calculateDeadlineStatus = () => {
    if (!deadlineDate) return null;
    
    const today = moment();
    if (task.status === 'Done') {
      return { text: "Completada", color: "green" };
    }
    
    const daysRemaining = deadlineDate.diff(today, 'days');
    
    if (daysRemaining < 0) {
      return { 
        text: `Atrasada por ${Math.abs(daysRemaining)} día${Math.abs(daysRemaining) !== 1 ? 's' : ''}`, 
        color: "red" 
      };
    } else if (daysRemaining === 0) {
      return { text: "Vence hoy", color: "orange" };
    } else if (daysRemaining <= 2) {
      return { 
        text: `Vence en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}`, 
        color: "orange" 
      };
    } else {
      return { 
        text: `Vence en ${daysRemaining} días`,
        color: "green"
      };
    }
  };

  const deadlineStatus = calculateDeadlineStatus();

  const handleStatusChange = async (newStatus) => {
    try {
      if (!task._id) {
        message.error("ID de tarea no válido");
        return;
      }
      
      await TaskService.updateTaskStatus(task._id, newStatus);
      message.success("Estado de la tarea actualizado correctamente");
      if (onTaskUpdated && typeof onTaskUpdated === 'function') {
        onTaskUpdated();
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      message.error("Error al actualizar el estado de la tarea");
    }
  };

  const handleDeleteTask = async () => {
    try {
      if (!task._id) {
        message.error("ID de tarea no válido");
        return;
      }
      
      await TaskService.deleteTask(task._id);
      message.success("Tarea eliminada correctamente");
      if (onTaskUpdated && typeof onTaskUpdated === 'function') {
        onTaskUpdated();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      message.error("Error al eliminar la tarea");
    }
  };

  // Find group name if task belongs to a group - Con validación segura
  const getGroupName = () => {
    if (!task.groupId || !Array.isArray(groups) || groups.length === 0) {
      return null;
    }
    
    const group = groups.find(g => g && g._id === task.groupId);
    return group ? group.name : "Grupo no encontrado";
  };

  const groupName = getGroupName();

  return (
    <Card 
      size="small"
      style={{ 
        marginBottom: 16,
        borderLeft: `5px solid ${statusColors[task.status]?.color || '#ddd'}`,
        backgroundColor: 'white'
      }}
      actions={[
        <Select
          value={task.status}
          style={{ width: 120 }}
          onChange={handleStatusChange}
          disabled={!isOwner && !isAssigned}
        >
          <Option value="In Progress">En Progreso</Option>
          <Option value="Done">Hecho</Option>
          <Option value="Paused">Pausado</Option>
          <Option value="Review">Revisión</Option>
        </Select>,
        <Button 
          icon={<EditOutlined />} 
          type="text" 
          onClick={() => showEditModal && typeof showEditModal === 'function' ? showEditModal(task) : null}
          disabled={!isOwner && !isAssigned}
        />,
        <Button 
          icon={<DeleteOutlined />} 
          type="text" 
          danger
          onClick={handleDeleteTask}
          disabled={!isOwner}
        />
      ]}
    >
      <div style={{ marginBottom: 8 }}>
        <Space align="center" style={{ marginBottom: 8, width: '100%', justifyContent: 'space-between' }}>
          <Text strong>{task.name_task || 'Sin nombre'}</Text>
          {isOverdue && (
            <Tooltip title="¡Vencida!">
              <ExclamationCircleOutlined style={{ color: 'red' }} />
            </Tooltip>
          )}
        </Space>
        
        <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: '0.9em', marginBottom: 8 }}>
          {task.description || 'Sin descripción'}
        </Paragraph>
        
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          {/* Destacar la fecha límite con un indicador visual */}
          {deadlineDate && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: 8, 
              background: isOverdue ? '#fff2f0' : '#f6ffed', 
              padding: '4px 8px',
              borderRadius: '4px'
            }}>
              <ClockCircleOutlined style={{ 
                marginRight: 8, 
                color: deadlineStatus?.color || 'inherit' 
              }} />
              <Text type={isOverdue ? "danger" : "secondary"} style={{ fontSize: '0.9em' }}>
                {deadlineStatus?.text || deadlineDate.format('DD/MM/YYYY')}
              </Text>
            </div>
          )}
          
          {task.category && (
            <Tag style={{ marginTop: 4 }}>{task.category}</Tag>
          )}
          
          {groupName && (
            <div style={{ marginTop: 4 }}>
              <Tag icon={<TeamOutlined />} color="blue">{groupName}</Tag>
            </div>
          )}
          
          {task.assignedTo && Array.isArray(task.assignedTo) && task.assignedTo.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: '0.8em', display: 'block' }}>
                Asignado a:
              </Text>
              <Avatar.Group maxCount={3} size="small" style={{ marginTop: 4 }}>
                {task.assignedTo.map((user, index) => {
                  if (!user) return null; // Skip invalid users
                  
                  const username = typeof user === 'string' 
                    ? user 
                    : user.username || user.email || 'Usuario';
                  
                  return (
                    <Tooltip title={username} key={index}>
                      <Avatar size="small">
                        {typeof user === 'string' 
                          ? (user.charAt(0) || 'U').toUpperCase() 
                          : (user.username?.charAt(0) || 'U').toUpperCase()}
                      </Avatar>
                    </Tooltip>
                  );
                })}
              </Avatar.Group>
            </div>
          )}
        </Space>
      </div>
    </Card>
  );
};

export default TaskCard;