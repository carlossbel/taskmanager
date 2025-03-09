// src/pages/AdminGroups/AdminGroupsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { 
  Table, 
  Card, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Select, 
  message, 
  Tooltip, 
  Typography, 
  Input,
  Popconfirm,
  Avatar,
  Tag
} from "antd";
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  UserAddOutlined,
  UserDeleteOutlined
} from "@ant-design/icons";
import GroupService from "../../services/groupService";
import UserService from "../../services/userService";

const { Title, Text } = Typography;
const { Option } = Select;

const AdminGroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isAddUserModalVisible, setIsAddUserModalVisible] = useState(false);
  const [selectedGroupForUser, setSelectedGroupForUser] = useState(null);
  const [form] = Form.useForm();
  const [userForm] = Form.useForm();

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all groups
      const groupsData = await GroupService.getAllGroups();
      setGroups(groupsData);
      
      // Fetch all users
      const usersData = await UserService.getAllUsers();
      setUsers(usersData);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Modal handlers
  const showCreateModal = () => {
    setIsEditMode(false);
    setSelectedGroup(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (group) => {
    setIsEditMode(true);
    setSelectedGroup(group);
    
    // Format group data for form
    const formattedGroup = {
      ...group,
      user: group.user?.map(user => typeof user === 'string' ? user : user._id)
    };
    
    form.setFieldsValue(formattedGroup);
    setIsModalVisible(true);
  };

  const showAddUserModal = (group) => {
    setSelectedGroupForUser(group);
    userForm.resetFields();
    setIsAddUserModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setSelectedGroup(null);
  };

  const handleAddUserCancel = () => {
    userForm.resetFields();
    setIsAddUserModalVisible(false);
    setSelectedGroupForUser(null);
  };

  // Form handlers
  const handleFormSubmit = async (values) => {
    try {
      if (isEditMode && selectedGroup) {
        await GroupService.updateGroup(selectedGroup._id, values);
        message.success("Grupo actualizado con éxito");
      } else {
        await GroupService.createGroup(values);
        message.success("Grupo creado con éxito");
      }
      
      fetchData();
      handleCancel();
    } catch (error) {
      console.error("Error with group operation:", error);
      message.error(isEditMode ? "Error al actualizar el grupo" : "Error al crear el grupo");
    }
  };

  const handleAddUserSubmit = async (values) => {
    try {
      if (!selectedGroupForUser) {
        message.error("No hay grupo seleccionado");
        return;
      }
      
      await GroupService.addUserToGroup(selectedGroupForUser._id, values.userId);
      message.success("Usuario añadido al grupo con éxito");
      
      fetchData();
      handleAddUserCancel();
    } catch (error) {
      console.error("Error adding user to group:", error);
      message.error("Error al añadir usuario al grupo");
    }
  };

  // Delete handlers
  const handleDeleteGroup = async (groupId) => {
    try {
      await GroupService.deleteGroup(groupId);
      message.success("Grupo eliminado con éxito");
      fetchData();
    } catch (error) {
      console.error("Error deleting group:", error);
      message.error("Error al eliminar el grupo");
    }
  };

  const handleRemoveUserFromGroup = async (groupId, userId) => {
    try {
      await GroupService.removeUserFromGroup(groupId, userId);
      message.success("Usuario eliminado del grupo con éxito");
      fetchData();
    } catch (error) {
      console.error("Error removing user from group:", error);
      message.error("Error al eliminar usuario del grupo");
    }
  };

  // Helper functions
  const getUserName = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? user.username : 'Usuario desconocido';
  };

  const getUserEmail = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? user.email : '';
  };

  // Get users not in the group
  const getUsersNotInGroup = (group) => {
    if (!group || !group.user) return users;
    
    const groupUserIds = group.user.map(user => 
      typeof user === 'string' ? user : user._id
    );
    
    return users.filter(user => !groupUserIds.includes(user._id));
  };

  // Table columns
  const columns = [
    {
      title: 'Nombre del Grupo',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Propietario',
      dataIndex: 'ownerId',
      key: 'ownerId',
      render: (ownerId, record) => {
        const ownerName = typeof ownerId === 'string'
          ? getUserName(ownerId)
          : ownerId?.username || 'Desconocido';
        
        const ownerEmail = typeof ownerId === 'string'
          ? getUserEmail(ownerId)
          : ownerId?.email || '';
        
        return (
          <Tooltip title={ownerEmail}>
            <Tag color="blue">{ownerName}</Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Miembros',
      dataIndex: 'user',
      key: 'user',
      render: (users, record) => {
        if (!users || users.length === 0) return 'Sin miembros';
        
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {users.slice(0, 3).map((user, index) => {
              const userId = typeof user === 'string' ? user : user._id;
              const username = typeof user === 'string' ? getUserName(userId) : user.username;
              const email = typeof user === 'string' ? getUserEmail(userId) : user.email;
              
              return (
                <Tooltip title={`${username} (${email})`} key={index}>
                  <Tag closable
                    onClose={(e) => {
                      e.preventDefault();
                      Modal.confirm({
                        title: `¿Quieres eliminar al usuario ${username} del grupo?`,
                        onOk: () => handleRemoveUserFromGroup(record._id, userId),
                      });
                    }}
                  >
                    {username}
                  </Tag>
                </Tooltip>
              );
            })}
            {users.length > 3 && (
              <Tooltip title={`${users.length - 3} usuarios más`}>
                <Tag>+{users.length - 3}</Tag>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: 'Total Miembros',
      dataIndex: 'user',
      key: 'memberCount',
      render: (users) => users?.length || 0,
      sorter: (a, b) => (a.user?.length || 0) - (b.user?.length || 0),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<UserAddOutlined />} 
            onClick={() => showAddUserModal(record)} 
            size="small"
          />
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)} 
            size="small"
          />
          <Popconfirm
            title="¿Estás seguro de eliminar este grupo?"
            onConfirm={() => handleDeleteGroup(record._id)}
            okText="Sí"
            cancelText="No"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <Title level={2}>Gestión de Grupos</Title>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={showCreateModal}
          >
            Nuevo Grupo
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchData}
            loading={loading}
          >
            Actualizar
          </Button>
        </Space>
      </div>

      <Card>
        <Table 
          dataSource={groups}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: record => (
              <div>
                <Title level={5}>Miembros del Grupo</Title>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: 16 }}>
                  {record.user && record.user.length > 0 ? record.user.map((user, index) => {
                    const userId = typeof user === 'string' ? user : user._id;
                    const username = typeof user === 'string' ? getUserName(userId) : user.username;
                    const email = typeof user === 'string' ? getUserEmail(userId) : user.email;
                    
                    return (
                      <Tag 
                        key={index} 
                        closable
                        onClose={() => handleRemoveUserFromGroup(record._id, userId)}
                        style={{ margin: '4px' }}
                      >
                        {username} ({email})
                      </Tag>
                    );
                  }) : <Text type="secondary">Sin miembros</Text>}
                </div>
                <Space>
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<UserAddOutlined />}
                    onClick={() => showAddUserModal(record)}
                  >
                    Añadir Usuario
                  </Button>
                </Space>
              </div>
            ),
          }}
        />
      </Card>

      {/* Create/Edit Group Modal */}
      <Modal
        title={isEditMode ? `Editar Grupo: ${selectedGroup?.name}` : "Nuevo Grupo"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
          <Form.Item
            name="name"
            label="Nombre del Grupo"
            rules={[{ required: true, message: "Por favor, ingresa el nombre del grupo" }]}
          >
            <Input placeholder="Nombre del Grupo" />
          </Form.Item>

          <Form.Item
            name="user"
            label="Miembros"
          >
            <Select
              mode="multiple"
              placeholder="Selecciona usuarios (opcional)"
              style={{ width: '100%' }}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {users.map(user => (
                <Option key={user._id} value={user._id}>
                  {user.username} ({user.email})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: '100%' }}
              loading={loading}
            >
              {isEditMode ? "Actualizar Grupo" : "Crear Grupo"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add User to Group Modal */}
      <Modal
        title={`Añadir Usuario a ${selectedGroupForUser?.name || 'Grupo'}`}
        open={isAddUserModalVisible}
        onCancel={handleAddUserCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={userForm}
          layout="vertical"
          onFinish={handleAddUserSubmit}
        >
          <Form.Item
            name="userId"
            label="Usuario"
            rules={[{ required: true, message: "Por favor, selecciona un usuario" }]}
          >
            <Select
              placeholder="Selecciona un usuario"
              style={{ width: '100%' }}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {getUsersNotInGroup(selectedGroupForUser).map(user => (
                <Option key={user._id} value={user._id}>
                  {user.username} ({user.email})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: '100%' }}
              loading={loading}
              disabled={getUsersNotInGroup(selectedGroupForUser).length === 0}
            >
              Añadir Usuario
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminGroupsPage;