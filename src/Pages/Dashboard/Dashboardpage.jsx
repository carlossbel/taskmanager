// src/pages/Dashboard/DashboardPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { 
  FloatButton, 
  Modal, 
  Form, 
  Button, 
  message, 
  Tabs, 
  Spin, 
  Typography
} from "antd";
import { 
  PlusOutlined, 
  ReloadOutlined
} from "@ant-design/icons";
import TaskService from "../../services/taskService";
import GroupService from "../../services/groupService";
import UserService from "../../services/userService";
import AuthService from "../../services/authService";
import Kanban from "../../components/Kanban/Kanban";
import GroupCard from "../../components/GroupCard/GroupCard";
import TaskForm from "../../components/TaskForm/TaskForm";
import DashboardStats from "./components/DashboardStats";
import ViewSelector from "./components/ViewSelector";

const { Title, Text } = Typography;

const DashboardPage = () => {
  // State for data
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // State for task filtering
  const [currentView, setCurrentView] = useState('all');
  
  // State for modals
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [isEditTaskModalVisible, setIsEditTaskModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Form instances
  const [taskForm] = Form.useForm();
  const [editTaskForm] = Form.useForm();

  // Stats
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    groups: 0
  });

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const user = AuthService.getCurrentUser();
      if (user && user.userId) {
        setCurrentUserId(user.userId);
        
        // Fetch tasks
        const tasksData = await TaskService.getUserTasks(user.userId);
        setTasks(Array.isArray(tasksData) ? tasksData : []);
        
        // Fetch groups
        const groupsData = await GroupService.getUserGroups(user.userId);
        // Aseguramos que groups sea un array válido y filtramos elementos null/undefined
        setGroups(Array.isArray(groupsData) ? groupsData.filter(g => g) : []);
        
        // Fetch users for dropdown selections
        const usersData = await UserService.getAllUsers();
        setUsers(Array.isArray(usersData) ? usersData : []);
        
        // Calculate stats
        setStats({
          totalTasks: tasksData.length,
          completedTasks: tasksData.filter(task => task.status === 'Done').length,
          pendingTasks: tasksData.filter(task => task.status !== 'Done').length,
          groups: groupsData.length
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Error al cargar los datos. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Solo cargamos los datos cuando se monta el componente
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Modal handlers
  const showTaskModal = () => {
    taskForm.resetFields();
    setIsTaskModalVisible(true);
  };

  const showEditTaskModal = (task) => {
    if (task) {
      setSelectedTask(task);
      editTaskForm.resetFields();
      
      // Solo cargar el estado para edición
      editTaskForm.setFieldsValue({
        status: task.status || 'In Progress'
      });
      
      setIsEditTaskModalVisible(true);
    }
  };

  const handleTaskCancel = () => {
    taskForm.resetFields();
    setIsTaskModalVisible(false);
  };

  const handleEditTaskCancel = () => {
    editTaskForm.resetFields();
    setIsEditTaskModalVisible(false);
    setSelectedTask(null);
  };

  // Form submit handlers
  const handleTaskSubmit = async (values) => {
    try {
      await TaskService.createPersonalTask(values);
      message.success("Tarea personal creada exitosamente");
      fetchData();
      setIsTaskModalVisible(false);
      taskForm.resetFields();
    } catch (error) {
      console.error("Error creating personal task:", error);
      message.error("Error al crear la tarea personal. Por favor, intenta nuevamente.");
    }
  };

  const handleEditTaskSubmit = async (values) => {
    try {
      if (!selectedTask) {
        message.error("No hay tarea seleccionada para editar");
        return;
      }
      
      // Solo actualizamos el estado de la tarea
      await TaskService.updateTaskStatus(selectedTask._id, values.status);
      message.success("Estado de la tarea actualizado exitosamente");
      fetchData();
      setIsEditTaskModalVisible(false);
      editTaskForm.resetFields();
      setSelectedTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
      message.error("Error al actualizar la tarea. Por favor, intenta nuevamente.");
    }
  };

  // Filter tasks based on current view
  const getFilteredTasks = () => {
    if (currentView === 'all') return tasks;
    if (currentView === 'personal') return tasks.filter(task => !task.groupId);
    return tasks.filter(task => task.groupId === currentView);
  };
  
  // Render group cards
  const renderGroupCards = () => {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {groups && groups.length > 0 ? (
          // Filtrar grupos nulos o indefinidos antes de mapear
          groups.filter(group => group && typeof group === 'object').map(group => (
            <GroupCard 
              key={group._id} 
              group={group} 
              onCreateGroupTask={() => {}} // Los usuarios normales no pueden crear tareas de grupo
              onViewGroupTasks={(groupId) => setCurrentView(groupId)}
              onEditGroup={() => {}} // Los usuarios normales no pueden editar grupos
            />
          ))
        ) : (
          <div style={{ padding: '20px 0' }}>
            <Text type="secondary">No tienes grupos actualmente.</Text>
          </div>
        )}
      </div>
    );
  };

  // Configuración de las pestañas
  const tabItems = [
    {
      key: 'tasks',
      label: 'Mis Tareas',
      children: (
        <>
          <ViewSelector 
            currentView={currentView} 
            setCurrentView={setCurrentView} 
            groups={groups || []} 
          />
          <Kanban 
            tasks={getFilteredTasks()} 
            groups={groups || []} 
            onTaskUpdated={fetchData}
            showEditModal={showEditTaskModal}
          />
        </>
      )
    },
    {
      key: 'groups',
      label: 'Mis Grupos',
      children: renderGroupCards()
    }
  ];

  // Main content
  const renderContent = () => {
    if (loading) {
      return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spin size="large" /></div>;
    }

    return (
      <>
        <DashboardStats stats={stats} />
        <Tabs defaultActiveKey="tasks" items={tabItems} />
      </>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <Title level={2}>Dashboard</Title>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={fetchData}
          loading={loading}
        >
          Actualizar
        </Button>
      </div>

      {renderContent()}

      {/* Create Personal Task Modal */}
      <Modal 
        title="Crear Nueva Tarea Personal" 
        open={isTaskModalVisible} 
        onCancel={handleTaskCancel} 
        footer={null}
        destroyOnClose
      >
        <TaskForm 
          form={taskForm} 
          onFinish={handleTaskSubmit} 
          isGroupTask={false}
          editMode={false}
        />
      </Modal>

      {/* Edit Task Modal - Solo para cambiar estado */}
      <Modal 
        title="Cambiar Estado de Tarea" 
        open={isEditTaskModalVisible} 
        onCancel={handleEditTaskCancel} 
        footer={null}
        destroyOnClose
      >
        <TaskForm 
          form={editTaskForm} 
          onFinish={handleEditTaskSubmit} 
          initialValues={selectedTask}
          buttonText="Actualizar Estado"
          editMode={true} // Indicar que estamos en modo edición para mostrar solo el campo de estado
        />
      </Modal>

      {/* Floating Action Button - Solo para crear tareas personales */}
      <FloatButton 
        icon={<PlusOutlined />} 
        type="primary" 
        onClick={showTaskModal}
        tooltip="Nueva Tarea Personal"
      />
    </div>
  );
};

export default DashboardPage;