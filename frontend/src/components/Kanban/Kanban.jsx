// src/components/Kanban/Kanban.jsx
import React from "react";
import { Row, Col, Empty } from "antd";
import TaskCard from "../TaskCard/TaskCard";

const statusColors = {
  "In Progress": "#1890ff",
  "Done": "#52c41a",
  "Paused": "#faad14",
  "Review": "#722ed1"
};

const statusLabels = {
  "In Progress": "En Progreso",
  "Done": "Hecho",
  "Paused": "Pausado",
  "Review": "Revisión"
};

const Kanban = ({ tasks, groups, onTaskUpdated, showEditModal }) => {
  // Validación de que tasks sea un array válido
  const validTasks = Array.isArray(tasks) ? tasks.filter(task => task && typeof task === 'object') : [];
  // Validación de que groups sea un array válido
  const validGroups = Array.isArray(groups) ? groups.filter(group => group && typeof group === 'object') : [];

  const getTasksByStatus = () => {
    const statuses = ["In Progress", "Paused", "Review", "Done"];
    const tasksByStatus = {};
    statuses.forEach(status => {
      tasksByStatus[status] = validTasks.filter(task => task.status === status);
    });
    return tasksByStatus;
  };

  const tasksByStatus = getTasksByStatus();
  const statuses = ["In Progress", "Paused", "Review", "Done"];

  return (
    <Row gutter={16}>
      {statuses.map(status => (
        <Col xs={24} sm={24} md={12} lg={6} key={status}>
          <div style={{ 
            background: '#f0f2f5', 
            padding: 16, 
            borderRadius: 4, 
            height: '100%',
            minHeight: '500px' 
          }}>
            <h3 style={{ 
              color: statusColors[status], 
              marginBottom: 16,
              padding: '8px',
              background: 'white',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              {statusLabels[status]} ({tasksByStatus[status]?.length || 0})
            </h3>
            <div className="task-list" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
              {tasksByStatus[status]?.length > 0 ? (
                tasksByStatus[status].map(task => (
                  <TaskCard 
                    key={task._id} 
                    task={task} 
                    groups={validGroups}
                    onTaskUpdated={onTaskUpdated}
                    showEditModal={showEditModal}
                  />
                ))
              ) : (
                <Empty description="No hay tareas" />
              )}
            </div>
          </div>
        </Col>
      ))}
    </Row>
  );
};

export default Kanban;