// src/pages/UserManagement/UserManagementPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { 
  Button, 
  Card, 
  Typography, 
  Spin, 
  message,
  Modal,
  Form,
  Input,
  Select
} from "antd";
import { 
  ReloadOutlined,
  UserAddOutlined
} from "@ant-design/icons";
import UserService from "../../services/userService";
import AuthService from "../../services/authService";
import UserList from "../../components/UserList/UserList";

const { Title } = Typography;
const { Option } = Select;

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();

  // Fetch data from API
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = AuthService.getCurrentUser();
      setCurrentUserId(currentUser.userId);
      
      // Fetch users
      const usersData = await UserService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("Error al cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // User management handlers
  const showAddUserModal = () => {
    setIsEditMode(false);
    setSelectedUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditUserModal = (user) => {
    setIsEditMode(true);
    setSelectedUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role || 'user'
    });
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
  };

  const handleModalSubmit = async (values) => {
    try {
      if (isEditMode && selectedUser) {
        // Update existing user
        await UserService.updateUser(selectedUser._id, values);
        message.success("Usuario actualizado con éxito");
      } else {
        // Create new user
        await UserService.createAdminUser(values);
        message.success("Usuario creado con éxito");
      }
      
      fetchUsers();
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Error with user operation:", error);
      message.error(isEditMode 
        ? "Error al actualizar el usuario" 
        : "Error al crear el usuario"
      );
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await UserService.deleteUser(userId);
      message.success("Usuario eliminado con éxito");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      message.error("Error al eliminar el usuario");
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    try {
      await UserService.updateUserRole(userId, newRole);
      message.success("Rol de usuario actualizado con éxito");
      fetchUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      message.error("Error al actualizar el rol del usuario");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <Title level={2}>Gestión de Usuarios</Title>
        <div>
          <Button 
            type="primary" 
            icon={<UserAddOutlined />} 
            onClick={showAddUserModal}
            style={{ marginRight: 12 }}
          >
            Nuevo Usuario
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchUsers}
            loading={loading}
          >
            Actualizar
          </Button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : (
          <UserList 
            users={users}
            loading={loading}
            onEditUser={showEditUserModal}
            onDeleteUser={handleDeleteUser}
            onChangeRole={handleChangeUserRole}
            currentUserId={currentUserId}
          />
        )}
      </Card>

      {/* User Modal Form */}
      <Modal
        title={isEditMode ? "Editar Usuario" : "Crear Nuevo Usuario"}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
        >
          <Form.Item
            name="username"
            label="Nombre de Usuario"
            rules={[
              { required: true, message: "Por favor ingresa un nombre de usuario" }
            ]}
          >
            <Input placeholder="Nombre de Usuario" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Correo Electrónico"
            rules={[
              { required: true, message: "Por favor ingresa un correo electrónico" },
              { type: 'email', message: "Por favor ingresa un correo electrónico válido" }
            ]}
          >
            <Input placeholder="Correo Electrónico" />
          </Form.Item>

          {!isEditMode && (
            <Form.Item
              name="password"
              label="Contraseña"
              rules={[
                { required: true, message: "Por favor ingresa una contraseña" },
                { min: 6, message: "La contraseña debe tener al menos 6 caracteres" }
              ]}
            >
              <Input.Password placeholder="Contraseña" />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="Rol"
            initialValue="user"
          >
            <Select>
              <Option value="user">Usuario</Option>
              <Option value="admin">Administrador</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%' }}
            >
              {isEditMode ? "Actualizar Usuario" : "Crear Usuario"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagementPage;