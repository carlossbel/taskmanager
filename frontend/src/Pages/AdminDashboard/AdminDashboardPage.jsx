// src/pages/AdminDashboard/AdminDashboardPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { 
  Button, 
  Card, 
  Tabs, 
  Typography, 
  Spin, 
  message,
  Statistic,
  Row,
  Col
} from "antd";
import { 
  ReloadOutlined,
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import UserService from "../../services/userService";
import TaskService from "../../services/taskService";
import GroupService from "../../services/groupService";
import UserList from "../../components/UserList/UserList";
import AuthService from "../../services/authService";

const { Title } = Typography;
const { TabPane } = Tabs;

const AdminDashboardPage = () => {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalGroups: 0
  });

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = AuthService.getCurrentUser();
      setCurrentUserId(currentUser.userId);
      
      // Fetch users
      const usersData = await UserService.getAllUsers();
      setUsers(usersData);
      
      // Fetch all tasks
      const tasksData = await TaskService.getAllTasks();
      setTasks(tasksData);
      
      // Fetch all groups
      const groupsData = await GroupService.getAllGroups();
      setGroups(groupsData);
      
      // Calculate stats
      setStats({
        totalUsers: usersData.length,
        totalTasks: tasksData.length,
        completedTasks: tasksData.filter(task => task.status === 'Done').length,
        totalGroups: groupsData.length
      });
      
    } catch (error) {
      console.error("Error fetching admin data:", error);
      message.error("Error al cargar los datos de administrador.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // User management handlers
  const handleEditUser = (user) => {
    // Implement edit user functionality
    console.log("Edit user:", user);
  };

  const handleDeleteUser = async (userId) => {
    try {
      await UserService.deleteUser(userId);
      message.success("Usuario eliminado con éxito");
      fetchData();
    } catch (error) {
      console.error("Error deleting user:", error);
      message.error("Error al eliminar el usuario");
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    try {
      await UserService.updateUserRole(userId, newRole);
      message.success("Rol de usuario actualizado con éxito");
      fetchData();
    } catch (error) {
      console.error("Error updating user role:", error);
      message.error("Error al actualizar el rol del usuario");
    }
  };

  // Render statistics cards
  const renderStats = () => (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Total Usuarios"
            value={stats.totalUsers}
            valueStyle={{ color: '#1890ff' }}
            prefix={<UserOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Total Tareas"
            value={stats.totalTasks}
            valueStyle={{ color: '#52c41a' }}
            prefix={<CalendarOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Tareas Completadas"
            value={stats.completedTasks}
            valueStyle={{ color: '#faad14' }}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Total Grupos"
            value={stats.totalGroups}
            valueStyle={{ color: '#722ed1' }}
            prefix={<TeamOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );

  // Main content
  const renderContent = () => {
    if (loading) {
      return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spin size="large" /></div>;
    }

    return (
      <>
        {renderStats()}
        
        <Tabs defaultActiveKey="users">
          <TabPane tab="Gestión de Usuarios" key="users">
            <UserList 
              users={users}
              loading={loading}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onChangeRole={handleChangeUserRole}
              currentUserId={currentUserId}
            />
          </TabPane>
          <TabPane tab="Estadísticas" key="stats">
            <p>Aquí puedes implementar gráficos y estadísticas detalladas</p>
          </TabPane>
        </Tabs>
      </>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <Title level={2}>Panel de Administración</Title>
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
    </div>
  );
};

export default AdminDashboardPage;