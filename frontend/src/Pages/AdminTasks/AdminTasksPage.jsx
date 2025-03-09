// src/pages/AdminTasks/AdminTasksPage.jsx
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
  Tag, 
  Tooltip, 
  Typography,
  Input,
  DatePicker,
  Popconfirm
} from "antd";
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ReloadOutlined
} from "@ant-design/icons";
import TaskService from "../../services/taskService";
import GroupService from "../../services/groupService";
import UserService from "../../services/userService";
import moment from "moment";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AdminTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [form] = Form.useForm();

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all tasks
      const tasksData = await TaskService.getAllTasks();
      setTasks(tasksData);
      
      // Fetch all users
      const usersData = await UserService.getAllUsers();
      setUsers(usersData);
      
      // Fetch all groups
      const groupsData = await GroupService.getAllGroups();
      setGroups(groupsData);
      
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
    setSelectedTask(null);
    setSelectedGroupId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showGroupTaskModal = (groupId) => {
    setIsEditMode(false);
    setSelectedTask(null);
    setSelectedGroupId(groupId);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (task) => {
    setIsEditMode(true);
    setSelectedTask(task);
    setSelectedGroupId(task.groupId);
    
    // Format date for DatePicker
    const formattedTask = {
      ...task,
      dead_line: task.dead_line ? moment(task.dead_line) : null,
      assignedTo: task.assignedTo?.map(user => typeof user === 'string' ? user : user._id)
    };
    
    form.setFieldsValue(formattedTask);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setSelectedTask(null);
    setSelectedGroupId(null);
  };

  // Form handlers
  const handleFormSubmit = async (values) => {
    try {
      const formattedValues = {
        ...values,
        dead_line: values.dead_line.toISOString()
      };
      
      if (selectedGroupId) {
        formattedValues.groupId = selectedGroupId;
      }
      
      if (isEditMode && selectedTask) {
        await TaskService.updateTask(selectedTask._id, formattedValues);
        message.success("Tarea actualizada con éxito");
      } else if (selectedGroupId) {
        await TaskService.createGroupTask(formattedValues);
        message.success("Tarea de grupo creada con éxito");
      } else {
        await TaskService.createPersonalTask(formattedValues);
        message.success("Tarea personal creada con éxito");
      }
      
      fetchData();
      handleCancel();
    } catch (error) {
      console.error("Error with task operation:", error);
      message.error(isEditMode ? "Error al actualizar la tarea" : "Error al crear la tarea");
    }
  };

  // Delete handler
  const handleDeleteTask = async (taskId) => {
    try {
      await TaskService.deleteTask(taskId);
      message.success("Tarea eliminada con éxito");
      fetchData();
    } catch (error) {
      console.error("Error deleting task:", error);
      message.error("Error al eliminar la tarea");
    }
  };

  // User and group helpers
  const getUserName = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? user.username : 'Usuario desconocido';
  };

  const getGroupName = (groupId) => {
    const group = groups.find(g => g._id === groupId);
    return group ? group.name : 'Grupo desconocido';
  };

  // Table columns
  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name_task',
      key: 'name_task',
      sorter: (a, b) => a.name_task.localeCompare(b.name_task),
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text.length > 30 ? `${text.substring(0, 30)}...` : text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'blue';
        if (status === 'Done') color = 'green';
        if (status === 'Paused') color = 'orange';
        if (status === 'Review') color = 'purple';
        
        return <Tag color={color}>{status}</Tag>;
      },
      filters: [
        { text: 'En Progreso', value: 'In Progress' },
        { text: 'Hecho', value: 'Done' },
        { text: 'Pausado', value: 'Paused' },
        { text: 'Revisión', value: 'Review' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Fecha Límite',
      dataIndex: 'dead_line',
      key: 'dead_line',
      render: (date) => moment(date).format('DD/MM/YYYY'),
      sorter: (a, b) => moment(a.dead_line).valueOf() - moment(b.dead_line).valueOf(),
    },
    {
      title: 'Categoría',
      dataIndex: 'category',
      key: 'category',
      render: (category) => category || 'Sin categoría',
    },
    {
      title: 'Creado por',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId) => getUserName(userId),
    },
    {
      title: 'Grupo',
      dataIndex: 'groupId',
      key: 'groupId',
      render: (groupId) => groupId ? getGroupName(groupId) : 'Personal',
      filters: [
        { text: 'Personal', value: 'personal' },
        ...groups.map(group => ({ text: group.name, value: group._id })),
      ],
      onFilter: (value, record) => {
        if (value === 'personal') return !record.groupId;
        return record.groupId === value;
      },
    },
    {
      title: 'Asignada a',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (assignedTo) => {
        if (!assignedTo || assignedTo.length === 0) return 'Sin asignar';
        
        const assignedUsers = assignedTo.map(user => {
          const userId = typeof user === 'string' ? user : user._id;
          return getUserName(userId);
        });
        
        return assignedUsers.join(', ');
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)} 
            size="small"
          />
          <Popconfirm
            title="¿Estás seguro de eliminar esta tarea?"
            onConfirm={() => handleDeleteTask(record._id)}
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

  // Group selection for filter
  const groupFilterOptions = [
    { label: 'Todas las tareas', value: 'all' },
    { label: 'Tareas personales', value: 'personal' },
    ...groups.map(group => ({
      label: group.name,
      value: group._id
    }))
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <Title level={2}>Gestión de Tareas</Title>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={showCreateModal}
          >
            Nueva Tarea
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
      
      <Card title="Crear tareas para grupos" style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Selecciona un grupo para crear una tarea y asignarla a sus miembros:</Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {groups.map(group => (
              <Button 
                key={group._id}
                onClick={() => showGroupTaskModal(group._id)}
              >
                {group.name}
              </Button>
            ))}
          </div>
        </Space>
      </Card>

      <Card>
        <Table 
          dataSource={tasks}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: record => (
              <p style={{ margin: 0 }}>
                <strong>Descripción completa:</strong> {record.description}
              </p>
            ),
          }}
        />
      </Card>

      <Modal
        title={
          isEditMode 
            ? "Editar Tarea" 
            : selectedGroupId 
              ? `Nueva Tarea para ${getGroupName(selectedGroupId)}` 
              : "Nueva Tarea Personal"
        }
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
            name="name_task"
            label="Nombre de la Tarea"
            rules={[{ required: true, message: "Por favor, ingresa el nombre de la tarea" }]}
          >
            <Input placeholder="Nombre de la Tarea" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Descripción"
            rules={[{ required: true, message: "Por favor, ingresa una descripción" }]}
          >
            <TextArea placeholder="Descripción" rows={4} />
          </Form.Item>

          <Form.Item
            name="dead_line"
            label="Fecha Límite"
            rules={[{ required: true, message: "Por favor, selecciona una fecha" }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Estado"
            initialValue="In Progress"
          >
            <Select>
              <Option value="In Progress">En Progreso</Option>
              <Option value="Done">Hecho</Option>
              <Option value="Paused">Pausado</Option>
              <Option value="Review">Revisión</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="category"
            label="Categoría"
          >
            <Input placeholder="Categoría" />
          </Form.Item>

          {/* Solo mostrar selección de usuarios si es tarea de grupo */}
          {(selectedGroupId || (isEditMode && selectedTask?.groupId)) && (
            <Form.Item
              name="assignedTo"
              label="Asignar a"
              rules={[{ required: true, message: "Por favor, selecciona al menos un usuario" }]}
            >
              <Select
                mode="multiple"
                placeholder="Selecciona usuarios"
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
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: '100%' }}
              loading={loading}
            >
              {isEditMode ? "Actualizar Tarea" : "Crear Tarea"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminTasksPage;